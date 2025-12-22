-- Disable RLS but continue using anon key
-- This is simpler and works since backend handles all authorization

-- Step 1: Disable RLS on all tables
ALTER TABLE study.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all RLS policies (no longer needed)
DROP POLICY IF EXISTS "Users full access" ON study.users;
DROP POLICY IF EXISTS "Questions full access" ON study.questions;
DROP POLICY IF EXISTS "Upload history full access" ON study.upload_history;

-- Step 3: Grant schema permissions to anon
GRANT USAGE ON SCHEMA study TO anon;
GRANT ALL ON SCHEMA study TO postgres;

-- Step 4: Grant ALL privileges on all tables to anon
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA study TO anon;

-- Step 5: Grant ALL privileges on all sequences to anon
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA study TO anon;

-- Step 6: Grant permissions on each table explicitly
GRANT SELECT, INSERT, UPDATE, DELETE ON study.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON study.questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON study.upload_history TO anon;

-- Step 7: Grant permissions on each sequence explicitly
GRANT USAGE, SELECT, UPDATE ON study.users_id_seq TO anon;
GRANT USAGE, SELECT, UPDATE ON study.questions_id_seq TO anon;
GRANT USAGE, SELECT, UPDATE ON study.upload_history_id_seq TO anon;

-- Step 8: Set default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA study
GRANT ALL ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA study
GRANT ALL ON SEQUENCES TO anon;

-- Step 9: Verify RLS is disabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Step 10: Verify permissions
SELECT
    table_schema,
    table_name,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE grantee = 'anon'
AND table_schema = 'study'
GROUP BY table_schema, table_name
ORDER BY table_name;

-- Success message
SELECT 'RLS disabled, anon role has full permissions!' as message;
SELECT 'Backend uses SUPABASE_KEY (anon key) with full table access' as status;
