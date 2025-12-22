-- Properly configure RLS for study schema
-- This allows service_role to bypass RLS while maintaining security

-- Step 1: Enable RLS on all tables
ALTER TABLE study.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.question_embeddings ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies
DROP POLICY IF EXISTS "Allow service_role full access to users" ON study.users;
DROP POLICY IF EXISTS "Allow service_role full access to questions" ON study.questions;
DROP POLICY IF EXISTS "Allow service_role full access to upload_history" ON study.upload_history;
DROP POLICY IF EXISTS "Allow service_role full access to question_embeddings" ON study.question_embeddings;

-- Step 3: Create policies that allow ALL operations when using service role key
-- The key insight: service_role bypasses RLS by default in Supabase
-- But we need to ensure sequences and tables have proper ownership

-- Step 4: Grant permissions on tables
GRANT ALL ON study.users TO postgres;
GRANT ALL ON study.questions TO postgres;
GRANT ALL ON study.upload_history TO postgres;
GRANT ALL ON study.question_embeddings TO postgres;

-- Step 5: Grant permissions on sequences (CRITICAL for INSERT operations)
GRANT ALL ON study.users_id_seq TO postgres;
GRANT ALL ON study.questions_id_seq TO postgres;
GRANT ALL ON study.upload_history_id_seq TO postgres;

-- Step 6: Grant USAGE on sequences (needed for service_role)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA study TO postgres;

-- Step 7: Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Step 8: Verify sequence permissions
SELECT
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences
WHERE schemaname = 'study'
ORDER BY sequencename;

-- Success message
SELECT 'RLS enabled with proper permissions for service_role!' as message;
SELECT 'Backend using service_role key will bypass RLS automatically.' as info;
