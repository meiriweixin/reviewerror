"""
Supabase Storage Service
Handles file uploads to Supabase Storage for persistent image storage
Uses service role key to bypass RLS for storage operations
"""

from supabase import create_client, Client
from app.config import settings
import uuid


class SupabaseStorageService:
    """Service for handling image and PDF uploads to Supabase Storage"""

    def __init__(self):
        """Initialize Supabase client for storage operations"""
        self.bucket_name = "reviewerror_question_images"
        self.papers_bucket_name = "reviewerror_exam_papers"
        self.client = None
        self.enabled = False

        try:
            # Use service role key to bypass RLS for storage operations
            if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
                self.client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY
                )
                self.enabled = True
                print("✅ Supabase Storage Service initialized (service role key)")
            else:
                print("❌ Supabase Storage disabled - missing URL or service role key")
        except Exception as e:
            print(f"❌ Failed to initialize Supabase Storage: {e}")

    async def upload_image(self, file_data: bytes, filename: str, content_type: str) -> str:
        """
        Upload image to Supabase Storage

        Args:
            file_data: Raw bytes of the image file
            filename: Original filename (used to extract extension)
            content_type: MIME type of the file

        Returns:
            Public URL of the uploaded image
        """
        if not self.enabled or not self.client:
            raise Exception("Supabase Storage is not enabled")

        try:
            # Generate unique filename to avoid collisions
            file_ext = filename.split('.')[-1].lower()
            unique_filename = f"{uuid.uuid4()}.{file_ext}"

            # Upload to Supabase Storage
            self.client.storage.from_(self.bucket_name).upload(
                path=unique_filename,
                file=file_data,
                file_options={"content-type": content_type}
            )

            # Get public URL
            public_url = self.client.storage.from_(self.bucket_name).get_public_url(unique_filename)

            print(f"✅ Image uploaded to Supabase Storage: {unique_filename}")
            return public_url

        except Exception as e:
            print(f"❌ Error uploading to Supabase Storage: {e}")
            raise

    async def delete_image(self, image_url: str) -> bool:
        """
        Delete image from Supabase Storage

        Args:
            image_url: Full public URL of the image

        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.enabled or not self.client:
            return False

        try:
            # Extract filename from URL
            # URL format: https://xxx.supabase.co/storage/v1/object/public/bucket_name/filename.ext
            filename = image_url.split('/')[-1]

            # Handle URL query parameters if present
            if '?' in filename:
                filename = filename.split('?')[0]

            self.client.storage.from_(self.bucket_name).remove([filename])
            print(f"✅ Image deleted from Supabase Storage: {filename}")
            return True

        except Exception as e:
            print(f"❌ Error deleting from Supabase Storage: {e}")
            return False

    async def upload_pdf(self, file_data: bytes, filename: str, content_type: str) -> str:
        """
        Upload PDF to Supabase Storage (papers bucket)

        Args:
            file_data: Raw bytes of the PDF file
            filename: Original filename (used to extract extension)
            content_type: MIME type of the file (should be application/pdf)

        Returns:
            Public URL of the uploaded PDF
        """
        if not self.enabled or not self.client:
            raise Exception("Supabase Storage is not enabled")

        try:
            # Generate unique filename to avoid collisions
            file_ext = filename.split('.')[-1].lower()
            unique_filename = f"{uuid.uuid4()}.{file_ext}"

            # Upload to Supabase Storage (papers bucket)
            self.client.storage.from_(self.papers_bucket_name).upload(
                path=unique_filename,
                file=file_data,
                file_options={"content-type": content_type}
            )

            # Get public URL
            public_url = self.client.storage.from_(self.papers_bucket_name).get_public_url(unique_filename)

            print(f"✅ PDF uploaded to Supabase Storage: {unique_filename}")
            return public_url

        except Exception as e:
            print(f"❌ Error uploading PDF to Supabase Storage: {e}")
            raise

    async def delete_pdf(self, file_url: str) -> bool:
        """
        Delete PDF from Supabase Storage

        Args:
            file_url: Full public URL of the PDF

        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.enabled or not self.client:
            return False

        try:
            # Extract filename from URL
            # URL format: https://xxx.supabase.co/storage/v1/object/public/bucket_name/filename.pdf
            filename = file_url.split('/')[-1]

            # Handle URL query parameters if present
            if '?' in filename:
                filename = filename.split('?')[0]

            self.client.storage.from_(self.papers_bucket_name).remove([filename])
            print(f"✅ PDF deleted from Supabase Storage: {filename}")
            return True

        except Exception as e:
            print(f"❌ Error deleting PDF from Supabase Storage: {e}")
            return False


# Singleton instance
supabase_storage = SupabaseStorageService()





