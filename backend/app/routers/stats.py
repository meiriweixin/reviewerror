from fastapi import APIRouter, Depends
from typing import List, Dict, Any

from app.services.supabase_db_service import supabase_db
from app.schemas import StudentStats, SubjectStats
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=StudentStats)
async def get_student_stats(
    grade: str = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get overall statistics for the student with optional grade filter"""

    # Get comprehensive user stats from Supabase (filtered by grade if provided)
    stats = await supabase_db.get_user_stats(current_user['id'], grade=grade)

    # Get upload history count
    uploads = await supabase_db.get_upload_history_by_user(current_user['id'])

    return StudentStats(
        total_questions=stats.get('total_questions', 0),
        pending_questions=stats.get('pending', 0),
        reviewing_questions=stats.get('reviewing', 0),
        understood_questions=stats.get('understood', 0),
        total_uploads=len(uploads)
    )

@router.get("/by-subject", response_model=List[SubjectStats])
async def get_subject_stats(
    grade: str = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get statistics broken down by subject with optional grade filter"""

    # Get subject statistics from Supabase (filtered by grade if provided)
    subject_stats = await supabase_db.get_subject_stats(current_user['id'], grade=grade)

    # Convert to response model
    stats_list = [
        SubjectStats(
            subject=stat['subject'],
            total_questions=stat['total'],
            pending=stat['pending'],
            reviewing=stat['reviewing'],
            understood=stat['understood']
        )
        for stat in subject_stats
    ]

    # Sort by total questions descending
    stats_list.sort(key=lambda x: x.total_questions, reverse=True)

    return stats_list
