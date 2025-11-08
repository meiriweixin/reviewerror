from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List

from app.database import get_db
from app.models import User, Question, UploadHistory, QuestionStatus
from app.schemas import StudentStats, SubjectStats
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=StudentStats)
async def get_student_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overall statistics for the student"""

    # Total questions
    total_result = await db.execute(
        select(func.count(Question.id)).where(Question.user_id == current_user.id)
    )
    total_questions = total_result.scalar() or 0

    # Pending questions
    pending_result = await db.execute(
        select(func.count(Question.id)).where(
            and_(
                Question.user_id == current_user.id,
                Question.status == QuestionStatus.PENDING
            )
        )
    )
    pending_questions = pending_result.scalar() or 0

    # Reviewing questions
    reviewing_result = await db.execute(
        select(func.count(Question.id)).where(
            and_(
                Question.user_id == current_user.id,
                Question.status == QuestionStatus.REVIEWING
            )
        )
    )
    reviewing_questions = reviewing_result.scalar() or 0

    # Understood questions
    understood_result = await db.execute(
        select(func.count(Question.id)).where(
            and_(
                Question.user_id == current_user.id,
                Question.status == QuestionStatus.UNDERSTOOD
            )
        )
    )
    understood_questions = understood_result.scalar() or 0

    # Total uploads
    uploads_result = await db.execute(
        select(func.count(UploadHistory.id)).where(UploadHistory.user_id == current_user.id)
    )
    total_uploads = uploads_result.scalar() or 0

    return StudentStats(
        total_questions=total_questions,
        pending_questions=pending_questions,
        reviewing_questions=reviewing_questions,
        understood_questions=understood_questions,
        total_uploads=total_uploads
    )

@router.get("/by-subject", response_model=List[SubjectStats])
async def get_subject_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics broken down by subject"""

    # Get all unique subjects for the user
    subjects_result = await db.execute(
        select(Question.subject).where(Question.user_id == current_user.id).distinct()
    )
    subjects = subjects_result.scalars().all()

    stats_list = []

    for subject in subjects:
        # Total for this subject
        total_result = await db.execute(
            select(func.count(Question.id)).where(
                and_(
                    Question.user_id == current_user.id,
                    Question.subject == subject
                )
            )
        )
        total = total_result.scalar() or 0

        # Pending
        pending_result = await db.execute(
            select(func.count(Question.id)).where(
                and_(
                    Question.user_id == current_user.id,
                    Question.subject == subject,
                    Question.status == QuestionStatus.PENDING
                )
            )
        )
        pending = pending_result.scalar() or 0

        # Reviewing
        reviewing_result = await db.execute(
            select(func.count(Question.id)).where(
                and_(
                    Question.user_id == current_user.id,
                    Question.subject == subject,
                    Question.status == QuestionStatus.REVIEWING
                )
            )
        )
        reviewing = reviewing_result.scalar() or 0

        # Understood
        understood_result = await db.execute(
            select(func.count(Question.id)).where(
                and_(
                    Question.user_id == current_user.id,
                    Question.subject == subject,
                    Question.status == QuestionStatus.UNDERSTOOD
                )
            )
        )
        understood = understood_result.scalar() or 0

        stats_list.append(SubjectStats(
            subject=subject,
            total_questions=total,
            pending=pending,
            reviewing=reviewing,
            understood=understood
        ))

    # Sort by total questions descending
    stats_list.sort(key=lambda x: x.total_questions, reverse=True)

    return stats_list
