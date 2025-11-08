from supabase import create_client, Client
from app.config import settings
from typing import List, Dict, Any, Optional
import json

class SupabaseService:
    def __init__(self):
        # Check if Supabase is properly configured
        if (settings.SUPABASE_SERVICE_ROLE_KEY == "your-supabase-service-role-key" or
            len(settings.SUPABASE_SERVICE_ROLE_KEY) < 20):
            print("WARNING: Supabase not configured properly. Vector search will be disabled.")
            self.client = None
            self.enabled = False
        else:
            try:
                self.client: Client = create_client(
                    settings.SUPABASE_URL,
                    settings.SUPABASE_SERVICE_ROLE_KEY
                )
                self.enabled = True
            except Exception as e:
                print(f"WARNING: Failed to initialize Supabase: {e}")
                self.client = None
                self.enabled = False
        self.table_name = "question_embeddings"

    async def create_embedding_table(self):
        """Create the embeddings table if it doesn't exist"""
        # This would typically be done via Supabase SQL editor or migration
        # Here's the SQL for reference:
        """
        CREATE TABLE IF NOT EXISTS question_embeddings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            subject VARCHAR(100),
            grade VARCHAR(50),
            embedding vector(1536),
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX ON question_embeddings USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);

        CREATE INDEX idx_question_embeddings_user_id ON question_embeddings(user_id);
        CREATE INDEX idx_question_embeddings_subject ON question_embeddings(subject);
        """
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
        """Store question embedding in Supabase vector database"""
        if not self.enabled:
            return "mock-id"

        try:
            data = {
                "user_id": user_id,
                "question_id": question_id,
                "question_text": question_text,
                "subject": subject,
                "grade": grade,
                "embedding": embedding,
                "metadata": json.dumps(metadata or {})
            }

            result = self.client.table(self.table_name).insert(data).execute()

            if result.data and len(result.data) > 0:
                return result.data[0].get("id")

            raise Exception("Failed to store embedding")

        except Exception as e:
            print(f"Error storing embedding: {e}")
            raise

    async def search_similar_questions(
        self,
        user_id: int,
        query_embedding: List[float],
        limit: int = 10,
        subject: Optional[str] = None,
        grade: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar questions using vector similarity"""
        if not self.enabled:
            return []

        try:
            # Build RPC call for vector similarity search
            rpc_params = {
                "query_embedding": query_embedding,
                "match_threshold": 0.7,
                "match_count": limit,
                "p_user_id": user_id
            }

            if subject:
                rpc_params["p_subject"] = subject
            if grade:
                rpc_params["p_grade"] = grade

            # This requires creating a custom RPC function in Supabase
            # For now, we'll use a basic query
            query = self.client.table(self.table_name).select("*").eq("user_id", user_id)

            if subject:
                query = query.eq("subject", subject)
            if grade:
                query = query.eq("grade", grade)

            result = query.limit(limit).execute()

            return result.data if result.data else []

        except Exception as e:
            print(f"Error searching similar questions: {e}")
            return []

    async def delete_question_embedding(self, vector_id: str) -> bool:
        """Delete a question embedding"""
        try:
            result = self.client.table(self.table_name).delete().eq("id", vector_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting embedding: {e}")
            return False

    async def update_question_embedding(
        self,
        vector_id: str,
        question_text: Optional[str] = None,
        embedding: Optional[List[float]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update question embedding"""
        try:
            update_data = {}

            if question_text:
                update_data["question_text"] = question_text
            if embedding:
                update_data["embedding"] = embedding
            if metadata:
                update_data["metadata"] = json.dumps(metadata)

            if not update_data:
                return True

            result = self.client.table(self.table_name).update(update_data).eq("id", vector_id).execute()
            return True
        except Exception as e:
            print(f"Error updating embedding: {e}")
            return False

# Create a singleton instance
supabase_service = SupabaseService()
