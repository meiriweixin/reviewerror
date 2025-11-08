from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional, List
from datetime import datetime
import os
import uuid
import shutil

from app.database import get_db
from app.models import User, Question, UploadHistory, QuestionStatus
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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
        upload_record = UploadHistory(
            user_id=current_user.id,
            filename=unique_filename,
            subject=subject,
            status="processing"
        )
        db.add(upload_record)
        await db.commit()
        await db.refresh(upload_record)

        try:
            # Analyze image with Azure GPT-4o Vision
            analysis_result = await azure_ai_service.analyze_question_paper(
                file_path,
                subject
            )

            wrong_questions = analysis_result.get("wrong_questions", [])
            questions_created = []

            # Process each wrong question
            for q_data in wrong_questions:
                question_text = q_data.get("question_text", "")
                if not question_text:
                    continue

                # Generate AI explanation
                explanation = await azure_ai_service.explain_question(
                    question_text,
                    subject,
                    grade or current_user.grade
                )

                # Generate embedding for vector search
                embedding = await azure_ai_service.generate_embedding(question_text)

                # Create question record
                question = Question(
                    user_id=current_user.id,
                    subject=subject,
                    grade=grade or current_user.grade,
                    question_text=question_text,
                    image_url=f"/uploads/{unique_filename}",
                    explanation=explanation,
                    status=QuestionStatus.PENDING
                )

                db.add(question)
                await db.flush()  # Get the question ID

                # Store embedding in Supabase
                try:
                    vector_id = await supabase_service.store_question_embedding(
                        user_id=current_user.id,
                        question_id=question.id,
                        question_text=question_text,
                        embedding=embedding,
                        subject=subject,
                        grade=grade or current_user.grade,
                        metadata={
                            "topic": q_data.get("topic", ""),
                            "question_number": q_data.get("question_number", "")
                        }
                    )
                    question.vector_id = vector_id
                except Exception as e:
                    print(f"Warning: Failed to store embedding: {e}")

                questions_created.append(question)

            # Update upload history
            upload_record.questions_extracted = len(questions_created)
            upload_record.status = "completed"

            await db.commit()

            return UploadResponse(
                message=f"Successfully extracted {len(questions_created)} wrong question(s)",
                questions_count=len(questions_created),
                upload_id=upload_record.id
            )

        except Exception as e:
            # Update upload history with error
            upload_record.status = "failed"
            upload_record.error_message = str(e)
            await db.commit()

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
    status: Optional[QuestionStatus] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all wrong questions with optional filters"""
    query = select(Question).where(Question.user_id == current_user.id)

    if subject:
        query = query.where(Question.subject == subject)

    if grade:
        query = query.where(Question.grade == grade)

    if status:
        query = query.where(Question.status == status)

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.where(Question.created_at >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.where(Question.created_at <= end_dt)
        except ValueError:
            pass

    query = query.order_by(Question.created_at.desc())

    result = await db.execute(query)
    questions = result.scalars().all()

    return [QuestionResponse.from_orm(q) for q in questions]

@router.get("/{question_id}", response_model=QuestionResponse)
async def get_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific question by ID"""
    result = await db.execute(
        select(Question).where(
            and_(
                Question.id == question_id,
                Question.user_id == current_user.id
            )
        )
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    return QuestionResponse.from_orm(question)

@router.put("/{question_id}/status", response_model=QuestionResponse)
async def update_question_status(
    question_id: int,
    update: QuestionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update question status (pending, reviewing, understood)"""
    result = await db.execute(
        select(Question).where(
            and_(
                Question.id == question_id,
                Question.user_id == current_user.id
            )
        )
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    if update.status:
        question.status = update.status

    if update.explanation:
        question.explanation = update.explanation

    question.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(question)

    return QuestionResponse.from_orm(question)

@router.post("/search", response_model=List[QuestionResponse])
async def search_questions(
    search_request: QuestionSearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Search questions using vector similarity (semantic search)"""
    try:
        # Generate embedding for search query
        query_embedding = await azure_ai_service.generate_embedding(search_request.query)

        # Search in Supabase vector DB
        similar_questions = await supabase_service.search_similar_questions(
            user_id=current_user.id,
            query_embedding=query_embedding,
            limit=search_request.limit
        )

        # Get question IDs from vector search results
        question_ids = [q.get("question_id") for q in similar_questions if q.get("question_id")]

        if not question_ids:
            # Fallback to simple text search
            query = select(Question).where(
                and_(
                    Question.user_id == current_user.id,
                    Question.question_text.contains(search_request.query)
                )
            ).limit(search_request.limit)

            result = await db.execute(query)
            questions = result.scalars().all()
        else:
            # Get questions by IDs from vector search
            query = select(Question).where(
                and_(
                    Question.user_id == current_user.id,
                    Question.id.in_(question_ids)
                )
            )

            result = await db.execute(query)
            questions = result.scalars().all()

        return [QuestionResponse.from_orm(q) for q in questions]

    except Exception as e:
        # Fallback to simple text search on error
        query = select(Question).where(
            and_(
                Question.user_id == current_user.id,
                Question.question_text.contains(search_request.query)
            )
        ).limit(search_request.limit)

        result = await db.execute(query)
        questions = result.scalars().all()

        return [QuestionResponse.from_orm(q) for q in questions]

@router.delete("/{question_id}")
async def delete_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a question"""
    result = await db.execute(
        select(Question).where(
            and_(
                Question.id == question_id,
                Question.user_id == current_user.id
            )
        )
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Delete from vector DB if exists
    if question.vector_id:
        try:
            await supabase_service.delete_question_embedding(question.vector_id)
        except Exception as e:
            print(f"Warning: Failed to delete embedding: {e}")

    await db.delete(question)
    await db.commit()

    return {"message": "Question deleted successfully"}
