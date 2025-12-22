-- Create tables in the study schema for the Student Review App
-- Run this SQL in your Supabase SQL Editor

-- Create study schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS study;

-- Grant permissions on schema (only to roles that exist)
GRANT USAGE ON SCHEMA study TO postgres, authenticated, service_role;
GRANT ALL ON SCHEMA study TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA study TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON TABLES TO postgres, service_role;

-- ================== USERS TABLE ==================

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

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON study.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON study.users(google_id);

-- ================== QUESTIONS TABLE ==================

CREATE TABLE IF NOT EXISTS study.questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study.users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(50),
    question_text TEXT NOT NULL,
    image_url VARCHAR(500),
    image_snippet_url VARCHAR(500),
    explanation TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    vector_id UUID,
    question_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for questions
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON study.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON study.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_status ON study.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_grade ON study.questions(grade);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON study.questions(created_at);

-- ================== UPLOAD HISTORY TABLE ==================

CREATE TABLE IF NOT EXISTS study.upload_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study.users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    subject VARCHAR(100),
    questions_extracted INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for upload_history
CREATE INDEX IF NOT EXISTS idx_upload_history_user_id ON study.upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON study.upload_history(created_at);

-- ================== QUESTION EMBEDDINGS TABLE (if not already created) ==================

CREATE TABLE IF NOT EXISTS study.question_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES study.users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES study.questions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    subject VARCHAR(100),
    grade VARCHAR(50),
    embedding vector(1536),  -- OpenAI ada-002 produces 1536-dimensional vectors
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for question_embeddings
CREATE INDEX IF NOT EXISTS idx_question_embeddings_user_id ON study.question_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_question_embeddings_question_id ON study.question_embeddings(question_id);
CREATE INDEX IF NOT EXISTS idx_question_embeddings_subject ON study.question_embeddings(subject);
CREATE INDEX IF NOT EXISTS idx_question_embeddings_grade ON study.question_embeddings(grade);

-- Create vector similarity search index (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_question_embeddings_vector ON study.question_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ================== AUTO-UPDATE TRIGGERS ==================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION study.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON study.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON study.users
    FOR EACH ROW
    EXECUTE FUNCTION study.update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON study.questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON study.questions
    FOR EACH ROW
    EXECUTE FUNCTION study.update_updated_at_column();

DROP TRIGGER IF EXISTS update_question_embeddings_updated_at ON study.question_embeddings;
CREATE TRIGGER update_question_embeddings_updated_at
    BEFORE UPDATE ON study.question_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION study.update_updated_at_column();

-- ================== ROW LEVEL SECURITY (RLS) ==================

-- Enable RLS (but allow service_role to bypass)
ALTER TABLE study.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.question_embeddings ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Allow service_role full access to users" ON study.users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for questions table
CREATE POLICY "Allow service_role full access to questions" ON study.questions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for upload_history table
CREATE POLICY "Allow service_role full access to upload_history" ON study.upload_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for question_embeddings table
CREATE POLICY "Allow service_role full access to question_embeddings" ON study.question_embeddings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ================== VERIFICATION ==================

-- Check that all tables exist
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'study'
ORDER BY table_name;

-- Check that all indexes exist
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'study'
ORDER BY tablename, indexname;

-- Success message
SELECT 'Study schema tables created successfully!' as message;
