-- Check if study_ tables exist

-- 1. Check in public schema
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'study_%'
ORDER BY tablename;

-- 2. Check if any study_ tables exist in any schema
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename LIKE 'study_%'
ORDER BY schemaname, tablename;

-- 3. Check what schemas exist
SELECT schema_name
FROM information_schema.schemata
ORDER BY schema_name;

-- 4. List all tables in public schema
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename
LIMIT 20;
