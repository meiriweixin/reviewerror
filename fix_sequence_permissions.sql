-- Fix sequence permissions for study schema tables
-- This resolves "permission denied for sequence users_id_seq" errors

-- Grant permissions on all sequences in study schema to postgres
GRANT ALL ON ALL SEQUENCES IN SCHEMA study TO postgres;

-- Grant USAGE and SELECT on all sequences (needed for SERIAL columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA study TO postgres;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT USAGE, SELECT ON SEQUENCES TO postgres;

-- Verify sequences exist and have correct permissions
SELECT
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences
WHERE schemaname = 'study'
ORDER BY sequencename;

-- Success message
SELECT 'Sequence permissions fixed successfully!' as message;
