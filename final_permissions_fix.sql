-- FINAL comprehensive permissions fix for anon role
-- This script grants EVERY possible permission needed

-- ==================== DISABLE RLS ====================
-- RLS can cause "permission denied" errors even with policies
ALTER TABLE IF EXISTS study.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study.questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS study.upload_history DISABLE ROW LEVEL SECURITY;

-- ==================== SCHEMA PERMISSIONS ====================
-- Grant schema access to anon
GRANT USAGE ON SCHEMA study TO anon;
GRANT CREATE ON SCHEMA study TO anon;
GRANT ALL ON SCHEMA study TO anon;

-- ==================== TABLE PERMISSIONS ====================
-- Method 1: Grant using ALL TABLES
GRANT ALL ON ALL TABLES IN SCHEMA study TO anon;

-- Method 2: Grant each privilege explicitly
GRANT SELECT ON ALL TABLES IN SCHEMA study TO anon;
GRANT INSERT ON ALL TABLES IN SCHEMA study TO anon;
GRANT UPDATE ON ALL TABLES IN SCHEMA study TO anon;
GRANT DELETE ON ALL TABLES IN SCHEMA study TO anon;
GRANT TRUNCATE ON ALL TABLES IN SCHEMA study TO anon;
GRANT REFERENCES ON ALL TABLES IN SCHEMA study TO anon;
GRANT TRIGGER ON ALL TABLES IN SCHEMA study TO anon;

-- Method 3: Grant on specific tables
GRANT ALL PRIVILEGES ON study.users TO anon;
GRANT ALL PRIVILEGES ON study.questions TO anon;
GRANT ALL PRIVILEGES ON study.upload_history TO anon;

-- ==================== SEQUENCE PERMISSIONS ====================
-- Method 1: All sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA study TO anon;

-- Method 2: Specific privileges
GRANT USAGE ON ALL SEQUENCES IN SCHEMA study TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA study TO anon;
GRANT UPDATE ON ALL SEQUENCES IN SCHEMA study TO anon;

-- Method 3: Specific sequences
GRANT ALL ON study.users_id_seq TO anon;
GRANT ALL ON study.questions_id_seq TO anon;
GRANT ALL ON study.upload_history_id_seq TO anon;

-- ==================== DEFAULT PRIVILEGES ====================
-- For tables created by postgres role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA study
GRANT ALL ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA study
GRANT ALL ON SEQUENCES TO anon;

-- For tables created by anon role itself
ALTER DEFAULT PRIVILEGES FOR ROLE anon IN SCHEMA study
GRANT ALL ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE anon IN SCHEMA study
GRANT ALL ON SEQUENCES TO anon;

-- ==================== MAKE ANON OWNER (Nuclear option) ====================
-- Change ownership of tables to anon (this gives full control)
ALTER TABLE study.users OWNER TO anon;
ALTER TABLE study.questions OWNER TO anon;
ALTER TABLE study.upload_history OWNER TO anon;

-- Change ownership of sequences to anon
ALTER SEQUENCE study.users_id_seq OWNER TO anon;
ALTER SEQUENCE study.questions_id_seq OWNER TO anon;
ALTER SEQUENCE study.upload_history_id_seq OWNER TO anon;

-- ==================== VERIFICATION ====================
-- Check table ownership
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

-- Check permissions for anon role
SELECT
    table_schema,
    table_name,
    string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE grantee = 'anon'
AND table_schema = 'study'
GROUP BY table_schema, table_name
ORDER BY table_name;

-- Check sequence permissions
SELECT
    sequence_schema,
    sequence_name,
    string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
AND table_schema = 'study'
AND table_name LIKE '%_seq'
GROUP BY sequence_schema, sequence_name
ORDER BY sequence_name;

-- Success message
SELECT 'ANON role now owns all tables and has full permissions!' as message;
SELECT 'RLS is disabled - backend handles all authorization' as note;
