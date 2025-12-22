-- Fix table permissions for anon role
-- This grants direct permissions instead of relying on RLS bypass

-- Step 1: Ensure anon role has permissions on schema
GRANT USAGE ON SCHEMA study TO anon;
GRANT CREATE ON SCHEMA study TO anon;

-- Step 2: Grant ALL privileges on all tables to anon role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA study TO anon;

-- Step 3: Grant ALL privileges on all sequences to anon role
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA study TO anon;

-- Step 4: Grant specific permissions on each table explicitly
GRANT SELECT, INSERT, UPDATE, DELETE ON study.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON study.questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON study.upload_history TO anon;

-- Step 5: Grant specific permissions on each sequence explicitly
GRANT USAGE, SELECT, UPDATE ON study.users_id_seq TO anon;
GRANT USAGE, SELECT, UPDATE ON study.questions_id_seq TO anon;
GRANT USAGE, SELECT, UPDATE ON study.upload_history_id_seq TO anon;

-- Step 6: Set default privileges for future tables created by postgres
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA study
GRANT ALL ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA study
GRANT ALL ON SEQUENCES TO anon;

-- Step 7: Verify permissions
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
SELECT 'Table permissions granted to anon role!' as message;
