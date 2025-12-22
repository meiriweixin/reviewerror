-- Diagnostic script to check permissions and RLS status

-- 1. Check if roles exist
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'postgres', 'authenticator')
ORDER BY rolname;

-- 2. Check table ownership
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- 3. Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- 4. Check table permissions for anon role
SELECT
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
AND table_schema = 'study'
ORDER BY table_name, privilege_type;

-- 5. Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'study'
ORDER BY tablename, policyname;

-- 6. Check sequence permissions for anon role
SELECT
    table_schema,
    table_name as sequence_name,
    privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
AND table_schema = 'study'
AND table_name LIKE '%_seq'
ORDER BY table_name, privilege_type;

-- 7. Check schema permissions
SELECT
    nspname as schema_name,
    pg_get_userbyid(nspowner) as owner
FROM pg_namespace
WHERE nspname = 'study';

SELECT 'Diagnostic complete!' as status;
