from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Optional, List, Dict, Any
import os
import uuid

from app.services.supabase_db_service import supabase_db
from app.schemas import PaperResponse, PaperListResponse
from app.routers.auth import get_current_user
from app.services.supabase_storage_service import supabase_storage
from app.config import settings

router = APIRouter()


@router.post("/upload", response_model=PaperResponse)
async def upload_paper(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject: str = Form(...),
    grade: str = Form(None),
    year: int = Form(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload a PDF exam paper to the library
    Awards +1 credit to the uploader
    """
    try:
        # Validate file type
        if not file.content_type == 'application/pdf':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be a PDF"
            )

        # Read file data into memory
        file_data = await file.read()
        file_size = len(file_data)

        # Validate file size (max 50MB for PDFs)
        max_size = 50 * 1024 * 1024  # 50MB
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum of 50MB"
            )

        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"

        # Upload to Supabase Storage (papers bucket)
        try:
            file_url = await supabase_storage.upload_pdf(
                file_data=file_data,
                filename=unique_filename,
                content_type=file.content_type
            )
            print(f"✅ PDF uploaded to Supabase Storage: {file_url}")
        except Exception as e:
            print(f"❌ Supabase Storage upload failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload PDF to storage"
            )

        # Create paper record in database
        paper = await supabase_db.create_paper(
            uploader_id=current_user['id'],
            title=title,
            subject=subject,
            grade=grade or current_user.get('grade'),
            year=year,
            file_url=file_url,
            file_size=file_size
        )

        if not paper:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create paper record"
            )

        # Award +1 credit for uploading
        try:
            await supabase_db.add_credits(
                user_id=current_user['id'],
                amount=1,
                transaction_type="upload",
                description=f"Uploaded paper: {title}",
                paper_id=paper['id']
            )
            print(f"✅ Awarded +1 credit to user {current_user['id']} for uploading paper")
        except Exception as e:
            print(f"⚠️ Failed to award credit: {e}")
            # Don't fail the entire upload if credit award fails

        # Add uploader name to response
        paper['uploader_name'] = current_user.get('name', 'Unknown')

        return PaperResponse(**paper)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error uploading paper: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload paper: {str(e)}"
        )


@router.get("", response_model=PaperListResponse)
async def list_papers(
    subject: Optional[str] = None,
    grade: Optional[str] = None,
    limit: Optional[int] = 100,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get list of all papers with optional filters
    """
    try:
        papers = await supabase_db.get_all_papers(
            subject=subject,
            grade=grade,
            limit=limit
        )

        return PaperListResponse(
            papers=[PaperResponse(**paper) for paper in papers],
            total=len(papers)
        )

    except Exception as e:
        print(f"❌ Error listing papers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list papers: {str(e)}"
        )


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(
    paper_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get details of a specific paper
    """
    try:
        paper = await supabase_db.get_paper_by_id(paper_id)

        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Paper {paper_id} not found"
            )

        return PaperResponse(**paper)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting paper: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get paper: {str(e)}"
        )


@router.post("/{paper_id}/download")
async def download_paper(
    paper_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Download a paper (costs 1 credit)
    Returns the file URL for download
    """
    try:
        # Get paper details
        paper = await supabase_db.get_paper_by_id(paper_id)
        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Paper {paper_id} not found"
            )

        # Deduct 1 credit (will raise error if insufficient credits)
        try:
            await supabase_db.deduct_credits(
                user_id=current_user['id'],
                amount=1,
                transaction_type="download",
                description=f"Downloaded paper: {paper['title']}",
                paper_id=paper_id
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=str(e)
            )

        # Increment download count
        await supabase_db.update_paper_download_count(paper_id)

        # Return file URL for download
        return {
            "message": "Download authorized",
            "file_url": paper['file_url'],
            "title": paper['title'],
            "credits_remaining": await supabase_db.get_user_credits(current_user['id'])
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error downloading paper: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download paper: {str(e)}"
        )


@router.post("/{paper_id}/practice")
async def practice_mode(
    paper_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Open paper in practice mode (costs 1 credit)
    Returns the file URL for PDF viewer
    """
    try:
        # Get paper details
        paper = await supabase_db.get_paper_by_id(paper_id)
        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Paper {paper_id} not found"
            )

        # Deduct 1 credit (will raise error if insufficient credits)
        try:
            await supabase_db.deduct_credits(
                user_id=current_user['id'],
                amount=1,
                transaction_type="practice",
                description=f"Opened practice mode: {paper['title']}",
                paper_id=paper_id
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=str(e)
            )

        # Increment practice count
        await supabase_db.update_paper_practice_count(paper_id)

        # Return file URL and paper metadata for PDF viewer
        return {
            "message": "Practice mode authorized",
            "file_url": paper['file_url'],
            "paper": PaperResponse(**paper),
            "credits_remaining": await supabase_db.get_user_credits(current_user['id'])
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error opening practice mode: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to open practice mode: {str(e)}"
        )
