-- Test if PostgREST can access the study_users table

-- 1. Check table exists in PostgREST's view
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'study_users';

-- 2. Try to select from the table (this simulates what PostgREST does)
SET ROLE anon;
SELECT * FROM study_users LIMIT 1;
RESET ROLE;

-- 3. Check what roles anon has
SELECT
    r.rolname,
    r.rolsuper,
    r.rolinherit,
    r.rolcreaterole,
    r.rolcreatedb,
    r.rolcanlogin
FROM pg_roles r
WHERE r.rolname = 'anon';

-- 4. Check grants on study_users for anon
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'study_users'
AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY grantee, privilege_type;
