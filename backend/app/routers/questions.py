from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import uuid
import shutil
import tempfile
import io
from PIL import Image

from app.services.supabase_db_service import supabase_db
from app.schemas import (
    QuestionResponse,
    QuestionUpdate,
    UploadResponse,
    QuestionSearchRequest,
    ExplanationFeedbackRequest
)
from app.routers.auth import get_current_user
from app.services.azure_ai_service import azure_ai_service
from app.services.supabase_service import supabase_service
from app.services.supabase_storage_service import supabase_storage
from app.config import settings

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_question_paper(
    files: List[UploadFile] = File(...),
    subject: str = Form(...),
    grade: str = Form(None),
    category: str = Form(None),
    wrong_only: str = Form("true"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload and analyze question paper images (supports single or multiple images)
    Extracts questions using Azure GPT-4o Vision
    - wrong_only=true (default): Extract only wrongly answered questions (marked with ✗)
    - wrong_only=false: Extract ALL questions from the images
    - Supports up to 5 images per batch for questions spanning multiple pages
    Images are stored in Supabase Storage for persistence
    """
    # Convert string to boolean
    extract_wrong_only = wrong_only.lower() == "true"
    temp_file_paths = []
    crop_temp_paths = []

    try:
        # Validate we have at least one file
        if not files or len(files) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one file must be uploaded"
            )

        # Validate maximum 5 files
        if len(files) > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 5 images allowed per upload"
            )

        # Validate all files are images
        for file in files:
            if not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File {file.filename} must be an image"
                )

        # Process all files - save to temp and upload to storage
        image_urls = []
        unique_filenames = []

        for file in files:
            # Read file data into memory
            file_data = await file.read()

            # Generate unique filename
            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            unique_filenames.append(unique_filename)

            # Save to temporary file for Azure AI processing
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
                temp_file.write(file_data)
                temp_file_paths.append(temp_file.name)

            # Upload to Supabase Storage for persistence
            try:
                image_url = await supabase_storage.upload_image(
                    file_data=file_data,
                    filename=unique_filename,
                    content_type=file.content_type
                )
                image_urls.append(image_url)
                print(f"✅ Image {len(image_urls)} uploaded to Supabase Storage: {image_url}")
            except Exception as e:
                print(f"❌ Supabase Storage upload failed for image {len(image_urls)+1}, using local fallback: {e}")
                # Fallback to local storage if Supabase fails
                upload_dir = settings.UPLOAD_DIR
                os.makedirs(upload_dir, exist_ok=True)
                local_file_path = os.path.join(upload_dir, unique_filename)
                with open(local_file_path, "wb") as buffer:
                    buffer.write(file_data)
                image_url = f"/uploads/{unique_filename}"
                image_urls.append(image_url)

        # Create upload history record (single record for batch)
        batch_filename = f"batch_{len(files)}_images" if len(files) > 1 else unique_filenames[0]
        upload_record = await supabase_db.create_upload_history(
            user_id=current_user['id'],
            filename=batch_filename,
            subject=subject,
            status="processing"
        )

        try:
            # Track total tokens used
            total_prompt_tokens = 0
            total_completion_tokens = 0
            total_tokens = 0

            # Get user's preferred model
            user_model = current_user.get('preferred_model', 'gpt-4o')

            # Analyze images with Azure AI Vision
            if len(files) == 1:
                # Single image - use original method for backward compatibility
                analysis_result = await azure_ai_service.analyze_question_paper(
                    temp_file_paths[0],
                    subject,
                    wrong_only=extract_wrong_only,
                    model=user_model
                )
            else:
                # Multiple images - use batch processing
                print(f"🔄 Analyzing {len(files)} images in batch...")
                analysis_result = await azure_ai_service.analyze_question_paper_batch(
                    temp_file_paths,
                    subject,
                    wrong_only=extract_wrong_only,
                    model=user_model
                )

            # Track tokens from image analysis
            if "tokens_used" in analysis_result:
                tokens = analysis_result["tokens_used"]
                total_prompt_tokens += tokens.get("prompt_tokens", 0)
                total_completion_tokens += tokens.get("completion_tokens", 0)
                total_tokens += tokens.get("total_tokens", 0)

            wrong_questions = analysis_result.get("wrong_questions", [])
            questions_created = []

            # Process each wrong question
            for q_data in wrong_questions:
                question_text = q_data.get("question_text", "")
                if not question_text:
                    continue

                # Get image index for this question (default to 0 if not present)
                image_index = q_data.get("image_index", 0)
                # Ensure image_index is within valid range
                if image_index >= len(image_urls):
                    image_index = 0
                question_image_url = image_urls[image_index]

                # Step 1: Crop the image FIRST so we can use it for text verification and explanation
                crop_y_start = q_data.get("crop_y_start")
                crop_y_end = q_data.get("crop_y_end")
                snippet_url = None
                crop_temp_path = None
                cropped_bytes = None

                if crop_y_start is not None and crop_y_end is not None:
                    try:
                        source_image_path = temp_file_paths[image_index] if image_index < len(temp_file_paths) else temp_file_paths[0]
                        with Image.open(source_image_path) as img:
                            w, h = img.size
                            top = int(h * max(0, crop_y_start) / 100)
                            bottom = int(h * min(100, crop_y_end) / 100)
                            if bottom > top + 10:  # Ensure meaningful crop
                                cropped = img.crop((0, top, w, bottom))
                                buf = io.BytesIO()
                                cropped.save(buf, format="JPEG", quality=90)
                                cropped_bytes = buf.getvalue()

                                # Save cropped image to temp file for AI processing
                                crop_temp_path = os.path.join(tempfile.gettempdir(), f"crop_{uuid.uuid4()}.jpg")
                                with open(crop_temp_path, 'wb') as f:
                                    f.write(cropped_bytes)
                                crop_temp_paths.append(crop_temp_path)

                                # Upload cropped image to Supabase Storage
                                crop_filename = f"crop_{uuid.uuid4()}.jpg"
                                snippet_url = await supabase_storage.upload_image(
                                    file_data=cropped_bytes,
                                    filename=crop_filename,
                                    content_type="image/jpeg"
                                )
                                print(f"✅ Cropped image uploaded: {snippet_url} (y: {crop_y_start}-{crop_y_end}%)")
                    except Exception as e:
                        print(f"Warning: Failed to crop image: {e}")
                        snippet_url = None
                        crop_temp_path = None

                # Step 2: Re-extract question text from cropped image to verify accuracy
                if crop_temp_path:
                    try:
                        snippet_result = await azure_ai_service.extract_question_from_snippet(
                            crop_temp_path, subject, model=user_model
                        )
                        snippet_tokens = snippet_result.get("tokens_used", {})
                        total_prompt_tokens += snippet_tokens.get("prompt_tokens", 0)
                        total_completion_tokens += snippet_tokens.get("completion_tokens", 0)
                        total_tokens += snippet_tokens.get("total_tokens", 0)

                        re_extracted_text = snippet_result.get("question_text")
                        if re_extracted_text and len(re_extracted_text.strip()) > 10:
                            print(f"🔄 Re-extracted question text from snippet (was: '{question_text[:50]}...' -> now: '{re_extracted_text[:50]}...')")
                            question_text = re_extracted_text
                    except Exception as e:
                        print(f"Warning: Failed to re-extract question text from snippet: {e}")

                # Step 3: Generate AI explanation with image context
                explanation, explain_tokens = await azure_ai_service.explain_question(
                    question_text,
                    subject,
                    grade or current_user.get('grade'),
                    model=user_model,
                    image_path=crop_temp_path  # Pass cropped image for visual context
                )

                # Track explanation tokens
                total_prompt_tokens += explain_tokens.get("prompt_tokens", 0)
                total_completion_tokens += explain_tokens.get("completion_tokens", 0)
                total_tokens += explain_tokens.get("total_tokens", 0)

                # Step 4: Generate embedding for vector search (using corrected text)
                embedding, embedding_tokens = await azure_ai_service.generate_embedding(question_text)

                # Track embedding tokens
                total_prompt_tokens += embedding_tokens.get("prompt_tokens", 0)
                total_completion_tokens += embedding_tokens.get("completion_tokens", 0)
                total_tokens += embedding_tokens.get("total_tokens", 0)

                # Create question record with Supabase Storage URL
                question = await supabase_db.create_question(
                    user_id=current_user['id'],
                    subject=subject,
                    grade=grade or current_user.get('grade'),
                    category=category,
                    question_text=question_text,
                    image_url=question_image_url,  # Full page image
                    image_snippet_url=snippet_url,  # Cropped per-question image
                    explanation=explanation,
                    status="pending",
                    question_metadata={"crop_y_start": crop_y_start, "crop_y_end": crop_y_end} if crop_y_start is not None else None
                )

                # Store embedding in Supabase
                try:
                    vector_id = await supabase_service.store_question_embedding(
                        user_id=current_user['id'],
                        question_id=question['id'],
                        question_text=question_text,
                        embedding=embedding,
                        subject=subject,
                        grade=grade or current_user.get('grade'),
                        metadata={
                            "topic": q_data.get("topic", ""),
                            "question_number": q_data.get("question_number", ""),
                            "image_index": image_index,
                            "batch_total_images": len(files)
                        }
                    )
                    # Update question with vector_id
                    await supabase_db.update_question(question['id'], vector_id=vector_id)
                except Exception as e:
                    print(f"Warning: Failed to store embedding: {e}")

                questions_created.append(question)

            # Update upload history
            await supabase_db.update_upload_history(
                upload_id=upload_record['id'],
                questions_extracted=len(questions_created),
                status="completed"
            )

            # Track token usage for the user
            if total_tokens > 0:
                try:
                    await supabase_db.add_token_usage(
                        user_id=current_user['id'],
                        prompt_tokens=total_prompt_tokens,
                        completion_tokens=total_completion_tokens,
                        total_tokens=total_tokens
                    )
                except Exception as e:
                    print(f"Warning: Failed to track token usage: {e}")

            # Create upload completion notification
            try:
                notification_message = f"Successfully extracted {len(questions_created)} question(s) from {len(files)} image(s) in {subject}" if len(files) > 1 else f"Successfully extracted {len(questions_created)} question(s) from {subject}"

                await supabase_db.create_notification(
                    user_id=current_user['id'],
                    notification_type="upload_complete",
                    title="Upload Complete!" if len(files) == 1 else "Batch Upload Complete!",
                    message=notification_message,
                    upload_id=upload_record['id'],
                    priority="normal",
                    notification_data={
                        "questions_count": len(questions_created),
                        "images_count": len(files),
                        "subject": subject,
                        "filename": batch_filename
                    },
                    action_url="/review?status=pending",
                    action_label="Review Questions"
                )
            except Exception as e:
                print(f"Warning: Failed to create upload notification: {e}")

            # Success message
            success_message = f"Successfully extracted {len(questions_created)} question(s) from {len(files)} image(s)" if len(files) > 1 else f"Successfully extracted {len(questions_created)} wrong question(s)"

            return UploadResponse(
                message=success_message,
                questions_count=len(questions_created),
                upload_id=upload_record['id']
            )

        except Exception as e:
            # Update upload history with error
            await supabase_db.update_upload_history(
                upload_id=upload_record['id'],
                status="failed",
                error_message=str(e)
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process images: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )
    finally:
        # Clean up all temporary files
        for temp_file_path in temp_file_paths + crop_temp_paths:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass

@router.post("/capture", response_model=QuestionResponse)
async def capture_question_from_paper(
    file: UploadFile = File(...),
    subject: str = Form(...),
    grade: str = Form(None),
    category: str = Form(None),
    note: str = Form(None),
    source_paper_id: int = Form(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Capture a question from a PDF paper (simplified mock approach)
    User uploads a screenshot/snippet of the question from the PDF
    The question is added to their Review list with a link to the source paper
    """
    temp_file_path = None

    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Read file data into memory
        file_data = await file.read()

        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"snippet_{uuid.uuid4()}{file_ext}"

        # Upload snippet image to Supabase Storage
        try:
            snippet_url = await supabase_storage.upload_image(
                file_data=file_data,
                filename=unique_filename,
                content_type=file.content_type
            )
            print(f"✅ Snippet uploaded to Supabase Storage: {snippet_url}")
        except Exception as e:
            print(f"❌ Supabase Storage upload failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload snippet to storage"
            )

        # Save to temporary file for optional AI processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            temp_file.write(file_data)
            temp_file_path = temp_file.name

        # Use note as question text if provided, otherwise use placeholder
        question_text = note if note else "Question captured from paper"

        # Track total tokens used
        total_prompt_tokens = 0
        total_completion_tokens = 0
        total_tokens = 0

        # Optionally generate explanation (skip if note is empty for faster capture)
        explanation = None
        if note:
            try:
                # Get user's preferred model
                user_model = current_user.get('preferred_model', 'gpt-4o')

                explanation, tokens_used = await azure_ai_service.explain_question(
                    question_text,
                    subject,
                    grade or current_user.get('grade'),
                    model=user_model
                )
                total_prompt_tokens += tokens_used.get("prompt_tokens", 0)
                total_completion_tokens += tokens_used.get("completion_tokens", 0)
                total_tokens += tokens_used.get("total_tokens", 0)
            except Exception as e:
                print(f"Warning: Failed to generate explanation: {e}")
                explanation = None

        # Create question record
        question = await supabase_db.create_question(
            user_id=current_user['id'],
            subject=subject,
            question_text=question_text,
            grade=grade or current_user.get('grade'),
            category=category,
            image_url=snippet_url,
            image_snippet_url=snippet_url,
            explanation=explanation,
            status="pending",
            source_paper_id=source_paper_id
        )

        # Track token usage if any
        if total_tokens > 0:
            try:
                await supabase_db.add_token_usage(
                    user_id=current_user['id'],
                    prompt_tokens=total_prompt_tokens,
                    completion_tokens=total_completion_tokens,
                    total_tokens=total_tokens
                )
            except Exception as e:
                print(f"Warning: Failed to track token usage: {e}")

        return QuestionResponse(**question)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error capturing question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to capture question: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

@router.get("/wrong", response_model=List[QuestionResponse])
async def get_wrong_questions(
    subject: Optional[str] = None,
    grade: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all wrong questions with optional filters"""
    # Get questions from Supabase
    questions = await supabase_db.get_questions_by_user(
        user_id=current_user['id'],
        status=status,
        subject=subject,
        category=category
    )

    # Apply additional filters (date, grade) in memory
    filtered_questions = questions

    if grade:
        filtered_questions = [q for q in filtered_questions if q.get('grade') == grade]

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            filtered_questions = [q for q in filtered_questions
                                 if datetime.fromisoformat(q.get('created_at', '')) >= start_dt]
        except (ValueError, TypeError):
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            filtered_questions = [q for q in filtered_questions
                                 if datetime.fromisoformat(q.get('created_at', '')) <= end_dt]
        except (ValueError, TypeError):
            pass

    return [QuestionResponse(**q) for q in filtered_questions]

@router.post("/search", response_model=List[QuestionResponse])
async def search_questions(
    search_request: QuestionSearchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Search questions using vector similarity (semantic search)"""
    try:
        # Generate embedding for search query
        query_embedding = await azure_ai_service.generate_embedding(search_request.query)

        # Search in Supabase vector DB
        similar_questions = await supabase_service.search_similar_questions(
            user_id=current_user['id'],
            query_embedding=query_embedding,
            limit=search_request.limit
        )

        # Get question IDs from vector search results
        question_ids = [q.get("question_id") for q in similar_questions if q.get("question_id")]

        if not question_ids:
            # Fallback to simple text search
            all_questions = await supabase_db.get_questions_by_user(
                user_id=current_user['id'],
                limit=search_request.limit
            )
            # Filter by text match
            questions = [q for q in all_questions
                        if search_request.query.lower() in q.get('question_text', '').lower()]
        else:
            # Get questions by IDs from vector search
            questions = []
            for qid in question_ids:
                q = await supabase_db.get_question_by_id(qid)
                if q and q.get('user_id') == current_user['id']:
                    questions.append(q)

        return [QuestionResponse(**q) for q in questions]

    except Exception as e:
        # Fallback to simple text search on error
        all_questions = await supabase_db.get_questions_by_user(
            user_id=current_user['id'],
            limit=search_request.limit
        )
        # Filter by text match
        questions = [q for q in all_questions
                    if search_request.query.lower() in q.get('question_text', '').lower()]

        return [QuestionResponse(**q) for q in questions]

@router.post("/{question_id}/regenerate", response_model=QuestionResponse)
async def regenerate_explanation(
    question_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Regenerate AI explanation for a question"""
    question = await supabase_db.get_question_by_id(question_id)

    if not question or question.get('user_id') != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    try:
        # Get user's preferred model
        user_model = current_user.get('preferred_model', 'gpt-5-chat')

        # Generate new explanation using user's preferred model
        new_explanation, tokens_used = await azure_ai_service.explain_question(
            question.get('question_text'),
            question.get('subject'),
            question.get('grade'),
            model=user_model
        )

        # Update question with new explanation
        updated_question = await supabase_db.update_question(
            question_id,
            explanation=new_explanation
        )

        # Track token usage
        try:
            await supabase_db.add_token_usage(
                user_id=current_user['id'],
                prompt_tokens=tokens_used.get("prompt_tokens", 0),
                completion_tokens=tokens_used.get("completion_tokens", 0),
                total_tokens=tokens_used.get("total_tokens", 0)
            )
        except Exception as e:
            print(f"Warning: Failed to track token usage: {e}")

        return QuestionResponse(**updated_question)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate explanation: {str(e)}"
        )

@router.post("/{question_id}/feedback", response_model=QuestionResponse)
async def submit_explanation_feedback(
    question_id: int,
    feedback_request: ExplanationFeedbackRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submit feedback about an AI explanation and regenerate with corrections.

    The feedback helps the AI understand what was wrong and generate a corrected explanation.
    """
    question = await supabase_db.get_question_by_id(question_id)

    if not question or question.get('user_id') != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    feedback = feedback_request.feedback.strip()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback text is required"
        )

    try:
        # Get user's preferred model
        user_model = current_user.get('preferred_model', 'gpt-4o')

        # Generate corrected explanation using user's feedback
        corrected_explanation, tokens_used = await azure_ai_service.regenerate_with_feedback(
            question_text=question.get('question_text'),
            current_explanation=question.get('explanation', ''),
            feedback=feedback,
            subject=question.get('subject'),
            grade=question.get('grade'),
            model=user_model
        )

        # Update question with corrected explanation
        updated_question = await supabase_db.update_question(
            question_id,
            explanation=corrected_explanation
        )

        # Track token usage
        try:
            await supabase_db.add_token_usage(
                user_id=current_user['id'],
                prompt_tokens=tokens_used.get("prompt_tokens", 0),
                completion_tokens=tokens_used.get("completion_tokens", 0),
                total_tokens=tokens_used.get("total_tokens", 0)
            )
        except Exception as e:
            print(f"Warning: Failed to track token usage: {e}")

        return QuestionResponse(**updated_question)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to regenerate explanation with feedback: {str(e)}"
        )

@router.post("/{question_id}/correct-answer", response_model=QuestionResponse)
async def upload_correct_answer(
    question_id: int,
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload the correct answer image for a question.
    The image is stored in Supabase Storage.
    """
    question = await supabase_db.get_question_by_id(question_id)

    if not question or question.get('user_id') != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )

    try:
        # Read file data
        file_data = await file.read()

        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"correct_answer_{question_id}_{uuid.uuid4()}{file_ext}"

        # Upload to Supabase Storage
        correct_answer_url = await supabase_storage.upload_image(
            file_data=file_data,
            filename=unique_filename,
            content_type=file.content_type
        )

        # Update question with the correct answer URL
        updated_question = await supabase_db.update_question(
            question_id,
            correct_answer_url=correct_answer_url
        )

        return QuestionResponse(**updated_question)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload correct answer: {str(e)}"
        )

@router.delete("/{question_id}/correct-answer", response_model=QuestionResponse)
async def delete_correct_answer(
    question_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete the correct answer image for a question.
    """
    question = await supabase_db.get_question_by_id(question_id)

    if not question or question.get('user_id') != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    try:
        # Delete from Supabase Storage if exists
        correct_answer_url = question.get('correct_answer_url')
        if correct_answer_url and 'supabase' in correct_answer_url:
            try:
                await supabase_storage.delete_image(correct_answer_url)
            except Exception as e:
                print(f"Warning: Failed to delete correct answer image from storage: {e}")

        # Update question to remove the correct answer URL
        updated_question = await supabase_db.update_question(
            question_id,
            correct_answer_url=None
        )

        return QuestionResponse(**updated_question)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete correct answer: {str(e)}"
        )

@router.post("/{question_id}/similar")
async def generate_similar_questions(
    question_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate 3 similar practice questions for the student to try"""
    question = await supabase_db.get_question_by_id(question_id)

    if not question or question.get('user_id') != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    try:
        # Get user's preferred model
        user_model = current_user.get('preferred_model', 'gpt-5-chat')

        # Generate similar questions using user's preferred model
        # Returns dict with 'questions' and 'diagrams' arrays
        result, tokens_used = await azure_ai_service.generate_similar_questions(
            question.get('question_text'),
            question.get('subject'),
            question.get('grade'),
            model=user_model
        )

        # Track token usage
        try:
            await supabase_db.add_token_usage(
                user_id=current_user['id'],
                prompt_tokens=tokens_used.get("prompt_tokens", 0),
                completion_tokens=tokens_used.get("completion_tokens", 0),
                total_tokens=tokens_used.get("total_tokens", 0)
            )
        except Exception as e:
            print(f"Warning: Failed to track token usage: {e}")

        return {
            "question_id": question_id,
            "similar_questions": result.get("questions", []),
            "diagrams": result.get("diagrams", []),
            "tokens_used": tokens_used
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate similar questions: {str(e)}"
        )

@router.put("/{question_id}/status", response_model=QuestionResponse)
async def update_question_status(
    question_id: int,
    update: QuestionUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update question status, explanation, or notes"""
    question = await supabase_db.get_question_by_id(question_id)

    if not question or question.get('user_id') != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Prepare update data
    update_data = {}
    if update.status:
        update_data['status'] = update.status
    if update.explanation:
        update_data['explanation'] = update.explanation
    if update.user_notes is not None:  # Allow empty string to clear notes
        update_data['user_notes'] = update.user_notes

    # Spaced repetition: Calculate next review date based on status transition
    if update.status:
        old_status = question.get('status')
        new_status = update.status

        # Determine performance rating based on status transition
        performance_rating = None

        if new_status == 'understood':
            # User marked as understood
            if old_status == 'pending':
                # First time understanding - rate as 'good'
                performance_rating = 'good'
            elif old_status == 'reviewing':
                # Reviewing -> Understood = successful review
                performance_rating = 'good'
            elif old_status == 'understood':
                # Re-confirming understanding = 'easy'
                performance_rating = 'easy'

        elif new_status == 'reviewing' and old_status == 'understood':
            # User forgot - moving back to reviewing
            performance_rating = 'forgot'

        elif new_status == 'pending' and old_status in ['reviewing', 'understood']:
            # User forgot completely - reset
            performance_rating = 'forgot'

        # Calculate next review date if performance rating determined
        if performance_rating:
            try:
                await supabase_db.calculate_next_review_date(
                    question_id=question_id,
                    performance_rating=performance_rating
                )
            except Exception as e:
                print(f"Warning: Failed to update spaced repetition schedule: {e}")

    # Update question
    updated_question = await supabase_db.update_question(question_id, **update_data)

    return QuestionResponse(**updated_question)

@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific question by ID"""
    question = await supabase_db.get_question_by_id(question_id)

    if not question or question.get('user_id') != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    return QuestionResponse(**question)

@router.delete("/{question_id}")
async def delete_question(
    question_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a question and its associated image from Supabase Storage"""
    question = await supabase_db.get_question_by_id(question_id)

    if not question or question.get('user_id') != current_user['id']:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Delete from vector DB if exists
    vector_id = question.get('vector_id')
    if vector_id:
        try:
            await supabase_service.delete_question_embedding(vector_id)
        except Exception as e:
            print(f"Warning: Failed to delete embedding: {e}")

    # Delete image from Supabase Storage if it's a Supabase URL
    image_url = question.get('image_url')
    if image_url and 'supabase' in image_url:
        try:
            await supabase_storage.delete_image(image_url)
        except Exception as e:
            print(f"Warning: Failed to delete image from Supabase Storage: {e}")

    # Delete question
    await supabase_db.delete_question(question_id)

    return {"message": "Question deleted successfully"}
