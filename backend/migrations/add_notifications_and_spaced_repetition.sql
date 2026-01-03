-- Migration: Add notifications table and spaced repetition columns
-- Date: 2026-01-03
-- Description:
--   1. Create study_notifications table for in-app notifications
--   2. Add spaced repetition columns to study_questions for Anki-style learning

-- ================== NOTIFICATIONS TABLE ==================

CREATE TABLE IF NOT EXISTS study_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,

    -- Notification content
    type VARCHAR(50) NOT NULL,  -- 'upload_complete', 'review_due'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Related entities (nullable for flexibility)
    question_id INTEGER REFERENCES study_questions(id) ON DELETE CASCADE,
    upload_id INTEGER REFERENCES study_upload_history(id) ON DELETE CASCADE,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal',  -- 'low', 'normal', 'high'

    -- Extra metadata for rendering
    notification_data JSONB DEFAULT '{}'::jsonb,

    -- Action handling
    action_url VARCHAR(255),    -- Deep link (e.g., "/review?question=123")
    action_label VARCHAR(100),  -- Button text (e.g., "Review Now")

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE  -- Auto-delete after this date
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_study_notifications_user_id ON study_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_study_notifications_type ON study_notifications(type);
CREATE INDEX IF NOT EXISTS idx_study_notifications_is_read ON study_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_study_notifications_created_at ON study_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_study_notifications_expires_at ON study_notifications(expires_at);

-- Composite index for common query: get unread notifications for user, ordered by date
CREATE INDEX IF NOT EXISTS idx_study_notifications_user_unread
    ON study_notifications(user_id, is_read, created_at DESC);

-- Disable RLS (backend handles auth via JWT)
ALTER TABLE study_notifications DISABLE ROW LEVEL SECURITY;

-- ================== SPACED REPETITION COLUMNS ==================

-- Add spaced repetition tracking columns to study_questions
ALTER TABLE study_questions
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_interval_days INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ease_factor DECIMAL(3,2) DEFAULT 2.5;

-- Index for finding questions due for review
-- Only index questions that are being reviewed (not pending)
CREATE INDEX IF NOT EXISTS idx_study_questions_next_review
    ON study_questions(user_id, next_review_date)
    WHERE status IN ('reviewing', 'understood');

-- Composite index for spaced repetition queries
CREATE INDEX IF NOT EXISTS idx_study_questions_spaced_rep
    ON study_questions(user_id, status, next_review_date);

-- ================== COMMENTS ==================

COMMENT ON TABLE study_notifications IS 'In-app notifications for users (upload completion, review reminders, etc.)';
COMMENT ON COLUMN study_notifications.type IS 'Notification type: upload_complete, review_due';
COMMENT ON COLUMN study_notifications.priority IS 'Priority level: low, normal, high';
COMMENT ON COLUMN study_notifications.notification_data IS 'Additional JSON data for rendering (questions_count, subject, etc.)';
COMMENT ON COLUMN study_notifications.expires_at IS 'Auto-delete notifications after this date (30 days from creation)';

COMMENT ON COLUMN study_questions.last_reviewed_at IS 'Timestamp when user last marked question as understood';
COMMENT ON COLUMN study_questions.review_count IS 'Number of times user has successfully reviewed this question';
COMMENT ON COLUMN study_questions.current_interval_days IS 'Current spaced repetition interval in days';
COMMENT ON COLUMN study_questions.next_review_date IS 'Date when next review notification should be created';
COMMENT ON COLUMN study_questions.ease_factor IS 'Anki SM-2 ease factor (default 2.5, range 1.3-4.0)';

-- ================== VERIFICATION ==================

-- Verify notifications table created
SELECT 'study_notifications table created' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'study_notifications'
);

-- Verify spaced repetition columns added
SELECT 'spaced repetition columns added' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'study_questions'
    AND column_name = 'next_review_date'
);
