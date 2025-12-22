-- Expose the 'study' schema to Supabase PostgREST API
-- Simplified version - only uses postgres role

-- Step 1: Grant usage on the study schema
GRANT USAGE ON SCHEMA study TO postgres;
GRANT ALL ON SCHEMA study TO postgres;

-- Step 2: Grant permissions on all existing tables in study schema
GRANT ALL ON ALL TABLES IN SCHEMA study TO postgres;

-- Step 3: Grant permissions on all sequences (for auto-increment IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA study TO postgres;

-- Step 4: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA study GRANT ALL ON SEQUENCES TO postgres;

-- Step 5: Verify the schema exists and tables are accessible
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'study';

-- Step 6: List all tables in study schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'study'
ORDER BY table_name;

-- Success message
SELECT 'Study schema permissions configured successfully!' as message;
