-- Complete RLS setup with anon and authenticated roles
-- Run this after creating anon and authenticated roles

-- Step 1: Enable RLS on all tables
ALTER TABLE study.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Anyone can insert users" ON study.users;
DROP POLICY IF EXISTS "Anyone can select users" ON study.users;
DROP POLICY IF EXISTS "Anyone can update users" ON study.users;
DROP POLICY IF EXISTS "Anyone can delete users" ON study.users;
DROP POLICY IF EXISTS "Anyone can manage questions" ON study.questions;
DROP POLICY IF EXISTS "Anyone can manage upload_history" ON study.upload_history;

-- Step 3: Grant schema permissions
GRANT USAGE ON SCHEMA study TO anon, authenticated, postgres;
GRANT ALL ON SCHEMA study TO postgres;

-- Step 4: Grant table permissions
GRANT ALL ON study.users TO anon, authenticated, postgres;
GRANT ALL ON study.questions TO anon, authenticated, postgres;
GRANT ALL ON study.upload_history TO anon, authenticated, postgres;

-- Step 5: Grant sequence permissions (CRITICAL for INSERT operations)
GRANT USAGE, SELECT ON study.users_id_seq TO anon, authenticated, postgres;
GRANT USAGE, SELECT ON study.questions_id_seq TO anon, authenticated, postgres;
GRANT USAGE, SELECT ON study.upload_history_id_seq TO anon, authenticated, postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA study TO anon, authenticated, postgres;

-- Step 6: Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, postgres;

-- Step 7: Create RLS policies for users table
CREATE POLICY "Users full access"
ON study.users FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 8: Create RLS policies for questions table
CREATE POLICY "Questions full access"
ON study.questions FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 9: Create RLS policies for upload_history table
CREATE POLICY "Upload history full access"
ON study.upload_history FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 10: Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Step 11: Verify policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'study'
ORDER BY tablename, policyname;

-- Step 12: Verify sequence permissions
SELECT
    n.nspname as schema,
    c.relname as sequence,
    pg_get_userbyid(c.relowner) as owner,
    (SELECT string_agg(privilege_type, ', ')
     FROM information_schema.role_table_grants
     WHERE table_schema = n.nspname
     AND table_name = c.relname
     AND grantee IN ('anon', 'authenticated')) as granted_privileges
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'S'
AND n.nspname = 'study'
ORDER BY c.relname;

-- Success message
SELECT 'RLS enabled with full permissions for anon and authenticated roles!' as message;
SELECT 'Backend can now use SUPABASE_KEY (anon key)' as instruction;
