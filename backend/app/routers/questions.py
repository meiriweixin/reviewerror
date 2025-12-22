from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import uuid
import shutil

from app.services.supabase_db_service import supabase_db
from app.schemas import (
    QuestionResponse,
    QuestionUpdate,
    UploadResponse,
    QuestionSearchRequest
)
from app.routers.auth import get_current_user
from app.services.azure_ai_service import azure_ai_service
from app.services.supabase_service import supabase_service
from app.config import settings

router = APIRouter()

@router.post("/upload", response_model=UploadResponse)
async def upload_question_paper(
    file: UploadFile = File(...),
    subject: str = Form(...),
    grade: str = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload and analyze question paper image
    Extracts wrongly answered questions using Azure GPT-4o Vision
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )

        # Create upload directory if not exists
        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)

        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Create upload history record
        upload_record = await supabase_db.create_upload_history(
            user_id=current_user['id'],
            filename=unique_filename,
            subject=subject,
            status="processing"
        )

        try:
            # Track total tokens used
            total_prompt_tokens = 0
            total_completion_tokens = 0
            total_tokens = 0

            # Analyze image with Azure GPT-4o Vision
            analysis_result = await azure_ai_service.analyze_question_paper(
                file_path,
                subject
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

                # Generate AI explanation
                explanation, explain_tokens = await azure_ai_service.explain_question(
                    question_text,
                    subject,
                    grade or current_user.get('grade')
                )

                # Track explanation tokens
                total_prompt_tokens += explain_tokens.get("prompt_tokens", 0)
                total_completion_tokens += explain_tokens.get("completion_tokens", 0)
                total_tokens += explain_tokens.get("total_tokens", 0)

                # Generate embedding for vector search
                embedding, embedding_tokens = await azure_ai_service.generate_embedding(question_text)

                # Track embedding tokens
                total_prompt_tokens += embedding_tokens.get("prompt_tokens", 0)
                total_completion_tokens += embedding_tokens.get("completion_tokens", 0)
                total_tokens += embedding_tokens.get("total_tokens", 0)

                # Create question record
                question = await supabase_db.create_question(
                    user_id=current_user['id'],
                    subject=subject,
                    grade=grade or current_user.get('grade'),
                    question_text=question_text,
                    image_url=f"/uploads/{unique_filename}",
                    explanation=explanation,
                    status="pending"
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
                            "question_number": q_data.get("question_number", "")
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

            return UploadResponse(
                message=f"Successfully extracted {len(questions_created)} wrong question(s)",
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
                detail=f"Failed to process image: {str(e)}"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )

@router.get("/wrong", response_model=List[QuestionResponse])
async def get_wrong_questions(
    subject: Optional[str] = None,
    grade: Optional[str] = None,
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
        subject=subject
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
        # Generate new explanation
        new_explanation, tokens_used = await azure_ai_service.explain_question(
            question.get('question_text'),
            question.get('subject'),
            question.get('grade')
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

@router.put("/{question_id}/status", response_model=QuestionResponse)
async def update_question_status(
    question_id: int,
    update: QuestionUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update question status (pending, reviewing, understood)"""
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
    """Delete a question"""
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

    # Delete question
    await supabase_db.delete_question(question_id)

    return {"message": "Question deleted successfully"}
