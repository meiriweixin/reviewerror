"""
Admin-only user management router
Only users with is_admin=True can access these endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from app.services.supabase_db_service import supabase_db
from app.schemas import AdminUserCreate, UserListResponse
from app.routers.auth import get_current_user

router = APIRouter()

async def get_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to verify that the current user is an admin
    Raises 403 Forbidden if user is not an admin
    """
    if not current_user.get('is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/", response_model=List[UserListResponse])
async def list_all_users(
    admin_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    List all users in the system (admin only)
    """
    users = await supabase_db.get_all_users()
    return [UserListResponse(**user) for user in users]

@router.post("/", response_model=UserListResponse)
async def create_new_user(
    user_data: AdminUserCreate,
    admin_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Create a new user (admin only)
    This allows admin to add users to the whitelist
    """
    # Check if user already exists
    existing_user = await supabase_db.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {user_data.email} already exists"
        )

    # Create user with a placeholder google_id (they'll need to login via Google)
    # The google_id will be updated when they actually log in
    new_user = await supabase_db.create_user(
        email=user_data.email,
        name=user_data.name,
        google_id=f"placeholder_{user_data.email}",  # Will be replaced on first login
        grade=user_data.grade,
        is_admin=False  # New users are not admins by default
    )

    return UserListResponse(**new_user)

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    admin_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Delete a user (admin only)
    Prevents admin from deleting themselves
    """
    # Prevent admin from deleting themselves
    if user_id == admin_user['id']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own admin account"
        )

    # Check if user exists
    user = await supabase_db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Delete the user
    success = await supabase_db.delete_user(user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )

    return {"message": f"User {user['email']} deleted successfully"}
