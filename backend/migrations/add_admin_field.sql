-- Add is_admin column to study_users table
-- This migration adds admin functionality to the system
-- Run this in Supabase SQL Editor

-- Add is_admin column (defaults to false)
ALTER TABLE study_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set xwxnju@gmail.com as the admin user
UPDATE study_users SET is_admin = TRUE WHERE email = 'xwxnju@gmail.com';

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_study_users_is_admin ON study_users(is_admin);

-- Add comment
COMMENT ON COLUMN study_users.is_admin IS 'Indicates if the user has admin privileges';
