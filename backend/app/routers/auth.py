from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional

from app.database import get_db
from app.models import User
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
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
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
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user

@router.post("/google", response_model=TokenResponse)
async def google_login(
    request: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db)
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

        # Check if user exists
        result = await db.execute(select(User).where(User.google_id == google_id))
        user = result.scalar_one_or_none()

        if not user:
            # Create new user
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                profile_picture=picture
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Update existing user info
            user.name = name
            user.profile_picture = picture
            user.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(user)

        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )

        return TokenResponse(
            access_token=access_token,
            user=UserResponse.from_orm(user)
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return UserResponse.from_orm(current_user)

@router.put("/grade", response_model=UserResponse)
async def update_grade(
    request: GradeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's grade level"""
    current_user.grade = request.grade
    current_user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.from_orm(current_user)
