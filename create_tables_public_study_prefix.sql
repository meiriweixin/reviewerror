-- Create all tables in public schema with study_ prefix
-- This avoids conflicts with other tables in public schema

-- ================== USERS TABLE ==================

CREATE TABLE IF NOT EXISTS study_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    grade VARCHAR(50),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for study_users
CREATE INDEX IF NOT EXISTS idx_study_users_email ON study_users(email);
CREATE INDEX IF NOT EXISTS idx_study_users_google_id ON study_users(google_id);

-- ================== QUESTIONS TABLE ==================

CREATE TABLE IF NOT EXISTS study_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
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

-- Create indexes for study_questions
CREATE INDEX IF NOT EXISTS idx_study_questions_user_id ON study_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_questions_subject ON study_questions(subject);
CREATE INDEX IF NOT EXISTS idx_study_questions_status ON study_questions(status);
CREATE INDEX IF NOT EXISTS idx_study_questions_grade ON study_questions(grade);
CREATE INDEX IF NOT EXISTS idx_study_questions_created_at ON study_questions(created_at);

-- ================== UPLOAD HISTORY TABLE ==================

CREATE TABLE IF NOT EXISTS study_upload_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    subject VARCHAR(100),
    questions_extracted INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for study_upload_history
CREATE INDEX IF NOT EXISTS idx_study_upload_history_user_id ON study_upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_study_upload_history_created_at ON study_upload_history(created_at);

-- ================== AUTO-UPDATE TRIGGERS ==================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_study_users_updated_at ON study_users;
CREATE TRIGGER update_study_users_updated_at
    BEFORE UPDATE ON study_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_study_questions_updated_at ON study_questions;
CREATE TRIGGER update_study_questions_updated_at
    BEFORE UPDATE ON study_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================== DISABLE RLS ==================
-- Disable RLS - backend handles authorization via JWT
ALTER TABLE study_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_upload_history DISABLE ROW LEVEL SECURITY;

-- ================== VERIFICATION ==================

-- Check tables exist in public schema
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'study_%'
ORDER BY tablename;

-- Check RLS is disabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'study_%'
ORDER BY tablename;

-- Success message
SELECT 'Tables created in public schema with study_ prefix!' as message;
SELECT 'RLS is disabled - backend handles all authorization' as note;
