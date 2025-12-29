"""
Community Q&A Router
Stack Overflow-style Q&A platform with bounty system
"""

import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from app.routers.auth import get_current_user
from app.services.supabase_db_service import supabase_db
from app.schemas import (
    QAQuestionCreate, QAQuestionResponse,
    QAAnswerCreate, QAAnswerResponse,
    QAVoteCreate,
    QACommentCreate, QACommentResponse
)

router = APIRouter(prefix="/qa", tags=["Community Q&A"])

# Create uploads directory for Q&A images
QA_UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "qa")
os.makedirs(QA_UPLOADS_DIR, exist_ok=True)


# ============= QUESTIONS =============

async def save_qa_image(file: UploadFile) -> str:
    """Save uploaded image and return the URL path"""
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(QA_UPLOADS_DIR, filename)

    # Save file
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/qa/{filename}"


@router.post("/questions", response_model=QAQuestionResponse)
async def create_question(
    title: str = Form(...),
    content: str = Form(...),
    subject: str = Form(...),
    grade: Optional[str] = Form(None),
    bounty_amount: int = Form(0),
    tags: Optional[str] = Form(None),  # JSON string of tags array
    files: List[UploadFile] = File(default=[]),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create new Q&A question with optional bounty and images"""
    import json

    user_id = current_user['id']

    # If bounty specified, deduct credits first
    if bounty_amount and bounty_amount > 0:
        try:
            await supabase_db.deduct_credits(
                user_id=user_id,
                amount=bounty_amount,
                transaction_type="qa_bounty",
                description=f"Bounty for question: {title[:50]}"
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Parse tags from JSON string
    parsed_tags = None
    if tags:
        try:
            parsed_tags = json.loads(tags)
        except json.JSONDecodeError:
            pass

    # Save uploaded images
    image_urls = []
    for file in files:
        if file.filename:  # Skip empty file uploads
            try:
                url = await save_qa_image(file)
                image_urls.append(url)
            except Exception as e:
                print(f"Error saving image: {e}")

    # Create question
    new_question = await supabase_db.create_qa_question(
        user_id=user_id,
        title=title,
        content=content,
        subject=subject,
        grade=grade,
        bounty_amount=bounty_amount,
        tags=parsed_tags,
        images=image_urls if image_urls else None
    )

    if not new_question:
        raise HTTPException(status_code=500, detail="Failed to create question")

    # Add user_name to response
    new_question['user_name'] = current_user.get('name')

    return new_question


@router.get("/questions", response_model=List[QAQuestionResponse])
async def get_questions(
    filter: str = Query("latest", regex="^(latest|unanswered|my_questions|bounties)$"),
    subject: Optional[str] = None,
    grade: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get questions with filtering"""
    questions = await supabase_db.get_qa_questions(
        filter_type=filter,
        subject=subject,
        grade=grade,
        user_id=current_user['id'] if filter == "my_questions" else None,
        limit=limit,
        offset=offset
    )
    return questions


@router.get("/questions/{question_id}", response_model=QAQuestionResponse)
async def get_question(
    question_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get single question with details"""
    # Increment view count
    await supabase_db.increment_question_views(question_id)

    question = await supabase_db.get_qa_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete own question (refund bounty if active)"""
    question = await supabase_db.get_qa_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this question")

    # Refund bounty if active
    if question['bounty_active'] and question['bounty_amount'] > 0:
        await supabase_db.add_credits(
            user_id=current_user['id'],
            amount=question['bounty_amount'],
            transaction_type="qa_bounty_refund",
            description=f"Refund for deleted question: {question['title'][:50]}"
        )

    await supabase_db.delete_qa_question(question_id)
    return {"message": "Question deleted successfully"}


# ============= ANSWERS =============

@router.post("/questions/{question_id}/answers", response_model=QAAnswerResponse)
async def create_answer(
    question_id: int,
    answer: QAAnswerCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Post answer to question"""
    # Verify question exists
    question = await supabase_db.get_qa_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    new_answer = await supabase_db.create_qa_answer(
        question_id=question_id,
        user_id=current_user['id'],
        content=answer.content
    )

    if not new_answer:
        raise HTTPException(status_code=500, detail="Failed to create answer")

    return new_answer


@router.get("/questions/{question_id}/answers", response_model=List[QAAnswerResponse])
async def get_answers(
    question_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all answers for a question (accepted answer first)"""
    answers = await supabase_db.get_qa_answers(question_id)
    return answers


@router.post("/answers/{answer_id}/accept")
async def accept_answer(
    answer_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Accept answer and award bounty"""
    answer = await supabase_db.get_qa_answer_by_id(answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    question = await supabase_db.get_qa_question_by_id(answer['question_id'])
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Only question owner can accept answers")

    # Prevent accepting own answer
    if answer['user_id'] == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot accept your own answer")

    # Mark answer as accepted
    await supabase_db.accept_qa_answer(answer_id, question['id'])

    # Award bounty if exists
    if question['bounty_active'] and question['bounty_amount'] > 0:
        await supabase_db.add_credits(
            user_id=answer['user_id'],
            amount=question['bounty_amount'],
            transaction_type="qa_bounty_earned",
            description=f"Bounty earned for answer on: {question['title'][:50]}"
        )

        await supabase_db.mark_bounty_awarded(
            question_id=question['id'],
            awarded_to_user_id=answer['user_id']
        )

    return {"message": "Answer accepted successfully"}


@router.delete("/answers/{answer_id}")
async def delete_answer(
    answer_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete own answer"""
    answer = await supabase_db.get_qa_answer_by_id(answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    if answer['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this answer")

    if answer['is_accepted']:
        raise HTTPException(status_code=400, detail="Cannot delete accepted answer")

    await supabase_db.delete_qa_answer(answer_id)
    return {"message": "Answer deleted successfully"}


# ============= VOTES =============

@router.post("/vote")
async def cast_vote(
    vote: QAVoteCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Upvote or downvote question/answer"""
    # Validate entity_type
    if vote.entity_type not in ['question', 'answer']:
        raise HTTPException(status_code=400, detail="entity_type must be 'question' or 'answer'")

    # Validate vote_type
    if vote.vote_type not in ['upvote', 'downvote']:
        raise HTTPException(status_code=400, detail="vote_type must be 'upvote' or 'downvote'")

    # Check if entity exists
    if vote.entity_type == 'question':
        entity = await supabase_db.get_qa_question_by_id(vote.entity_id)
    else:
        entity = await supabase_db.get_qa_answer_by_id(vote.entity_id)

    if not entity:
        raise HTTPException(status_code=404, detail=f"{vote.entity_type.capitalize()} not found")

    # Prevent voting on own content
    if entity['user_id'] == current_user['id']:
        raise HTTPException(status_code=400, detail="Cannot vote on your own content")

    result = await supabase_db.cast_qa_vote(
        user_id=current_user['id'],
        entity_type=vote.entity_type,
        entity_id=vote.entity_id,
        vote_type=vote.vote_type
    )
    return result


@router.delete("/vote")
async def remove_vote(
    entity_type: str = Query(..., regex="^(question|answer)$"),
    entity_id: int = Query(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Remove vote"""
    result = await supabase_db.remove_qa_vote(
        user_id=current_user['id'],
        entity_type=entity_type,
        entity_id=entity_id
    )
    return result


@router.get("/vote")
async def get_user_vote(
    entity_type: str = Query(..., regex="^(question|answer)$"),
    entity_id: int = Query(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get user's vote on an entity"""
    vote = await supabase_db.get_user_vote(
        user_id=current_user['id'],
        entity_type=entity_type,
        entity_id=entity_id
    )
    return {"vote_type": vote}


# ============= COMMENTS =============

@router.post("/answers/{answer_id}/comments", response_model=QACommentResponse)
async def create_comment(
    answer_id: int,
    comment: QACommentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Add comment to answer"""
    # Verify answer exists
    answer = await supabase_db.get_qa_answer_by_id(answer_id)
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    new_comment = await supabase_db.create_qa_comment(
        answer_id=answer_id,
        user_id=current_user['id'],
        content=comment.content
    )

    if not new_comment:
        raise HTTPException(status_code=500, detail="Failed to create comment")

    return new_comment


@router.get("/answers/{answer_id}/comments", response_model=List[QACommentResponse])
async def get_comments(
    answer_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get all comments for answer"""
    comments = await supabase_db.get_qa_comments(answer_id)
    return comments


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete own comment"""
    comment = await supabase_db.get_qa_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment['user_id'] != current_user['id']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    await supabase_db.delete_qa_comment(comment_id)
    return {"message": "Comment deleted successfully"}
