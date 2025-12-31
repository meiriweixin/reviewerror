-- Add user_notes column to study_questions table
-- Allows users to add personal notes/annotations to each question

ALTER TABLE study_questions
ADD COLUMN IF NOT EXISTS user_notes TEXT DEFAULT NULL;

-- Add index for faster queries when filtering by notes
CREATE INDEX IF NOT EXISTS idx_study_questions_user_notes
ON study_questions(user_id)
WHERE user_notes IS NOT NULL;
