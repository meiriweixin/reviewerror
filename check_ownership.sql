-- Check current ownership and permissions

-- 1. Check table ownership
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'study'
ORDER BY tablename;

-- 2. Check sequence ownership
SELECT
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences
WHERE schemaname = 'study'
ORDER BY sequencename;

-- 3. Check what roles exist
SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'postgres', 'authenticator');

-- 4. Check permissions for anon on users table specifically
SELECT
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'study'
AND table_name = 'users'
AND grantee = 'anon';

-- 5. Check if there's an authenticator role that anon inherits from
SELECT
    r.rolname as role,
    m.rolname as member_of
FROM pg_roles r
LEFT JOIN pg_auth_members am ON r.oid = am.member
LEFT JOIN pg_roles m ON am.roleid = m.oid
WHERE r.rolname = 'anon';
