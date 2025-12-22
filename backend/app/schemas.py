from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from enum import Enum

class QuestionStatus(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    UNDERSTOOD = "understood"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    google_id: str
    profile_picture: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    grade: Optional[str] = None

class UserResponse(UserBase):
    id: int
    grade: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Auth Schemas
class GoogleLoginRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class GradeUpdateRequest(BaseModel):
    grade: str

# Question Schemas
class QuestionBase(BaseModel):
    subject: str
    question_text: str
    grade: Optional[str] = None

class QuestionCreate(QuestionBase):
    image_url: Optional[str] = None
    image_snippet_url: Optional[str] = None
    explanation: Optional[str] = None
    vector_id: Optional[str] = None

class QuestionUpdate(BaseModel):
    status: Optional[QuestionStatus] = None
    explanation: Optional[str] = None

class QuestionResponse(QuestionBase):
    id: int
    user_id: int
    image_url: Optional[str] = None
    image_snippet_url: Optional[str] = None
    explanation: Optional[str] = None
    status: QuestionStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class QuestionListResponse(BaseModel):
    questions: List[QuestionResponse]
    total: int

# Upload Schemas
class UploadResponse(BaseModel):
    message: str
    questions_count: int
    upload_id: int

class QuestionSearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 10

# Stats Schemas
class StudentStats(BaseModel):
    total_questions: int
    pending_questions: int
    reviewing_questions: int
    understood_questions: int
    total_uploads: int

class SubjectStats(BaseModel):
    subject: str
    total_questions: int
    pending: int
    reviewing: int
    understood: int

class SubjectStatsResponse(BaseModel):
    subjects: List[SubjectStats]
