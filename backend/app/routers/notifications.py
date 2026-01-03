"""
Notification Router
Handles CRUD operations for user notifications and triggers spaced repetition checks
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.services.supabase_db_service import supabase_db
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get user's notifications

    Query params:
    - unread_only: If true, only return unread notifications
    - limit: Max notifications to return (default 50)

    Note: This endpoint also creates notifications for due review questions
    """
    # Create notifications for due reviews on every fetch
    # This ensures users see review reminders when they log in
    try:
        await supabase_db.create_review_notifications_for_due_questions(current_user['id'])
    except Exception as e:
        print(f"Warning: Failed to create review notifications: {e}")

    # Fetch notifications
    notifications = await supabase_db.get_user_notifications(
        user_id=current_user['id'],
        unread_only=unread_only,
        limit=limit
    )

    return {
        "notifications": notifications,
        "total": len(notifications)
    }


@router.get("/unread-count")
async def get_unread_count(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get count of unread notifications for badge display"""
    count = await supabase_db.get_unread_count(current_user['id'])

    return {
        "count": count
    }


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Mark a notification as read"""
    notification = await supabase_db.mark_notification_read(
        notification_id=notification_id,
        user_id=current_user['id']
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return notification


@router.put("/read-all")
async def mark_all_read(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Mark all notifications as read"""
    count = await supabase_db.mark_all_notifications_read(current_user['id'])

    return {
        "message": f"Marked {count} notifications as read",
        "count": count
    }


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a notification"""
    deleted = await supabase_db.delete_notification(
        notification_id=notification_id,
        user_id=current_user['id']
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return {"message": "Notification deleted successfully"}


@router.post("/cleanup")
async def cleanup_expired(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Manual cleanup of expired notifications
    (This is done automatically on fetch, but can be triggered manually)
    Admin-only endpoint
    """
    if not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    count = await supabase_db.cleanup_expired_notifications()

    return {
        "message": f"Cleaned up {count} expired notifications",
        "count": count
    }
