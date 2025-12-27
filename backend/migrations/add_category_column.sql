-- Migration: Add category column to study_questions table
-- Date: 2025-12-28
-- Description: Adds a category field to enable question categorization (e.g., Algebra, Geometry)

-- Add category column to study_questions table
ALTER TABLE study_questions
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_study_questions_category
ON study_questions(category);

-- Add composite index for common filter combinations (subject + category)
CREATE INDEX IF NOT EXISTS idx_study_questions_subject_category
ON study_questions(subject, category);

-- Optional: Add a comment to the column
COMMENT ON COLUMN study_questions.category IS 'Question category/topic within a subject (e.g., Algebra, Geometry for Mathematics)';
