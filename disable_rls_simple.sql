-- Simple solution: Disable RLS and grant permissions to postgres role
-- This works when anon/authenticated/service_role roles don't exist

-- Step 1: Disable RLS on all tables (simplest approach)
ALTER TABLE study.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Anyone can insert users" ON study.users;
DROP POLICY IF EXISTS "Anyone can select users" ON study.users;
DROP POLICY IF EXISTS "Anyone can update users" ON study.users;
DROP POLICY IF EXISTS "Anyone can manage questions" ON study.questions;
DROP POLICY IF EXISTS "Anyone can manage upload_history" ON study.upload_history;

-- Step 3: Grant full permissions to postgres role
GRANT ALL ON SCHEMA study TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA study TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA study TO postgres;

-- Step 4: Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON SEQUENCES TO postgres;

-- Step 5: Verify RLS is disabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Step 6: Verify sequence permissions
SELECT
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences
WHERE schemaname = 'study'
ORDER BY sequencename;

-- Success message
SELECT 'RLS disabled - using direct postgres access!' as message;
SELECT 'All permissions granted to postgres role' as status;
