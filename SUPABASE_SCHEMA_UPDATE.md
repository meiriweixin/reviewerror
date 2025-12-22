# Supabase Schema Update - Using "study" Schema

## Summary

Updated the Supabase configuration to use a custom schema named **"study"** instead of the default "public" schema. This provides better organization and separation of concerns for the application's vector database.

## Changes Made

### 1. SUPABASE_SETUP.md Updated

All SQL commands now use the `study` schema:

- **Schema Creation**: Added `CREATE SCHEMA IF NOT EXISTS study;` with proper permissions
- **Extension**: `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA study;`
- **Table**: `CREATE TABLE study.question_embeddings (...)`
- **Indexes**: All indexes created on `study.question_embeddings`
- **Functions**:
  - `study.search_similar_questions(...)`
  - `study.get_question_count_by_subject(...)`
- **RLS Policies**: Applied to `study.question_embeddings`
- **Test Queries**: All reference `study.question_embeddings`

### 2. Backend Service Updated

**File**: `backend/app/services/supabase_service.py`

- Line 25: Changed `self.table_name = "study.question_embeddings"`
- Updated SQL reference documentation in comments

## Benefits of Using Custom Schema

1. **Organization**: Separates application tables from Supabase's built-in tables (auth, storage, etc.)
2. **Security**: Better permission management and isolation
3. **Clarity**: Makes it clear which tables belong to your application
4. **Migration**: Easier to migrate or backup specific application data
5. **Naming**: Avoids conflicts with Supabase reserved names or future features

## Setup Instructions

### For New Setup

Follow the updated [SUPABASE_SETUP.md](SUPABASE_SETUP.md) file which now includes:
1. Schema creation with proper permissions
2. pgvector extension in the study schema
3. All tables, indexes, and functions in the study schema

### For Existing Supabase Projects

If you already have data in the `public` schema, you can migrate:

```sql
-- Create the study schema
CREATE SCHEMA IF NOT EXISTS study;

-- Grant permissions
GRANT USAGE ON SCHEMA study TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA study TO postgres, service_role;

-- Move the table to study schema
ALTER TABLE public.question_embeddings SET SCHEMA study;

-- Move functions to study schema
ALTER FUNCTION public.search_similar_questions SET SCHEMA study;
ALTER FUNCTION public.get_question_count_by_subject SET SCHEMA study;
```

## No Backend Code Changes Required (if already configured)

The Supabase Python client handles schema-qualified table names automatically:
- `self.client.table("study.question_embeddings")` works seamlessly
- All queries, inserts, updates, and deletes will use the correct schema

## Configuration

No changes needed to environment variables. The schema is specified in the code:

```python
# backend/app/services/supabase_service.py
self.table_name = "study.question_embeddings"  # Uses study schema
```

## Testing

After setup, test with:

```sql
-- Verify schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'study';

-- Verify table exists in study schema
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'study' AND table_name = 'question_embeddings';

-- Test insert/select
INSERT INTO study.question_embeddings (user_id, question_id, question_text, subject, grade, embedding)
VALUES (999, 999, 'Test question', 'Test', 'test', array_fill(0.1, ARRAY[1536])::vector);

SELECT * FROM study.question_embeddings WHERE user_id = 999;

-- Clean up
DELETE FROM study.question_embeddings WHERE user_id = 999;
```

## Rollback (if needed)

To move back to public schema:

```sql
ALTER TABLE study.question_embeddings SET SCHEMA public;
ALTER FUNCTION study.search_similar_questions SET SCHEMA public;
ALTER FUNCTION study.get_question_count_by_subject SET SCHEMA public;
DROP SCHEMA study;
```

Then update `supabase_service.py`:
```python
self.table_name = "question_embeddings"  # Back to default public schema
```

---

**Status**: ✅ Configuration updated and ready for use
**Impact**: No breaking changes for new setups; existing setups need migration SQL
**Date**: 2025-11-08
