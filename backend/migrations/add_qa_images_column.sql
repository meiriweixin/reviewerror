-- Add images column to study_qa_questions table
-- Run this in Supabase SQL Editor

ALTER TABLE study_qa_questions
ADD COLUMN IF NOT EXISTS images TEXT[];

-- This column stores an array of image URLs (e.g., ['/uploads/qa/img1.jpg', '/uploads/qa/img2.jpg'])
