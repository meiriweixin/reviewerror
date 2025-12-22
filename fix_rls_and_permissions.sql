-- Comprehensive fix for RLS and permissions issues
-- This fixes "permission denied for sequence users_id_seq" error

-- Step 1: Disable RLS on all study schema tables
-- The backend uses service_role key which should bypass RLS anyway
ALTER TABLE IF EXISTS study.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study.upload_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study.question_embeddings DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing RLS policies (if any)
DROP POLICY IF EXISTS "Allow service_role full access to users" ON study.users;
DROP POLICY IF EXISTS "Allow service_role full access to questions" ON study.questions;
DROP POLICY IF EXISTS "Allow service_role full access to upload_history" ON study.upload_history;

-- Step 3: Grant full permissions on tables to postgres role
GRANT ALL ON ALL TABLES IN SCHEMA study TO postgres;

-- Step 4: Grant full permissions on sequences to postgres role
GRANT ALL ON ALL SEQUENCES IN SCHEMA study TO postgres;

-- Step 5: Grant USAGE on schema
GRANT USAGE ON SCHEMA study TO postgres;
GRANT ALL ON SCHEMA study TO postgres;

-- Step 6: Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON SEQUENCES TO postgres;

-- Step 7: Verify table ownership
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Step 8: Verify sequence ownership
SELECT
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences
WHERE schemaname = 'study'
ORDER BY sequencename;

-- Step 9: Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Success message
SELECT 'RLS disabled and permissions fixed successfully!' as message;
