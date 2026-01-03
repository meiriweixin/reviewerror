"""
Supabase Database Service
Replaces SQLAlchemy with direct Supabase SDK operations
Handles all CRUD operations for users, questions, and upload_history
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
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

    # ==================== CUSTOM SUBJECTS OPERATIONS ====================

    async def get_custom_subjects(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all custom subjects for a user"""
        result = self.client.table("study_custom_subjects")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("name")\
            .execute()

        return result.data if result.data else []

    async def create_custom_subject(self, user_id: int, name: str) -> Dict[str, Any]:
        """Create a new custom subject for a user"""
        data = {
            "user_id": user_id,
            "name": name.strip(),
            "created_at": datetime.utcnow().isoformat()
        }

        result = self.client.table("study_custom_subjects").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_custom_subject_by_name(self, user_id: int, name: str) -> Optional[Dict[str, Any]]:
        """Check if a custom subject already exists for user"""
        result = self.client.table("study_custom_subjects")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("name", name.strip())\
            .execute()

        return result.data[0] if result.data else None

    async def delete_custom_subject(self, subject_id: int, user_id: int) -> bool:
        """Delete a custom subject (only if owned by user)"""
        result = self.client.table("study_custom_subjects")\
            .delete()\
            .eq("id", subject_id)\
            .eq("user_id", user_id)\
            .execute()

        return len(result.data) > 0

    # ==================== QUESTION OPERATIONS ====================

    async def create_question(
        self,
        user_id: int,
        subject: str,
        question_text: str,
        grade: Optional[str] = None,
        category: Optional[str] = None,
        image_url: Optional[str] = None,
        image_snippet_url: Optional[str] = None,
        explanation: Optional[str] = None,
        status: str = "pending",
        vector_id: Optional[str] = None,
        question_metadata: Optional[Dict] = None,
        source_paper_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create a new question"""
        data = {
            "user_id": user_id,
            "subject": subject,
            "question_text": question_text,
            "grade": grade,
            "category": category,
            "image_url": image_url,
            "image_snippet_url": image_snippet_url,
            "explanation": explanation,
            "status": status,
            "vector_id": vector_id,
            "question_metadata": question_metadata or {},
            "source_paper_id": source_paper_id,
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
        category: Optional[str] = None,
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

        if category:
            query = query.eq("category", category)

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

    async def get_category_stats(
        self,
        user_id: int,
        subject: Optional[str] = None,
        grade: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get statistics grouped by category with optional subject and grade filters"""
        questions = await self.get_questions_by_user(user_id, grade=grade)

        # Filter by subject if provided
        if subject:
            questions = [q for q in questions if q['subject'] == subject]

        categories = {}
        for q in questions:
            category = q.get('category') or 'Uncategorized'
            if category not in categories:
                categories[category] = {
                    'category': category,
                    'subject': q['subject'],
                    'total': 0,
                    'pending': 0,
                    'reviewing': 0,
                    'understood': 0
                }

            categories[category]['total'] += 1
            categories[category][q['status']] += 1

        # Sort by total questions descending
        result = list(categories.values())
        result.sort(key=lambda x: x['total'], reverse=True)

        return result

    # ==================== PAPER OPERATIONS ====================

    async def create_paper(
        self,
        uploader_id: int,
        title: str,
        subject: str,
        file_url: str,
        grade: Optional[str] = None,
        year: Optional[int] = None,
        file_size: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create a new paper record"""
        data = {
            "uploader_id": uploader_id,
            "title": title,
            "subject": subject,
            "grade": grade,
            "year": year,
            "file_url": file_url,
            "file_size": file_size,
            "upload_date": datetime.utcnow().isoformat(),
            "download_count": 0,
            "practice_count": 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = self.client.table("study_papers").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_paper_by_id(self, paper_id: int) -> Optional[Dict[str, Any]]:
        """Get paper by ID with uploader name"""
        result = self.client.table("study_papers")\
            .select("*, study_users!inner(name)")\
            .eq("id", paper_id)\
            .execute()

        if result.data:
            paper = result.data[0]
            # Extract uploader name from joined data
            paper['uploader_name'] = paper.get('study_users', {}).get('name')
            return paper
        return None

    async def get_all_papers(
        self,
        subject: Optional[str] = None,
        grade: Optional[str] = None,
        uploader_id: Optional[int] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get all papers with optional filters"""
        query = self.client.table("study_papers")\
            .select("*, study_users!inner(name)")\
            .order("upload_date", desc=True)

        if subject:
            query = query.eq("subject", subject)

        if grade:
            query = query.eq("grade", grade)

        if uploader_id:
            query = query.eq("uploader_id", uploader_id)

        if limit:
            query = query.limit(limit)

        result = query.execute()

        if result.data:
            # Extract uploader names from joined data
            for paper in result.data:
                paper['uploader_name'] = paper.get('study_users', {}).get('name')
            return result.data
        return []

    async def update_paper_download_count(self, paper_id: int) -> Dict[str, Any]:
        """Increment download count for a paper"""
        paper = await self.get_paper_by_id(paper_id)
        if not paper:
            raise ValueError(f"Paper {paper_id} not found")

        new_count = (paper.get('download_count', 0) or 0) + 1

        result = self.client.table("study_papers")\
            .update({"download_count": new_count, "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", paper_id)\
            .execute()

        return result.data[0] if result.data else None

    async def update_paper_practice_count(self, paper_id: int) -> Dict[str, Any]:
        """Increment practice count for a paper"""
        paper = await self.get_paper_by_id(paper_id)
        if not paper:
            raise ValueError(f"Paper {paper_id} not found")

        new_count = (paper.get('practice_count', 0) or 0) + 1

        result = self.client.table("study_papers")\
            .update({"practice_count": new_count, "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", paper_id)\
            .execute()

        return result.data[0] if result.data else None

    async def delete_paper(self, paper_id: int) -> bool:
        """Delete paper (also deletes related credit transactions via CASCADE)"""
        result = self.client.table("study_papers")\
            .delete()\
            .eq("id", paper_id)\
            .execute()

        return len(result.data) > 0

    # ==================== CREDIT OPERATIONS ====================

    async def get_user_credits(self, user_id: int) -> int:
        """Get user's current credit balance"""
        user = await self.get_user_by_id(user_id)
        if not user:
            return 0
        return user.get('credits', 5) or 5

    async def add_credits(
        self,
        user_id: int,
        amount: int,
        transaction_type: str,
        description: Optional[str] = None,
        paper_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Add credits to user and log transaction

        Args:
            user_id: User ID
            amount: Number of credits to add (positive integer)
            transaction_type: Type of transaction (e.g., 'upload', 'admin_adjust')
            description: Optional description
            paper_id: Optional paper ID if related to a paper

        Returns:
            Updated user data
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Get current credits
        current_credits = await self.get_user_credits(user_id)

        # Update user credits
        new_credits = current_credits + amount
        user = await self.update_user(user_id, credits=new_credits)

        # Log transaction
        await self.create_credit_transaction(
            user_id=user_id,
            amount=amount,
            transaction_type=transaction_type,
            description=description,
            paper_id=paper_id
        )

        return user

    async def deduct_credits(
        self,
        user_id: int,
        amount: int,
        transaction_type: str,
        description: Optional[str] = None,
        paper_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Deduct credits from user and log transaction

        Args:
            user_id: User ID
            amount: Number of credits to deduct (positive integer)
            transaction_type: Type of transaction (e.g., 'download', 'practice')
            description: Optional description
            paper_id: Optional paper ID if related to a paper

        Returns:
            Updated user data

        Raises:
            ValueError: If user has insufficient credits
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Get current credits
        current_credits = await self.get_user_credits(user_id)

        # Check if user has enough credits
        if current_credits < amount:
            raise ValueError(f"Insufficient credits. Required: {amount}, Available: {current_credits}")

        # Update user credits
        new_credits = current_credits - amount
        user = await self.update_user(user_id, credits=new_credits)

        # Log transaction (negative amount to indicate deduction)
        await self.create_credit_transaction(
            user_id=user_id,
            amount=-amount,
            transaction_type=transaction_type,
            description=description,
            paper_id=paper_id
        )

        return user

    async def create_credit_transaction(
        self,
        user_id: int,
        amount: int,
        transaction_type: str,
        description: Optional[str] = None,
        paper_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create a credit transaction record"""
        data = {
            "user_id": user_id,
            "amount": amount,
            "transaction_type": transaction_type,
            "description": description,
            "paper_id": paper_id,
            "created_at": datetime.utcnow().isoformat()
        }

        result = self.client.table("study_credit_transactions").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_credit_transactions(
        self,
        user_id: int,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get credit transaction history for a user"""
        query = self.client.table("study_credit_transactions")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)

        if limit:
            query = query.limit(limit)

        result = query.execute()
        return result.data if result.data else []

    # ==================== COMMUNITY Q&A OPERATIONS ====================

    async def create_qa_question(
        self,
        user_id: int,
        title: str,
        content: str,
        subject: str,
        grade: Optional[str] = None,
        bounty_amount: int = 0,
        tags: Optional[List[str]] = None,
        images: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create new Q&A question"""
        data = {
            "user_id": user_id,
            "title": title,
            "content": content,
            "subject": subject,
            "grade": grade,
            "bounty_amount": bounty_amount,
            "bounty_active": bounty_amount > 0,
            "status": "open",
            "upvotes": 0,
            "downvotes": 0,
            "answer_count": 0,
            "view_count": 0,
            "tags": tags,
            "images": images,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = self.client.table("study_qa_questions").insert(data).execute()

        if result.data and bounty_amount > 0:
            # Create bounty record
            bounty_data = {
                "question_id": result.data[0]['id'],
                "user_id": user_id,
                "amount": bounty_amount,
                "status": "active",
                "created_at": datetime.utcnow().isoformat()
            }
            self.client.table("study_qa_bounties").insert(bounty_data).execute()

        return result.data[0] if result.data else None

    async def get_qa_questions(
        self,
        filter_type: str = "latest",
        subject: Optional[str] = None,
        grade: Optional[str] = None,
        user_id: Optional[int] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get questions with filtering"""
        query = self.client.table("study_qa_questions")\
            .select("*, study_users!inner(name)")

        if filter_type == "unanswered":
            query = query.eq("answer_count", 0)
        elif filter_type == "my_questions" and user_id:
            query = query.eq("user_id", user_id)
        elif filter_type == "bounties":
            query = query.eq("bounty_active", True)

        if subject:
            query = query.eq("subject", subject)
        if grade:
            query = query.eq("grade", grade)

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        result = query.execute()

        if result.data:
            for q in result.data:
                q['user_name'] = q.get('study_users', {}).get('name')
            return result.data
        return []

    async def get_qa_question_by_id(self, question_id: int) -> Optional[Dict[str, Any]]:
        """Get question by ID with user name"""
        result = self.client.table("study_qa_questions")\
            .select("*, study_users!inner(name)")\
            .eq("id", question_id)\
            .execute()

        if result.data:
            q = result.data[0]
            q['user_name'] = q.get('study_users', {}).get('name')
            return q
        return None

    async def increment_question_views(self, question_id: int):
        """Increment view count"""
        result = self.client.table("study_qa_questions")\
            .select("view_count")\
            .eq("id", question_id)\
            .execute()

        if result.data:
            current_views = result.data[0].get('view_count', 0) or 0
            self.client.table("study_qa_questions")\
                .update({"view_count": current_views + 1})\
                .eq("id", question_id)\
                .execute()

    async def delete_qa_question(self, question_id: int) -> bool:
        """Delete question (cascade deletes answers, votes, comments)"""
        result = self.client.table("study_qa_questions")\
            .delete()\
            .eq("id", question_id)\
            .execute()

        return len(result.data) > 0

    async def create_qa_answer(
        self,
        question_id: int,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Create answer and increment question answer count"""
        data = {
            "question_id": question_id,
            "user_id": user_id,
            "content": content,
            "upvotes": 0,
            "downvotes": 0,
            "is_accepted": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("study_qa_answers").insert(data).execute()

        # Increment answer count on question
        question = await self.get_qa_question_by_id(question_id)
        if question:
            new_count = (question.get('answer_count', 0) or 0) + 1
            self.client.table("study_qa_questions")\
                .update({"answer_count": new_count})\
                .eq("id", question_id)\
                .execute()

        if result.data:
            # Get user name for response
            user = await self.get_user_by_id(user_id)
            result.data[0]['user_name'] = user.get('name') if user else None
            return result.data[0]
        return None

    async def get_qa_answers(self, question_id: int) -> List[Dict[str, Any]]:
        """Get answers for question (accepted first, then by upvotes)"""
        result = self.client.table("study_qa_answers")\
            .select("*, study_users!inner(name)")\
            .eq("question_id", question_id)\
            .order("is_accepted", desc=True)\
            .order("upvotes", desc=True)\
            .execute()

        if result.data:
            for a in result.data:
                a['user_name'] = a.get('study_users', {}).get('name')
            return result.data
        return []

    async def get_qa_answer_by_id(self, answer_id: int) -> Optional[Dict[str, Any]]:
        """Get answer by ID"""
        result = self.client.table("study_qa_answers")\
            .select("*, study_users!inner(name)")\
            .eq("id", answer_id)\
            .execute()

        if result.data:
            a = result.data[0]
            a['user_name'] = a.get('study_users', {}).get('name')
            return a
        return None

    async def accept_qa_answer(self, answer_id: int, question_id: int):
        """Mark answer as accepted and update question"""
        # Unaccept any previously accepted answer
        self.client.table("study_qa_answers")\
            .update({"is_accepted": False})\
            .eq("question_id", question_id)\
            .execute()

        # Accept this answer
        self.client.table("study_qa_answers")\
            .update({"is_accepted": True, "updated_at": datetime.utcnow().isoformat()})\
            .eq("id", answer_id)\
            .execute()

        # Update question status and reference
        self.client.table("study_qa_questions")\
            .update({
                "status": "solved",
                "accepted_answer_id": answer_id,
                "bounty_active": False,
                "updated_at": datetime.utcnow().isoformat()
            })\
            .eq("id", question_id)\
            .execute()

    async def delete_qa_answer(self, answer_id: int) -> bool:
        """Delete answer and decrement question count"""
        # Get question_id before deleting
        answer = await self.get_qa_answer_by_id(answer_id)
        if not answer:
            return False

        question_id = answer['question_id']

        # Delete answer
        result = self.client.table("study_qa_answers")\
            .delete()\
            .eq("id", answer_id)\
            .execute()

        # Decrement count
        question = await self.get_qa_question_by_id(question_id)
        if question:
            new_count = max(0, (question.get('answer_count', 0) or 0) - 1)
            self.client.table("study_qa_questions")\
                .update({"answer_count": new_count})\
                .eq("id", question_id)\
                .execute()

        return len(result.data) > 0

    async def cast_qa_vote(
        self,
        user_id: int,
        entity_type: str,
        entity_id: int,
        vote_type: str
    ) -> Dict[str, Any]:
        """Cast or update vote"""
        # Check existing vote
        existing = self.client.table("study_qa_votes")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("entity_type", entity_type)\
            .eq("entity_id", entity_id)\
            .execute()

        table_name = "study_qa_questions" if entity_type == "question" else "study_qa_answers"

        if existing.data:
            old_vote = existing.data[0]['vote_type']
            if old_vote == vote_type:
                # Remove vote if clicking same button
                return await self.remove_qa_vote(user_id, entity_type, entity_id)
            else:
                # Switch vote
                self.client.table("study_qa_votes")\
                    .update({"vote_type": vote_type})\
                    .eq("id", existing.data[0]['id'])\
                    .execute()

                # Update counts (decrement old, increment new)
                entity = self.client.table(table_name)\
                    .select("upvotes, downvotes")\
                    .eq("id", entity_id)\
                    .execute()

                if entity.data:
                    upvotes = entity.data[0].get('upvotes', 0) or 0
                    downvotes = entity.data[0].get('downvotes', 0) or 0

                    if old_vote == "upvote":
                        upvotes = max(0, upvotes - 1)
                        downvotes += 1
                    else:
                        downvotes = max(0, downvotes - 1)
                        upvotes += 1

                    self.client.table(table_name)\
                        .update({"upvotes": upvotes, "downvotes": downvotes})\
                        .eq("id", entity_id)\
                        .execute()
        else:
            # Create new vote
            vote_data = {
                "user_id": user_id,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "vote_type": vote_type,
                "created_at": datetime.utcnow().isoformat()
            }
            self.client.table("study_qa_votes").insert(vote_data).execute()

            # Update count
            entity = self.client.table(table_name)\
                .select("upvotes, downvotes")\
                .eq("id", entity_id)\
                .execute()

            if entity.data:
                if vote_type == "upvote":
                    new_upvotes = (entity.data[0].get('upvotes', 0) or 0) + 1
                    self.client.table(table_name)\
                        .update({"upvotes": new_upvotes})\
                        .eq("id", entity_id)\
                        .execute()
                else:
                    new_downvotes = (entity.data[0].get('downvotes', 0) or 0) + 1
                    self.client.table(table_name)\
                        .update({"downvotes": new_downvotes})\
                        .eq("id", entity_id)\
                        .execute()

        return {"message": "Vote cast successfully"}

    async def remove_qa_vote(
        self,
        user_id: int,
        entity_type: str,
        entity_id: int
    ) -> Dict[str, Any]:
        """Remove vote"""
        # Get existing vote
        existing = self.client.table("study_qa_votes")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("entity_type", entity_type)\
            .eq("entity_id", entity_id)\
            .execute()

        if existing.data:
            vote_type = existing.data[0]['vote_type']

            # Delete vote
            self.client.table("study_qa_votes")\
                .delete()\
                .eq("id", existing.data[0]['id'])\
                .execute()

            # Decrement count
            table_name = "study_qa_questions" if entity_type == "question" else "study_qa_answers"
            entity = self.client.table(table_name)\
                .select("upvotes, downvotes")\
                .eq("id", entity_id)\
                .execute()

            if entity.data:
                if vote_type == "upvote":
                    new_upvotes = max(0, (entity.data[0].get('upvotes', 0) or 0) - 1)
                    self.client.table(table_name)\
                        .update({"upvotes": new_upvotes})\
                        .eq("id", entity_id)\
                        .execute()
                else:
                    new_downvotes = max(0, (entity.data[0].get('downvotes', 0) or 0) - 1)
                    self.client.table(table_name)\
                        .update({"downvotes": new_downvotes})\
                        .eq("id", entity_id)\
                        .execute()

        return {"message": "Vote removed"}

    async def get_user_vote(
        self,
        user_id: int,
        entity_type: str,
        entity_id: int
    ) -> Optional[str]:
        """Get user's vote on an entity (returns 'upvote', 'downvote', or None)"""
        result = self.client.table("study_qa_votes")\
            .select("vote_type")\
            .eq("user_id", user_id)\
            .eq("entity_type", entity_type)\
            .eq("entity_id", entity_id)\
            .execute()

        if result.data:
            return result.data[0].get('vote_type')
        return None

    async def create_qa_comment(
        self,
        answer_id: int,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """Create comment on answer"""
        data = {
            "answer_id": answer_id,
            "user_id": user_id,
            "content": content,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        result = self.client.table("study_qa_comments").insert(data).execute()

        if result.data:
            # Get user name for response
            user = await self.get_user_by_id(user_id)
            result.data[0]['user_name'] = user.get('name') if user else None
            return result.data[0]
        return None

    async def get_qa_comments(self, answer_id: int) -> List[Dict[str, Any]]:
        """Get comments for answer"""
        result = self.client.table("study_qa_comments")\
            .select("*, study_users!inner(name)")\
            .eq("answer_id", answer_id)\
            .order("created_at", desc=False)\
            .execute()

        if result.data:
            for c in result.data:
                c['user_name'] = c.get('study_users', {}).get('name')
            return result.data
        return []

    async def get_qa_comment_by_id(self, comment_id: int) -> Optional[Dict[str, Any]]:
        """Get comment by ID"""
        result = self.client.table("study_qa_comments")\
            .select("*")\
            .eq("id", comment_id)\
            .execute()

        return result.data[0] if result.data else None

    async def delete_qa_comment(self, comment_id: int) -> bool:
        """Delete comment"""
        result = self.client.table("study_qa_comments")\
            .delete()\
            .eq("id", comment_id)\
            .execute()

        return len(result.data) > 0

    async def mark_bounty_awarded(
        self,
        question_id: int,
        awarded_to_user_id: int
    ):
        """Mark bounty as awarded"""
        self.client.table("study_qa_bounties")\
            .update({
                "status": "awarded",
                "awarded_to_user_id": awarded_to_user_id,
                "awarded_at": datetime.utcnow().isoformat()
            })\
            .eq("question_id", question_id)\
            .eq("status", "active")\
            .execute()

    # ==================== NOTIFICATION OPERATIONS ====================

    async def create_notification(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        question_id: Optional[int] = None,
        upload_id: Optional[int] = None,
        priority: str = "normal",
        notification_data: Optional[Dict] = None,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new notification for a user

        Args:
            user_id: User ID
            notification_type: 'upload_complete', 'review_due'
            title: Notification title
            message: Notification message
            question_id: Optional related question ID
            upload_id: Optional related upload ID
            priority: 'low', 'normal', 'high'
            notification_data: Additional JSON metadata
            action_url: Deep link URL (e.g., "/review?question=123")
            action_label: Button text (e.g., "Review Now")
        """
        expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat()

        data = {
            "user_id": user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "question_id": question_id,
            "upload_id": upload_id,
            "priority": priority,
            "notification_data": notification_data or {},
            "action_url": action_url,
            "action_label": action_label,
            "is_read": False,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": expires_at
        }

        result = self.client.table("study_notifications").insert(data).execute()
        return result.data[0] if result.data else None

    async def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: Optional[int] = 50
    ) -> List[Dict[str, Any]]:
        """
        Get notifications for a user

        Args:
            user_id: User ID
            unread_only: If True, only return unread notifications
            limit: Maximum number of notifications to return
        """
        # Clean up expired notifications first
        await self.cleanup_expired_notifications()

        query = self.client.table("study_notifications")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)

        if unread_only:
            query = query.eq("is_read", False)

        if limit:
            query = query.limit(limit)

        result = query.execute()
        return result.data if result.data else []

    async def get_unread_count(self, user_id: int) -> int:
        """Get count of unread notifications for badge display"""
        result = self.client.table("study_notifications")\
            .select("id", count="exact")\
            .eq("user_id", user_id)\
            .eq("is_read", False)\
            .execute()

        return result.count if result.count else 0

    async def mark_notification_read(self, notification_id: int, user_id: int) -> Dict[str, Any]:
        """Mark a notification as read (verify ownership)"""
        result = self.client.table("study_notifications")\
            .update({"is_read": True})\
            .eq("id", notification_id)\
            .eq("user_id", user_id)\
            .execute()

        return result.data[0] if result.data else None

    async def mark_all_notifications_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user, returns count updated"""
        result = self.client.table("study_notifications")\
            .update({"is_read": True})\
            .eq("user_id", user_id)\
            .eq("is_read", False)\
            .execute()

        return len(result.data) if result.data else 0

    async def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a notification (verify ownership)"""
        result = self.client.table("study_notifications")\
            .delete()\
            .eq("id", notification_id)\
            .eq("user_id", user_id)\
            .execute()

        return len(result.data) > 0

    async def cleanup_expired_notifications(self) -> int:
        """Delete notifications older than 30 days, returns count deleted"""
        try:
            result = self.client.table("study_notifications")\
                .delete()\
                .lt("expires_at", datetime.utcnow().isoformat())\
                .execute()
            return len(result.data) if result.data else 0
        except Exception as e:
            print(f"Warning: Failed to cleanup expired notifications: {e}")
            return 0

    # ==================== SPACED REPETITION OPERATIONS ====================

    async def calculate_next_review_date(
        self,
        question_id: int,
        performance_rating: str  # 'forgot', 'hard', 'good', 'easy'
    ) -> Dict[str, Any]:
        """
        Calculate next review date using modified Anki SM-2 algorithm

        Performance ratings:
        - 'forgot': Reset to 1 day (user marked pending/reviewing after understanding)
        - 'hard': Multiply by 1.2
        - 'good': Multiply by ease_factor (default 2.5)
        - 'easy': Multiply by ease_factor + 0.5

        Args:
            question_id: Question ID
            performance_rating: User performance ('forgot', 'hard', 'good', 'easy')

        Returns:
            Updated question data with new review schedule
        """
        question = await self.get_question_by_id(question_id)
        if not question:
            raise ValueError(f"Question {question_id} not found")

        current_interval = question.get('current_interval_days') or 1
        review_count = question.get('review_count') or 0
        ease_factor = float(question.get('ease_factor') or 2.5)

        # Calculate new interval based on performance
        if performance_rating == 'forgot':
            new_interval = 1  # Reset to beginning
            new_ease_factor = max(1.3, ease_factor - 0.2)  # Decrease ease but not below 1.3
        elif performance_rating == 'hard':
            new_interval = int(current_interval * 1.2)
            new_ease_factor = max(1.3, ease_factor - 0.15)
        elif performance_rating == 'good':
            if review_count == 0:
                new_interval = 1
            elif review_count == 1:
                new_interval = 3
            else:
                new_interval = int(current_interval * ease_factor)
            new_ease_factor = ease_factor
        else:  # 'easy'
            if review_count == 0:
                new_interval = 3
            elif review_count == 1:
                new_interval = 7
            else:
                new_interval = int(current_interval * (ease_factor + 0.5))
            new_ease_factor = min(4.0, ease_factor + 0.15)  # Increase ease but cap at 4.0

        # Cap interval at 180 days (6 months)
        new_interval = min(new_interval, 180)

        # Calculate next review date
        next_review_date = (datetime.utcnow() + timedelta(days=new_interval)).isoformat()

        # Update question
        update_data = {
            'last_reviewed_at': datetime.utcnow().isoformat(),
            'review_count': review_count + 1,
            'current_interval_days': new_interval,
            'next_review_date': next_review_date,
            'ease_factor': new_ease_factor
        }

        updated_question = await self.update_question(question_id, **update_data)
        return updated_question

    async def get_due_reviews(self, user_id: int, grade: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get questions that are due for review (next_review_date <= now)
        Only includes questions with status 'reviewing' or 'understood'

        Args:
            user_id: User ID
            grade: Optional grade filter

        Returns:
            List of questions due for review
        """
        query = self.client.table("study_questions")\
            .select("*")\
            .eq("user_id", user_id)\
            .in_("status", ["reviewing", "understood"])\
            .not_.is_("next_review_date", "null")\
            .lte("next_review_date", datetime.utcnow().isoformat())\
            .order("next_review_date", desc=False)  # Oldest due first

        if grade:
            query = query.eq("grade", grade)

        result = query.execute()
        return result.data if result.data else []

    async def create_review_notifications_for_due_questions(self, user_id: int) -> int:
        """
        Create notifications for all questions that are due for review
        Called when user logs in or fetches notifications

        Returns:
            Count of notifications created
        """
        due_questions = await self.get_due_reviews(user_id)
        notifications_created = 0

        for question in due_questions:
            # Check if notification already exists for this question
            existing = self.client.table("study_notifications")\
                .select("id")\
                .eq("user_id", user_id)\
                .eq("type", "review_due")\
                .eq("question_id", question['id'])\
                .eq("is_read", False)\
                .execute()

            if existing.data:
                continue  # Skip if notification already exists

            # Create notification
            await self.create_notification(
                user_id=user_id,
                notification_type="review_due",
                title="Time to Review!",
                message=f"Review your {question['subject']} question to reinforce learning",
                question_id=question['id'],
                priority="normal",
                notification_data={
                    "subject": question['subject'],
                    "grade": question.get('grade'),
                    "review_count": question.get('review_count', 0),
                    "interval_days": question.get('current_interval_days', 1)
                },
                action_url=f"/review?question={question['id']}",
                action_label="Review Now"
            )
            notifications_created += 1

        return notifications_created


# Create singleton instance
supabase_db = SupabaseDBService()
