from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from datetime import datetime

from app.services.supabase_db_service import supabase_db
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/tokens")
async def get_token_usage(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get current user's token usage statistics

    Returns:
        - total_tokens_used: Total tokens consumed
        - prompt_tokens_used: Total prompt/input tokens
        - completion_tokens_used: Total completion/output tokens
        - last_token_update: Timestamp of last usage
    """
    try:
        usage_stats = await supabase_db.get_user_token_usage(current_user['id'])

        return {
            "user_id": current_user['id'],
            "user_email": current_user.get('email'),
            "total_tokens_used": usage_stats.get('total_tokens_used', 0),
            "prompt_tokens_used": usage_stats.get('prompt_tokens_used', 0),
            "completion_tokens_used": usage_stats.get('completion_tokens_used', 0),
            "last_token_update": usage_stats.get('last_token_update')
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch token usage: {str(e)}"
        )

@router.get("/tokens/all")
async def get_all_users_token_usage(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get system-wide token usage across all users

    Returns:
        - total_tokens: Total tokens consumed across all users
        - total_prompt_tokens: Total prompt/input tokens across all users
        - total_completion_tokens: Total completion/output tokens across all users
        - total_users: Number of users in the system
        - users: List of individual user token usage (sorted by usage, highest first)
    """
    try:
        all_usage = await supabase_db.get_all_users_token_usage()

        return {
            "total_tokens": all_usage.get('total_tokens', 0),
            "total_prompt_tokens": all_usage.get('total_prompt_tokens', 0),
            "total_completion_tokens": all_usage.get('total_completion_tokens', 0),
            "total_users": all_usage.get('total_users', 0),
            "users": all_usage.get('users', [])
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch all users token usage: {str(e)}"
        )
