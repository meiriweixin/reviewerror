# Supabase Setup Guide

This guide will help you set up Supabase for the Student Review App's vector database functionality.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Project Name:** student-review-app
   - **Database Password:** (choose a strong password)
   - **Region:** Choose closest to your users
5. Wait for the project to be created

## 2. Enable pgvector Extension

1. In your Supabase project dashboard, go to **SQL Editor**
2. Create a new query
3. Run the following SQL:

```sql
-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify it's installed
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## 3. Create the Embeddings Table

Run this SQL in the SQL Editor:

```sql
-- Create the question_embeddings table
CREATE TABLE IF NOT EXISTS question_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    subject VARCHAR(100),
    grade VARCHAR(50),
    embedding vector(1536),  -- OpenAI ada-002 produces 1536-dimensional vectors
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_question_embeddings_user_id ON question_embeddings(user_id);
CREATE INDEX idx_question_embeddings_question_id ON question_embeddings(question_id);
CREATE INDEX idx_question_embeddings_subject ON question_embeddings(subject);
CREATE INDEX idx_question_embeddings_grade ON question_embeddings(grade);
CREATE INDEX idx_question_embeddings_created_at ON question_embeddings(created_at);

-- Create vector similarity search index (IVFFlat)
-- This index speeds up similarity searches
CREATE INDEX ON question_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Note: For larger datasets (>1M rows), consider using HNSW index:
-- CREATE INDEX ON question_embeddings
-- USING hnsw (embedding vector_cosine_ops);
```

## 4. Create Helper Functions (Optional but Recommended)

These functions make vector similarity search easier:

```sql
-- Function to search for similar questions
CREATE OR REPLACE FUNCTION search_similar_questions(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10,
    p_user_id int DEFAULT NULL,
    p_subject varchar DEFAULT NULL,
    p_grade varchar DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    user_id int,
    question_id int,
    question_text text,
    subject varchar,
    grade varchar,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        qe.id,
        qe.user_id,
        qe.question_id,
        qe.question_text,
        qe.subject,
        qe.grade,
        1 - (qe.embedding <=> query_embedding) as similarity,
        qe.metadata
    FROM question_embeddings qe
    WHERE
        (p_user_id IS NULL OR qe.user_id = p_user_id)
        AND (p_subject IS NULL OR qe.subject = p_subject)
        AND (p_grade IS NULL OR qe.grade = p_grade)
        AND 1 - (qe.embedding <=> query_embedding) > match_threshold
    ORDER BY qe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to get question count by subject
CREATE OR REPLACE FUNCTION get_question_count_by_subject(p_user_id int)
RETURNS TABLE (
    subject varchar,
    question_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        qe.subject,
        COUNT(*) as question_count
    FROM question_embeddings qe
    WHERE qe.user_id = p_user_id
    GROUP BY qe.subject
    ORDER BY question_count DESC;
END;
$$;
```

## 5. Set Up Row Level Security (RLS)

Enable RLS to ensure users can only access their own questions:

```sql
-- Enable Row Level Security
ALTER TABLE question_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own questions
CREATE POLICY "Users can view their own questions"
ON question_embeddings
FOR SELECT
USING (true);  -- We handle auth in the application layer

-- Create policy for users to insert their own questions
CREATE POLICY "Users can insert their own questions"
ON question_embeddings
FOR INSERT
WITH CHECK (true);  -- We handle auth in the application layer

-- Create policy for users to update their own questions
CREATE POLICY "Users can update their own questions"
ON question_embeddings
FOR UPDATE
USING (true);  -- We handle auth in the application layer

-- Create policy for users to delete their own questions
CREATE POLICY "Users can delete their own questions"
ON question_embeddings
FOR DELETE
USING (true);  -- We handle auth in the application layer

-- Note: In production, you should implement proper RLS policies
-- that check auth.uid() against user_id
```

## 6. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:

   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGci...` (for frontend)
   - **service_role key:** `eyJhbGci...` (for backend - keep this secret!)

3. Add these to your `.env` files:

**Frontend (.env.local):**
```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key
```

**Backend (backend/.env):**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 7. Test the Setup

Run this SQL to verify everything works:

```sql
-- Insert a test record
INSERT INTO question_embeddings (
    user_id,
    question_id,
    question_text,
    subject,
    grade,
    embedding,
    metadata
) VALUES (
    1,
    1,
    'What is the capital of France?',
    'Geography',
    'sec1',
    array_fill(0.1, ARRAY[1536])::vector,
    '{"topic": "European capitals", "difficulty": "easy"}'::jsonb
);

-- Query to verify
SELECT
    id,
    user_id,
    question_text,
    subject,
    created_at
FROM question_embeddings
WHERE user_id = 1;

-- Test similarity search function
SELECT * FROM search_similar_questions(
    array_fill(0.1, ARRAY[1536])::vector,
    0.5,
    5,
    1
);

-- Clean up test data
DELETE FROM question_embeddings WHERE user_id = 1;
```

## 8. Performance Optimization

For better performance with large datasets:

```sql
-- Vacuum and analyze the table regularly
VACUUM ANALYZE question_embeddings;

-- Update table statistics
ANALYZE question_embeddings;

-- Monitor index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'question_embeddings';
```

## 9. Backup Configuration

1. Go to **Database** → **Backups** in Supabase dashboard
2. Enable automatic daily backups
3. Consider setting up Point-in-Time Recovery (PITR) for production

## Troubleshooting

### Error: "extension 'vector' does not exist"
- Make sure you ran the `CREATE EXTENSION vector;` command
- Check that your Supabase project supports pgvector (it should by default)

### Slow similarity searches
- Ensure the IVFFlat index is created
- Increase the `lists` parameter for larger datasets
- Consider using HNSW index for very large datasets (>1M rows)

### RLS blocking queries
- Temporarily disable RLS for debugging: `ALTER TABLE question_embeddings DISABLE ROW LEVEL SECURITY;`
- Check your policies match your authentication setup
- Review Supabase auth logs

### Connection errors from backend
- Verify SUPABASE_URL and keys are correct
- Check if your IP is allowed (Supabase allows all by default)
- Ensure you're using the service_role key for backend operations

## Additional Resources

- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai/vector-columns)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Vector Similarity Search Guide](https://supabase.com/docs/guides/ai/semantic-search)

## Security Best Practices

1. **Never expose service_role key** in frontend code
2. **Implement proper RLS policies** before going to production
3. **Use anon key** for frontend operations
4. **Rotate keys periodically**
5. **Monitor API usage** in Supabase dashboard
6. **Set up alerts** for unusual activity
7. **Enable MFA** on your Supabase account

---

Your Supabase vector database is now ready! 🚀
