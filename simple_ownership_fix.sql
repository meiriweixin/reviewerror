-- Simple ownership transfer - no superuser permissions needed
-- This makes anon the owner of tables, giving it full control

-- ==================== DISABLE RLS ====================
ALTER TABLE study.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history DISABLE ROW LEVEL SECURITY;

-- ==================== TRANSFER OWNERSHIP ====================
-- Make anon the owner of all tables (this gives complete control)
ALTER TABLE study.users OWNER TO anon;
ALTER TABLE study.questions OWNER TO anon;
ALTER TABLE study.upload_history OWNER TO anon;

-- Make anon the owner of all sequences
ALTER SEQUENCE study.users_id_seq OWNER TO anon;
ALTER SEQUENCE study.questions_id_seq OWNER TO anon;
ALTER SEQUENCE study.upload_history_id_seq OWNER TO anon;

-- ==================== VERIFICATION ====================
-- Check table ownership (should show anon as owner)
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Check RLS status (should all be false)
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- Check sequence ownership (should show anon as owner)
SELECT
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences
WHERE schemaname = 'study'
ORDER BY sequencename;

-- Success message
SELECT 'Tables and sequences now owned by anon role!' as message;
SELECT 'RLS disabled - anon has full permissions' as status;
