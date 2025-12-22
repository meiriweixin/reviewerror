# Guide: Expose Study Schema to Supabase API

## Problem

Supabase's PostgREST API by default only exposes these schemas:
- `public`
- `storage`
- `graphql_public`

When you try to access the `study` schema, you get:
```
The schema must be one of the following: public, storage, graphql_public
```

## Solution: Two Steps

### Step 1: Run SQL to Configure Permissions

Run **[expose_study_schema.sql](expose_study_schema.sql)** in Supabase SQL Editor:

1. Go to Supabase Dashboard → SQL Editor
2. Create New Query
3. Copy and paste the entire contents of `expose_study_schema.sql`
4. Click **Run**

This grants the necessary permissions to the `authenticated` role.

### Step 2: Update Supabase API Settings

You need to configure PostgREST to expose the `study` schema. There are two ways:

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Settings** → **API** in your Supabase dashboard
2. Scroll down to **Extra Schemas** or **Exposed Schemas**
3. Add `study` to the list of exposed schemas
4. Save changes
5. Wait ~30 seconds for the configuration to reload

**Note**: Not all Supabase plans have this UI. If you don't see this setting, use Option B.

#### Option B: Via SQL (If Dashboard Option Not Available)

Run this SQL to update the PostgREST configuration:

```sql
-- This requires superuser access
ALTER DATABASE postgres SET pgrst.db_schemas = 'public, storage, graphql_public, study';
```

**Important**: This requires superuser privileges. If you get a permission error, you'll need to:

1. Contact Supabase support to enable the `study` schema exposure
2. OR use Option C below (switch to public schema)

### Step 3: Create Tables in Study Schema

After exposing the schema, run **[add_missing_tables_simple.sql](add_missing_tables_simple.sql)** to create the tables:

1. Go to Supabase Dashboard → SQL Editor
2. Create New Query
3. Copy and paste the entire contents of `add_missing_tables_simple.sql`
4. Click **Run**

This creates:
- ✅ `study.users`
- ✅ `study.questions`
- ✅ `study.upload_history`
- ✅ Indexes, triggers, and permissions

### Step 4: Test Login

1. **Restart Backend** (if not auto-reloaded):
   ```bash
   cd backend
   python main.py
   ```

2. **Test Login in Regular Browser**:
   - Open http://localhost:3000
   - Click "Continue with Google"
   - Login should work! ✅

## Option C: Fallback - Use Public Schema Instead

If you cannot expose the `study` schema (due to Supabase plan limits or permissions), you can use the `public` schema instead.

**Advantages**:
- Works immediately, no configuration needed
- `public` schema is always exposed

**To switch to public schema**:

1. Run this SQL to create tables in `public` instead:

```sql
-- Change all "study." references to "public." in add_missing_tables_simple.sql
-- OR just run the tables without schema prefix (defaults to public)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    ...
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ...
);

CREATE TABLE IF NOT EXISTS upload_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ...
);
```

2. Update backend to remove schema reference:

Change `self.client.schema("study").table("users")`
To: `self.client.table("users")` (uses public by default)

## Troubleshooting

### Error: "schema must be one of the following"
- Run `expose_study_schema.sql` first
- Then configure Supabase to expose the study schema (Option A or B)
- Wait 30-60 seconds for PostgREST to reload

### Error: "permission denied for schema study"
- Make sure you ran `expose_study_schema.sql`
- Check that `authenticated` role has USAGE on study schema

### Error: "relation does not exist"
- Tables haven't been created yet
- Run `add_missing_tables_simple.sql` after exposing the schema

### PostgREST not exposing study schema
- Contact Supabase support
- OR switch to Option C (public schema)

## Verification

After completing all steps, verify in Supabase Dashboard:

1. **Table Editor** → Select `study` schema → Should see:
   - users
   - questions
   - upload_history
   - question_embeddings

2. **SQL Editor** → Run:
   ```sql
   SELECT * FROM study.users LIMIT 1;
   ```
   Should work without errors.

3. **Test API Access** → Try login in your app

---

**Current Status**: Backend code is already configured to use `schema("study").table("users")`. Just need to expose the schema and create the tables.
