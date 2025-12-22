-- Drop the study schema and all its tables
-- WARNING: This will delete all data in the study schema!

DROP SCHEMA IF EXISTS study CASCADE;

-- Verify it's gone
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'study';

-- Success message
SELECT 'Study schema dropped successfully!' as message;
SELECT 'All tables should now be recreated in public schema' as next_step;
