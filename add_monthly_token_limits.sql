-- Add monthly token limit fields to study_users table
-- Run this SQL in your Supabase SQL Editor

-- Add new columns for monthly token limits
ALTER TABLE study_users
ADD COLUMN IF NOT EXISTS monthly_token_limit INTEGER DEFAULT 500000,
ADD COLUMN IF NOT EXISTS monthly_tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS token_limit_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_token_limit_reset ON study_users(token_limit_reset_date);

-- Create function to check and reset monthly token usage
CREATE OR REPLACE FUNCTION reset_monthly_tokens_if_needed()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if a month has passed since last reset
    IF NEW.token_limit_reset_date <= NOW() - INTERVAL '1 month' THEN
        NEW.monthly_tokens_used = 0;
        NEW.token_limit_reset_date = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-reset monthly tokens
DROP TRIGGER IF EXISTS check_monthly_token_reset ON study_users;
CREATE TRIGGER check_monthly_token_reset
    BEFORE UPDATE ON study_users
    FOR EACH ROW
    WHEN (OLD.total_tokens_used IS DISTINCT FROM NEW.total_tokens_used)
    EXECUTE FUNCTION reset_monthly_tokens_if_needed();

-- Update existing users to have proper reset dates (first day of next month)
UPDATE study_users
SET token_limit_reset_date = date_trunc('month', NOW()) + INTERVAL '1 month'
WHERE token_limit_reset_date IS NULL OR token_limit_reset_date < NOW();

-- Verification query
SELECT
    id,
    email,
    monthly_token_limit,
    monthly_tokens_used,
    token_limit_reset_date,
    total_tokens_used
FROM study_users
ORDER BY id
LIMIT 5;

-- Success message
SELECT 'Monthly token limit fields added successfully! Default limit: 500,000 tokens per user per month' as message;
