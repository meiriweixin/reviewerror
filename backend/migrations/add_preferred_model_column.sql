-- Add preferred_model column to study_users table
-- Default is 'gpt-4o' (always available)
-- Users can choose 'gpt-5-chat' if configured, otherwise falls back to 'gpt-4o'

ALTER TABLE study_users
ADD COLUMN IF NOT EXISTS preferred_model VARCHAR(20) DEFAULT 'gpt-4o';

-- Add a check constraint to ensure only valid model values
ALTER TABLE study_users
ADD CONSTRAINT check_preferred_model
CHECK (preferred_model IN ('gpt-4o', 'gpt-5-chat'));

-- Update existing users to use gpt-4o as default (safe fallback)
UPDATE study_users
SET preferred_model = 'gpt-4o'
WHERE preferred_model IS NULL;
