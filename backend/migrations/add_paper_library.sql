-- Migration: Add Paper Library tables and credits system
-- Date: 2025-12-28
-- Description: Creates tables for PDF paper library and implements credits system

-- 1. Add credits column to users table
ALTER TABLE study_users
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5;

COMMENT ON COLUMN study_users.credits IS 'User credits for downloading/practicing papers (default: 5)';

-- 2. Create papers table
CREATE TABLE IF NOT EXISTS study_papers (
  id BIGSERIAL PRIMARY KEY,
  uploader_id BIGINT NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade TEXT,
  year INTEGER,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  practice_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE study_papers IS 'Stores uploaded exam papers for the Paper Library';
COMMENT ON COLUMN study_papers.uploader_id IS 'User who uploaded the paper';
COMMENT ON COLUMN study_papers.title IS 'Paper title (e.g., "2023 Mid-Year Exam")';
COMMENT ON COLUMN study_papers.file_url IS 'Supabase Storage URL or path to PDF file';
COMMENT ON COLUMN study_papers.download_count IS 'Number of times paper was downloaded';
COMMENT ON COLUMN study_papers.practice_count IS 'Number of times paper was opened in practice mode';

-- 3. Add source_paper_id to questions table (for linking captured questions)
ALTER TABLE study_questions
ADD COLUMN IF NOT EXISTS source_paper_id BIGINT REFERENCES study_papers(id) ON DELETE SET NULL;

COMMENT ON COLUMN study_questions.source_paper_id IS 'Links question to the paper it was captured from';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_papers_uploader
ON study_papers(uploader_id);

CREATE INDEX IF NOT EXISTS idx_study_papers_subject
ON study_papers(subject);

CREATE INDEX IF NOT EXISTS idx_study_papers_grade
ON study_papers(grade);

CREATE INDEX IF NOT EXISTS idx_study_papers_year
ON study_papers(year);

CREATE INDEX IF NOT EXISTS idx_study_questions_source_paper
ON study_questions(source_paper_id);

-- 5. Create credit transactions table (for tracking credit history)
CREATE TABLE IF NOT EXISTS study_credit_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  paper_id BIGINT REFERENCES study_papers(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE study_credit_transactions IS 'Tracks all credit transactions for auditing';
COMMENT ON COLUMN study_credit_transactions.amount IS 'Credit amount (positive for earn, negative for spend)';
COMMENT ON COLUMN study_credit_transactions.transaction_type IS 'Type: upload, download, practice, admin_adjust';

CREATE INDEX IF NOT EXISTS idx_study_credit_transactions_user
ON study_credit_transactions(user_id, created_at DESC);
