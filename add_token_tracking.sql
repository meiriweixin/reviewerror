-- Add token usage tracking columns to study_users table

-- Add columns for tracking token usage
ALTER TABLE study_users
ADD COLUMN IF NOT EXISTS total_tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prompt_tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_token_update TIMESTAMP DEFAULT NOW();

-- Add comment to columns for documentation
COMMENT ON COLUMN study_users.total_tokens_used IS 'Total tokens consumed by this user across all AI operations';
COMMENT ON COLUMN study_users.prompt_tokens_used IS 'Total prompt/input tokens used';
COMMENT ON COLUMN study_users.completion_tokens_used IS 'Total completion/output tokens generated';
COMMENT ON COLUMN study_users.last_token_update IS 'Timestamp of last token usage update';

-- Create index for faster queries on token usage
CREATE INDEX IF NOT EXISTS idx_study_users_total_tokens ON study_users(total_tokens_used);
