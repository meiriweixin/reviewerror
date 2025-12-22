-- Add missing tables to the study schema
-- Simplified version without service_role RLS policies
-- Run this if you already have study.question_embeddings but missing other tables

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

-- ================== AUTO-UPDATE TRIGGERS ==================

-- Create function to update updated_at timestamp (if not exists)
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

-- ================== ROW LEVEL SECURITY (RLS) ==================

-- Disable RLS for simplicity since backend uses service_role key
-- The service_role key at API level bypasses RLS anyway
ALTER TABLE IF EXISTS study.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study.upload_history DISABLE ROW LEVEL SECURITY;

-- ================== VERIFICATION ==================

-- Check that all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'study'
ORDER BY table_name;

-- Success message
SELECT 'Missing tables added successfully!' as message;
