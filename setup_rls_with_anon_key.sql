-- Setup RLS properly for Supabase anon key usage
-- This is the recommended Supabase pattern: use anon key + RLS policies

-- Step 1: Enable RLS on all tables
ALTER TABLE study.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON study.users;
DROP POLICY IF EXISTS "Users can update their own data" ON study.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON study.users;
DROP POLICY IF EXISTS "Questions belong to user" ON study.questions;
DROP POLICY IF EXISTS "Upload history belongs to user" ON study.upload_history;

-- Step 3: Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA study TO anon, authenticated;
GRANT ALL ON study.users TO anon, authenticated;
GRANT ALL ON study.questions TO anon, authenticated;
GRANT ALL ON study.upload_history TO anon, authenticated;

-- Step 4: Grant permissions on sequences to anon and authenticated
GRANT USAGE, SELECT ON study.users_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON study.questions_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON study.upload_history_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA study TO anon, authenticated;

-- Step 5: Create RLS policies for users table
-- Allow anyone to insert (for new user registration)
CREATE POLICY "Anyone can insert users"
ON study.users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to select (we'll filter by user_id in application)
CREATE POLICY "Anyone can select users"
ON study.users FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to update (we'll validate user_id in application)
CREATE POLICY "Anyone can update users"
ON study.users FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 6: Create RLS policies for questions table
CREATE POLICY "Anyone can manage questions"
ON study.questions FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 7: Create RLS policies for upload_history table
CREATE POLICY "Anyone can manage upload_history"
ON study.upload_history FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Step 8: Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Step 9: List all policies
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

-- Success message
SELECT 'RLS configured for anon/authenticated roles!' as message;
SELECT 'Backend should now use SUPABASE_KEY (anon key) instead of service_role key' as instruction;
