-- Grant permissions on study_ tables to anon role
-- This allows PostgREST API (using anon key) to access the tables

-- Grant permissions on public schema to anon
GRANT USAGE ON SCHEMA public TO anon;

-- Grant ALL privileges on the study_ tables to anon
GRANT ALL ON study_users TO anon;
GRANT ALL ON study_questions TO anon;
GRANT ALL ON study_upload_history TO anon;

-- Grant permissions on sequences (for INSERT operations)
GRANT ALL ON study_users_id_seq TO anon;
GRANT ALL ON study_questions_id_seq TO anon;
GRANT ALL ON study_upload_history_id_seq TO anon;

-- Verify permissions were granted
SELECT
    grantee,
    table_name,
    string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name LIKE 'study_%'
AND grantee = 'anon'
GROUP BY grantee, table_name
ORDER BY table_name;

-- Success message
SELECT 'Permissions granted to anon role!' as message;
