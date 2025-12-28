-- Paper Library Feature - Database Migration
-- Run this in Supabase SQL Editor

-- 1. Add credits column to study_users if it doesn't exist
ALTER TABLE study_users
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5;

-- Update existing users to have 5 credits
UPDATE study_users SET credits = 5 WHERE credits IS NULL;

-- 2. Create study_papers table
CREATE TABLE IF NOT EXISTS study_papers (
    id SERIAL PRIMARY KEY,
    uploader_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade TEXT,
    year INTEGER,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    download_count INTEGER DEFAULT 0,
    practice_count INTEGER DEFAULT 0,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_study_papers_subject ON study_papers(subject);
CREATE INDEX IF NOT EXISTS idx_study_papers_grade ON study_papers(grade);
CREATE INDEX IF NOT EXISTS idx_study_papers_uploader ON study_papers(uploader_id);
CREATE INDEX IF NOT EXISTS idx_study_papers_upload_date ON study_papers(upload_date DESC);

-- 3. Create study_credit_transactions table for audit trail
CREATE TABLE IF NOT EXISTS study_credit_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    description TEXT,
    paper_id INTEGER REFERENCES study_papers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user transactions
CREATE INDEX IF NOT EXISTS idx_study_credit_transactions_user ON study_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_credit_transactions_created ON study_credit_transactions(created_at DESC);

-- 4. Add source_paper_id column to study_questions (for linking captured questions to papers)
ALTER TABLE study_questions
ADD COLUMN IF NOT EXISTS source_paper_id INTEGER REFERENCES study_papers(id) ON DELETE SET NULL;

-- 5. Enable Row Level Security (RLS) policies if needed
-- Note: If using service role key, RLS is bypassed. These are for anon key access.

-- Papers can be read by anyone
ALTER TABLE study_papers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Papers are viewable by everyone"
    ON study_papers FOR SELECT
    USING (true);

-- Papers can be inserted by authenticated users
CREATE POLICY IF NOT EXISTS "Users can upload papers"
    ON study_papers FOR INSERT
    WITH CHECK (true);

-- Papers can be updated by uploader or admin
CREATE POLICY IF NOT EXISTS "Users can update own papers"
    ON study_papers FOR UPDATE
    USING (true);

-- Credit transactions can be read by the user themselves
ALTER TABLE study_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own transactions"
    ON study_credit_transactions FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "System can create transactions"
    ON study_credit_transactions FOR INSERT
    WITH CHECK (true);

-- Grant permissions to anon role (for service role, this is automatic)
GRANT SELECT, INSERT, UPDATE ON study_papers TO anon;
GRANT SELECT, INSERT ON study_credit_transactions TO anon;
GRANT USAGE, SELECT ON SEQUENCE study_papers_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE study_credit_transactions_id_seq TO anon;

-- Verification queries
SELECT 'Tables created successfully!' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'study_papers';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'study_credit_transactions';
