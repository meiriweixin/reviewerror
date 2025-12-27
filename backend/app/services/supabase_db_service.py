"""
Supabase Database Service
Replaces SQLAlchemy with direct Supabase SDK operations
Handles all CRUD operations for users, questions, and upload_history
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.config import settings
from supabase import create_client, Client

class SupabaseDBService:
    """Unified database service using Supabase SDK"""

    def __init__(self):
        """Initialize Supabase client"""
        try:
            # Use anon key with RLS policies for security
            self.client: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
            self.enabled = True
            print("✅ Supabase Database Service initialized (anon key + RLS)")
        except Exception as e:
            print(f"❌ Failed to initialize Supabase: {e}")
            self.client = None
            self.enabled = False

    # ==================== USER OPERATIONS ====================

    async def create_user(self, email: str, name: str, google_id: str,
                         profile_picture: Optional[str] = None,
                         grade: Optional[str] = None,
                         is_admin: bool = False) -> Dict[str, Any]:
        """Create a new user"""
        data = {
            "email": email,
            "name": name,
            "google_id": google_id,
            "profile_picture": profile_picture,
            "grade": grade,
            "is_admin": is_admin,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = self.client.table("study_users").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        result = self.client.table("study_users")\
            .select("*")\
            .eq("id", user_id)\
            .execute()

        return result.data[0] if result.data else None

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        result = self.client.table("study_users")\
            .select("*")\
            .eq("email", email)\
            .execute()

        return result.data[0] if result.data else None

    async def get_user_by_google_id(self, google_id: str) -> Optional[Dict[str, Any]]:
        """Get user by Google ID"""
        result = self.client.table("study_users")\
            .select("*")\
            .eq("google_id", google_id)\
            .execute()

        return result.data[0] if result.data else None

    async def update_user(self, user_id: int, **kwargs) -> Dict[str, Any]:
        """Update user fields"""
        kwargs['updated_at'] = datetime.utcnow().isoformat()

        result = self.client.table("study_users")\
            .update(kwargs)\
            .eq("id", user_id)\
            .execute()

        return result.data[0] if result.data else None

    async def update_user_grade(self, user_id: int, grade: str) -> Dict[str, Any]:
        """Update user's grade"""
        return await self.update_user(user_id, grade=grade)

    async def add_token_usage(self, user_id: int, prompt_tokens: int,
                             completion_tokens: int, total_tokens: int) -> Dict[str, Any]:
        """
        Add token usage to user's total

        Args:
            user_id: User ID
            prompt_tokens: Prompt/input tokens used
            completion_tokens: Completion/output tokens used
            total_tokens: Total tokens used
        """
        # Get current token counts
        user = await self.get_user_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        current_total = user.get('total_tokens_used', 0) or 0
        current_prompt = user.get('prompt_tokens_used', 0) or 0
        current_completion = user.get('completion_tokens_used', 0) or 0

        # Update with new usage
        update_data = {
            'total_tokens_used': current_total + total_tokens,
            'prompt_tokens_used': current_prompt + prompt_tokens,
            'completion_tokens_used': current_completion + completion_tokens,
            'last_token_update': datetime.utcnow().isoformat()
        }

        return await self.update_user(user_id, **update_data)

    async def get_user_token_usage(self, user_id: int) -> Dict[str, Any]:
        """
        Get user's token usage statistics

        Returns:
            Dict with total_tokens_used, prompt_tokens_used, completion_tokens_used, last_token_update
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return {
                'total_tokens_used': 0,
                'prompt_tokens_used': 0,
                'completion_tokens_used': 0,
                'last_token_update': None
            }

        return {
            'total_tokens_used': user.get('total_tokens_used', 0) or 0,
            'prompt_tokens_used': user.get('prompt_tokens_used', 0) or 0,
            'completion_tokens_used': user.get('completion_tokens_used', 0) or 0,
            'last_token_update': user.get('last_token_update')
        }

    async def get_all_users_token_usage(self) -> Dict[str, Any]:
        """
        Get system-wide token usage across all users

        Returns:
            Dict with:
            - total_tokens: Sum of all users' tokens
            - total_prompt_tokens: Sum of all prompt tokens
            - total_completion_tokens: Sum of all completion tokens
            - users: List of individual user token usage
        """
        # Fetch all users with token data
        result = self.client.table("study_users")\
            .select("id, email, name, total_tokens_used, prompt_tokens_used, completion_tokens_used, last_token_update")\
            .execute()

        users_data = result.data if result.data else []

        # Calculate totals
        total_tokens = 0
        total_prompt_tokens = 0
        total_completion_tokens = 0
        users_list = []

        for user in users_data:
            user_total = user.get('total_tokens_used', 0) or 0
            user_prompt = user.get('prompt_tokens_used', 0) or 0
            user_completion = user.get('completion_tokens_used', 0) or 0

            total_tokens += user_total
            total_prompt_tokens += user_prompt
            total_completion_tokens += user_completion

            users_list.append({
                'user_id': user.get('id'),
                'email': user.get('email'),
                'name': user.get('name'),
                'total_tokens_used': user_total,
                'prompt_tokens_used': user_prompt,
                'completion_tokens_used': user_completion,
                'last_token_update': user.get('last_token_update')
            })

        # Sort users by total tokens (highest first)
        users_list.sort(key=lambda x: x['total_tokens_used'], reverse=True)

        return {
            'total_tokens': total_tokens,
            'total_prompt_tokens': total_prompt_tokens,
            'total_completion_tokens': total_completion_tokens,
            'total_users': len(users_data),
            'users': users_list
        }

    async def delete_user(self, user_id: int) -> bool:
        """Delete user"""
        result = self.client.table("study_users")\
            .delete()\
            .eq("id", user_id)\
            .execute()

        return len(result.data) > 0

    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users (admin only)"""
        result = self.client.table("study_users")\
            .select("id, email, name, grade, is_admin, created_at")\
            .order("created_at", desc=True)\
            .execute()

        return result.data if result.data else []

    # ==================== QUESTION OPERATIONS ====================

    async def create_question(
        self,
        user_id: int,
        subject: str,
        question_text: str,
        grade: Optional[str] = None,
        image_url: Optional[str] = None,
        image_snippet_url: Optional[str] = None,
        explanation: Optional[str] = None,
        status: str = "pending",
        vector_id: Optional[str] = None,
        question_metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Create a new question"""
        data = {
            "user_id": user_id,
            "subject": subject,
            "question_text": question_text,
            "grade": grade,
            "image_url": image_url,
            "image_snippet_url": image_snippet_url,
            "explanation": explanation,
            "status": status,
            "vector_id": vector_id,
            "question_metadata": question_metadata or {},
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = self.client.table("study_questions").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_question_by_id(self, question_id: int) -> Optional[Dict[str, Any]]:
        """Get question by ID"""
        result = self.client.table("study_questions")\
            .select("*")\
            .eq("id", question_id)\
            .execute()

        return result.data[0] if result.data else None

    async def get_questions_by_user(
        self,
        user_id: int,
        status: Optional[str] = None,
        subject: Optional[str] = None,
        grade: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get all questions for a user with optional filters"""
        query = self.client.table("study_questions")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)

        if status:
            query = query.eq("status", status)

        if subject:
            query = query.eq("subject", subject)

        if grade:
            query = query.eq("grade", grade)

        if limit:
            query = query.limit(limit)

        result = query.execute()
        return result.data if result.data else []

    async def update_question(self, question_id: int, **kwargs) -> Dict[str, Any]:
        """Update question fields"""
        kwargs['updated_at'] = datetime.utcnow().isoformat()

        result = self.client.table("study_questions")\
            .update(kwargs)\
            .eq("id", question_id)\
            .execute()

        return result.data[0] if result.data else None

    async def update_question_status(self, question_id: int, status: str) -> Dict[str, Any]:
        """Update question status"""
        return await self.update_question(question_id, status=status)

    async def delete_question(self, question_id: int) -> bool:
        """Delete question"""
        result = self.client.table("study_questions")\
            .delete()\
            .eq("id", question_id)\
            .execute()

        return len(result.data) > 0

    async def count_questions_by_user(self, user_id: int, status: Optional[str] = None) -> int:
        """Count questions for a user"""
        query = self.client.table("study_questions")\
            .select("id", count="exact")\
            .eq("user_id", user_id)

        if status:
            query = query.eq("status", status)

        result = query.execute()
        return result.count if result.count else 0

    # ==================== UPLOAD HISTORY OPERATIONS ====================

    async def create_upload_history(
        self,
        user_id: int,
        filename: str,
        subject: Optional[str] = None,
        questions_extracted: int = 0,
        status: str = "processing",
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create upload history record"""
        data = {
            "user_id": user_id,
            "filename": filename,
            "subject": subject,
            "questions_extracted": questions_extracted,
            "status": status,
            "error_message": error_message,
            "created_at": datetime.utcnow().isoformat()
        }

        result = self.client.table("study_upload_history").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_upload_history_by_id(self, upload_id: int) -> Optional[Dict[str, Any]]:
        """Get upload history by ID"""
        result = self.client.table("study_upload_history")\
            .select("*")\
            .eq("id", upload_id)\
            .execute()

        return result.data[0] if result.data else None

    async def get_upload_history_by_user(
        self,
        user_id: int,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get upload history for a user"""
        query = self.client.table("study_upload_history")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)

        if limit:
            query = query.limit(limit)

        result = query.execute()
        return result.data if result.data else []

    async def update_upload_history(self, upload_id: int, **kwargs) -> Dict[str, Any]:
        """Update upload history fields"""
        result = self.client.table("study_upload_history")\
            .update(kwargs)\
            .eq("id", upload_id)\
            .execute()

        return result.data[0] if result.data else None

    async def delete_upload_history(self, upload_id: int) -> bool:
        """Delete upload history"""
        result = self.client.table("study_upload_history")\
            .delete()\
            .eq("id", upload_id)\
            .execute()

        return len(result.data) > 0

    # ==================== STATISTICS OPERATIONS ====================

    async def get_user_stats(self, user_id: int, grade: Optional[str] = None) -> Dict[str, Any]:
        """Get comprehensive user statistics with optional grade filter"""
        # Get all questions (filtered by grade if provided)
        all_questions = await self.get_questions_by_user(user_id, grade=grade)

        # Count by status
        pending = len([q for q in all_questions if q['status'] == 'pending'])
        reviewing = len([q for q in all_questions if q['status'] == 'reviewing'])
        understood = len([q for q in all_questions if q['status'] == 'understood'])

        # Count by subject
        subjects = {}
        for q in all_questions:
            subject = q['subject']
            if subject not in subjects:
                subjects[subject] = {'total': 0, 'understood': 0}
            subjects[subject]['total'] += 1
            if q['status'] == 'understood':
                subjects[subject]['understood'] += 1

        return {
            "total_questions": len(all_questions),
            "pending": pending,
            "reviewing": reviewing,
            "understood": understood,
            "completion_rate": (understood / len(all_questions) * 100) if all_questions else 0,
            "subjects": subjects
        }

    async def get_subject_stats(self, user_id: int, grade: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get statistics grouped by subject with optional grade filter"""
        questions = await self.get_questions_by_user(user_id, grade=grade)

        subjects = {}
        for q in questions:
            subject = q['subject']
            if subject not in subjects:
                subjects[subject] = {
                    'subject': subject,
                    'total': 0,
                    'pending': 0,
                    'reviewing': 0,
                    'understood': 0
                }

            subjects[subject]['total'] += 1
            subjects[subject][q['status']] += 1

        return list(subjects.values())

# Create singleton instance
supabase_db = SupabaseDBService()
