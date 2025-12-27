from fastapi import APIRouter, Depends, HTTPException, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, Dict, Any

from app.services.supabase_db_service import supabase_db
from app.schemas import (
    GoogleLoginRequest,
    TokenResponse,
    UserResponse,
    GradeUpdateRequest
)
from app.config import settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        print(f"DEBUG: Received token: {token[:50]}..." if len(token) > 50 else f"DEBUG: Received token: {token}")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        print(f"DEBUG: Decoded payload: {payload}")
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            print("DEBUG: No user_id in payload")
            raise credentials_exception
        user_id = int(user_id_str)
    except JWTError as e:
        print(f"DEBUG: JWT Error: {e}")
        raise credentials_exception

    # Get user from database
    user = await supabase_db.get_user_by_id(user_id)

    if user is None:
        raise credentials_exception

    return user

@router.post("/google", response_model=TokenResponse)
async def google_login(
    request: GoogleLoginRequest
):
    """Login/Register with Google OAuth"""
    try:
        # Verify Google token with clock skew tolerance
        idinfo = id_token.verify_oauth2_token(
            request.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60  # Allow 60 seconds clock skew tolerance
        )

        # Extract user info
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        picture = idinfo.get('picture')

        # WHITELIST CHECK: Only allow users that admin has pre-added
        user = await supabase_db.get_user_by_email(email)

        if not user:
            # User not in whitelist - reject login
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has not been activated yet. Please complete the payment and fill in the user registration form. If you have already submitted it, please wait for the administrator to process it (within 24 hours)."
            )

        # User exists in whitelist - check if this is first login
        if user.get('google_id', '').startswith('placeholder_'):
            # First login - update google_id
            user = await supabase_db.update_user(
                user_id=user['id'],
                google_id=google_id,
                name=name,
                profile_picture=picture
            )
        else:
            # Returning user - update profile info
            user = await supabase_db.update_user(
                user_id=user['id'],
                name=name,
                profile_picture=picture
            )

        # Create access token
        access_token = create_access_token(
            data={"sub": str(user['id']), "email": user['email']}
        )

        return TokenResponse(
            access_token=access_token,
            user=UserResponse(**user)
        )

    except ValueError as e:
        print(f"❌ ValueError in google_login: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Exception in google_login: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse(**current_user)

@router.put("/grade", response_model=UserResponse)
async def update_grade(
    request: GradeUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update user's grade level"""
    updated_user = await supabase_db.update_user_grade(
        user_id=current_user['id'],
        grade=request.grade
    )

    return UserResponse(**updated_user)
