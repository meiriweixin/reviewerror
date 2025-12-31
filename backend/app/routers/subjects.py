"""
Custom Subjects Router
Handles CRUD operations for user-defined custom subjects
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel

from app.routers.auth import get_current_user
from app.services.supabase_db_service import supabase_db

router = APIRouter(prefix="/subjects", tags=["subjects"])


class CustomSubjectCreate(BaseModel):
    name: str


class CustomSubjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: str


@router.get("/custom", response_model=List[CustomSubjectResponse])
async def get_custom_subjects(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get all custom subjects for the current user"""
    subjects = await supabase_db.get_custom_subjects(current_user['id'])
    return subjects


@router.post("/custom", response_model=CustomSubjectResponse)
async def create_custom_subject(
    subject: CustomSubjectCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new custom subject"""
    name = subject.name.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Subject name cannot be empty")

    if len(name) > 50:
        raise HTTPException(status_code=400, detail="Subject name cannot exceed 50 characters")

    # Check if subject already exists for user
    existing = await supabase_db.get_custom_subject_by_name(current_user['id'], name)
    if existing:
        raise HTTPException(status_code=400, detail="Subject already exists")

    # Create the subject
    new_subject = await supabase_db.create_custom_subject(current_user['id'], name)

    if not new_subject:
        raise HTTPException(status_code=500, detail="Failed to create subject")

    return new_subject


@router.delete("/custom/{subject_id}")
async def delete_custom_subject(
    subject_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a custom subject"""
    success = await supabase_db.delete_custom_subject(subject_id, current_user['id'])

    if not success:
        raise HTTPException(status_code=404, detail="Subject not found or not owned by user")

    return {"message": "Subject deleted successfully"}
