"""Mock Supabase service for testing without Supabase"""
from typing import List, Dict, Any, Optional

class SupabaseServiceMock:
    """Mock version of Supabase service for testing"""

    def __init__(self):
        print("WARNING: Using mock Supabase service. Vector search will not work.")
        self.table_name = "question_embeddings"
        self.storage = []  # In-memory storage

    async def create_embedding_table(self):
        """Mock: No-op"""
        pass

    async def store_question_embedding(
        self,
        user_id: int,
        question_id: int,
        question_text: str,
        embedding: List[float],
        subject: str,
        grade: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Mock: Store in memory"""
        import uuid
        vector_id = str(uuid.uuid4())
        self.storage.append({
            "id": vector_id,
            "user_id": user_id,
            "question_id": question_id,
            "question_text": question_text,
            "subject": subject,
            "grade": grade,
            "metadata": metadata
        })
        return vector_id

    async def search_similar_questions(
        self,
        user_id: int,
        query_embedding: List[float],
        limit: int = 10,
        subject: Optional[str] = None,
        grade: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Mock: Return empty list"""
        print("WARNING: Mock vector search - returning empty results")
        return []

    async def delete_question_embedding(self, vector_id: str) -> bool:
        """Mock: Always return True"""
        return True

    async def update_question_embedding(
        self,
        vector_id: str,
        question_text: Optional[str] = None,
        embedding: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Mock: Always return True"""
        return True

# Create a singleton instance
supabase_service = SupabaseServiceMock()
