from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List, Dict
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
    preferred_model: Optional[str] = None

class UserResponse(UserBase):
    id: int
    grade: Optional[str] = None
    profile_picture: Optional[str] = None
    is_admin: Optional[bool] = False
    credits: Optional[int] = 5
    preferred_model: Optional[str] = "gpt-4o"
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

class ModelUpdateRequest(BaseModel):
    preferred_model: str

# Question Schemas
class QuestionBase(BaseModel):
    subject: str
    question_text: str
    grade: Optional[str] = None
    category: Optional[str] = None
    source_paper_id: Optional[int] = None

class QuestionCreate(QuestionBase):
    image_url: Optional[str] = None
    image_snippet_url: Optional[str] = None
    explanation: Optional[str] = None
    vector_id: Optional[str] = None

class QuestionUpdate(BaseModel):
    status: Optional[QuestionStatus] = None
    explanation: Optional[str] = None
    user_notes: Optional[str] = None

class QuestionResponse(QuestionBase):
    id: int
    user_id: int
    image_url: Optional[str] = None
    image_snippet_url: Optional[str] = None
    correct_answer_url: Optional[str] = None
    explanation: Optional[str] = None
    user_notes: Optional[str] = None
    question_metadata: Optional[Dict] = None
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

class ExplanationFeedbackRequest(BaseModel):
    feedback: str

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

# Admin User Management Schemas
class AdminUserCreate(BaseModel):
    email: EmailStr
    name: str
    grade: Optional[str] = None

class UserListResponse(BaseModel):
    id: int
    email: str
    name: str
    grade: Optional[str] = None
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Paper Library Schemas
class PaperBase(BaseModel):
    title: str
    subject: str
    grade: Optional[str] = None
    year: Optional[int] = None

class PaperCreate(PaperBase):
    pass

class PaperResponse(PaperBase):
    id: int
    uploader_id: int
    uploader_name: Optional[str] = None
    file_url: str
    file_size: Optional[int] = None
    upload_date: datetime
    download_count: int = 0
    practice_count: int = 0

    class Config:
        from_attributes = True

class PaperListResponse(BaseModel):
    papers: List[PaperResponse]
    total: int

# Credit Transaction Schemas
class CreditTransactionCreate(BaseModel):
    amount: int
    transaction_type: str
    description: Optional[str] = None
    paper_id: Optional[int] = None

class CreditTransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: int
    transaction_type: str
    description: Optional[str] = None
    paper_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Community Q&A Schemas =============

class QAQuestionCreate(BaseModel):
    title: str
    content: str
    subject: str
    grade: Optional[str] = None
    bounty_amount: int = 0
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None  # List of image URLs


class QAQuestionResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    title: str
    content: str
    subject: str
    grade: Optional[str] = None
    bounty_amount: int
    bounty_active: bool
    status: str
    upvotes: int
    downvotes: int
    tags: Optional[List[str]] = None
    images: Optional[List[str]] = None
    answer_count: int
    view_count: int
    created_at: datetime
    updated_at: datetime
    accepted_answer_id: Optional[int] = None

    class Config:
        from_attributes = True


class QAAnswerCreate(BaseModel):
    content: str


class QAAnswerResponse(BaseModel):
    id: int
    question_id: int
    user_id: int
    user_name: Optional[str] = None
    content: str
    upvotes: int
    downvotes: int
    is_accepted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QAVoteCreate(BaseModel):
    entity_type: str  # 'question' or 'answer'
    entity_id: int
    vote_type: str  # 'upvote' or 'downvote'


class QACommentCreate(BaseModel):
    content: str


class QACommentResponse(BaseModel):
    id: int
    answer_id: int
    user_id: int
    user_name: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============= NOTIFICATION SCHEMAS =============

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    question_id: Optional[int] = None
    upload_id: Optional[int] = None
    is_read: bool
    priority: str
    notification_data: Optional[Dict] = None
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int


class UnreadCountResponse(BaseModel):
    count: int


# ============= TOKEN LIMIT SCHEMAS =============

class TokenLimitStatusResponse(BaseModel):
    monthly_limit: int
    monthly_used: int
    remaining: int
    percentage_used: float
    reset_date: Optional[datetime] = None
    exceeded: bool

    class Config:
        from_attributes = True
