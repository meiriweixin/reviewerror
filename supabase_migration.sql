-- ============================================
-- Supabase PostgreSQL Migration Script
-- Student Review App - Full Database Schema
-- ============================================

-- Note: The 'study' schema should already exist from previous setup
-- If not, uncomment the next line:
-- CREATE SCHEMA IF NOT EXISTS study;

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS study.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    grade VARCHAR(50),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE IF NOT EXISTS study.questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study.users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(50),
    question_text TEXT NOT NULL,
    image_url VARCHAR(500),
    image_snippet_url VARCHAR(500),
    explanation TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'understood')),
    vector_id UUID,  -- Reference to question_embeddings.id
    question_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Upload history table
CREATE TABLE IF NOT EXISTS study.upload_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    questions_extracted INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ADD FOREIGN KEY CONSTRAINT TO question_embeddings
-- ============================================

-- Add foreign key from question_embeddings to questions (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_questions'
        AND table_schema = 'study'
        AND table_name = 'question_embeddings'
    ) THEN
        ALTER TABLE study.question_embeddings
        ADD CONSTRAINT fk_questions
        FOREIGN KEY (question_id) REFERENCES study.questions(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON study.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON study.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON study.users(created_at);

-- Questions indexes
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON study.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON study.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_grade ON study.questions(grade);
CREATE INDEX IF NOT EXISTS idx_questions_status ON study.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON study.questions(created_at);
CREATE INDEX IF NOT EXISTS idx_questions_vector_id ON study.questions(vector_id);

-- Upload history indexes
CREATE INDEX IF NOT EXISTS idx_upload_history_user_id ON study.upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON study.upload_history(created_at);
CREATE INDEX IF NOT EXISTS idx_upload_history_status ON study.upload_history(status);

-- ============================================
-- 4. CREATE AUTO-UPDATE TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION study.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON study.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON study.users
    FOR EACH ROW
    EXECUTE FUNCTION study.update_updated_at_column();

-- Trigger for questions table
DROP TRIGGER IF EXISTS update_questions_updated_at ON study.questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON study.questions
    FOR EACH ROW
    EXECUTE FUNCTION study.update_updated_at_column();

-- Trigger for question_embeddings table
DROP TRIGGER IF EXISTS update_question_embeddings_updated_at ON study.question_embeddings;
CREATE TRIGGER update_question_embeddings_updated_at
    BEFORE UPDATE ON study.question_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION study.update_updated_at_column();

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE study.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CREATE RLS POLICIES
-- ============================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON study.users;
CREATE POLICY "Users can view their own profile"
ON study.users FOR SELECT
USING (true);  -- We handle auth in application layer with service_role key

DROP POLICY IF EXISTS "Users can insert their profile" ON study.users;
CREATE POLICY "Users can insert their profile"
ON study.users FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON study.users;
CREATE POLICY "Users can update their own profile"
ON study.users FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Users can delete their own profile" ON study.users;
CREATE POLICY "Users can delete their own profile"
ON study.users FOR DELETE
USING (true);

-- Questions table policies
DROP POLICY IF EXISTS "Users can view their own questions" ON study.questions;
CREATE POLICY "Users can view their own questions"
ON study.questions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own questions" ON study.questions;
CREATE POLICY "Users can insert their own questions"
ON study.questions FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own questions" ON study.questions;
CREATE POLICY "Users can update their own questions"
ON study.questions FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Users can delete their own questions" ON study.questions;
CREATE POLICY "Users can delete their own questions"
ON study.questions FOR DELETE
USING (true);

-- Upload history table policies
DROP POLICY IF EXISTS "Users can view their own upload history" ON study.upload_history;
CREATE POLICY "Users can view their own upload history"
ON study.upload_history FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own upload history" ON study.upload_history;
CREATE POLICY "Users can insert their own upload history"
ON study.upload_history FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their upload history" ON study.upload_history;
CREATE POLICY "Users can update their upload history"
ON study.upload_history FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Users can delete their upload history" ON study.upload_history;
CREATE POLICY "Users can delete their upload history"
ON study.upload_history FOR DELETE
USING (true);

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

-- Verify tables were created
SELECT
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Verify indexes were created
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'study'
ORDER BY tablename, indexname;

-- Verify foreign keys
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'study'
ORDER BY tc.table_name;

-- ============================================
-- MIGRATION COMPLETE! 🎉
-- ============================================
-- Next steps:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Verify all tables, indexes, and policies were created
-- 3. Note your database password for backend configuration
-- 4. Update backend code to use PostgreSQL
-- ============================================
