-- Community Q&A Tables Migration
-- Run this in Supabase SQL Editor

-- 1. Questions Table
CREATE TABLE IF NOT EXISTS study_qa_questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    grade VARCHAR(20),
    bounty_amount INTEGER DEFAULT 0,
    bounty_active BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'solved'
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_answer_id INTEGER,
    tags TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_qa_questions_user ON study_qa_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_subject ON study_qa_questions(subject);
CREATE INDEX IF NOT EXISTS idx_qa_questions_grade ON study_qa_questions(grade);
CREATE INDEX IF NOT EXISTS idx_qa_questions_bounty ON study_qa_questions(bounty_active);
CREATE INDEX IF NOT EXISTS idx_qa_questions_status ON study_qa_questions(status);
CREATE INDEX IF NOT EXISTS idx_qa_questions_created ON study_qa_questions(created_at DESC);

-- 2. Answers Table
CREATE TABLE IF NOT EXISTS study_qa_answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES study_qa_questions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qa_answers_question ON study_qa_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_answers_user ON study_qa_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_answers_accepted ON study_qa_answers(is_accepted);

-- 3. Votes Table (polymorphic for both questions and answers)
CREATE TABLE IF NOT EXISTS study_qa_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL, -- 'question' or 'answer'
    entity_id INTEGER NOT NULL,
    vote_type VARCHAR(10) NOT NULL, -- 'upvote' or 'downvote'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_qa_votes_user ON study_qa_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_votes_entity ON study_qa_votes(entity_type, entity_id);

-- 4. Comments Table (on answers)
CREATE TABLE IF NOT EXISTS study_qa_comments (
    id SERIAL PRIMARY KEY,
    answer_id INTEGER NOT NULL REFERENCES study_qa_answers(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qa_comments_answer ON study_qa_comments(answer_id);
CREATE INDEX IF NOT EXISTS idx_qa_comments_user ON study_qa_comments(user_id);

-- 5. Bounties Table (for tracking bounty history)
CREATE TABLE IF NOT EXISTS study_qa_bounties (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES study_qa_questions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES study_users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'awarded', 'refunded'
    awarded_to_user_id INTEGER REFERENCES study_users(id),
    awarded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_qa_bounties_question ON study_qa_bounties(question_id);
CREATE INDEX IF NOT EXISTS idx_qa_bounties_status ON study_qa_bounties(status);

-- Add foreign key for accepted_answer_id after answers table exists
ALTER TABLE study_qa_questions
    ADD CONSTRAINT fk_accepted_answer
    FOREIGN KEY (accepted_answer_id)
    REFERENCES study_qa_answers(id)
    ON DELETE SET NULL;
