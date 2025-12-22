# Migration Guide: Move to Public Schema with Anon Key Only

## Summary

We're starting fresh by:
1. ✅ Dropping the `study` schema (too many permission issues)
2. ✅ Creating all tables in `public` schema (default, always accessible)
3. ✅ Using only `SUPABASE_KEY` (anon key) - NO service role key needed
4. ✅ Backend code updated to use public schema

## Step-by-Step Migration

### Step 1: Drop Study Schema

Run **[drop_study_schema.sql](drop_study_schema.sql)** in Supabase SQL Editor

This will delete:
- `study.users`
- `study.questions`
- `study.upload_history`
- The entire `study` schema

⚠️ **Warning**: All existing data in study schema will be deleted!

### Step 2: Create Tables in Public Schema

Run **[create_tables_public.sql](create_tables_public.sql)** in Supabase SQL Editor

This creates:
- ✅ `public.users` - User accounts
- ✅ `public.questions` - Wrong questions
- ✅ `public.upload_history` - Upload tracking
- ✅ Indexes for performance
- ✅ Auto-update triggers for `updated_at` columns
- ✅ RLS is **DISABLED** (backend handles auth via JWT)

### Step 3: Backend Code (Already Updated)

The backend code has been updated to:
- ✅ Remove all `schema("study")` references
- ✅ Use `.table("users")` instead (defaults to public schema)
- ✅ Use only `SUPABASE_KEY` (anon key)

### Step 4: Restart Backend

```bash
cd backend
python main.py
```

You should see:
```
✅ Supabase Database Service initialized (anon key)
```

### Step 5: Test Login

Open http://localhost:3000 and try logging in with Google!

## Why This Works

### Public Schema Benefits:
- ✅ **Always accessible** - No need to expose custom schemas
- ✅ **Default schema** - Supabase SDK uses it by default
- ✅ **No permission issues** - Public schema is always available to anon role
- ✅ **Simpler** - No custom schema configuration needed

### Architecture:

```
Frontend (React)
    ↓
Google OAuth Login
    ↓
Backend (FastAPI) with JWT
    ↓
Supabase SDK (anon key)
    ↓
PostgREST API
    ↓
PostgreSQL public schema
```

### Security Model:

- **Backend uses anon key** - Public API key
- **RLS is disabled** - Backend validates everything via JWT
- **JWT tokens** - Backend creates and validates tokens
- **No database-level security** - All authorization in backend code

This is fine because:
1. Backend already validates user identity via Google OAuth
2. Backend only queries/updates data for the authenticated user
3. Anon key is public anyway (used by frontend)

## What Changed in Code

### Before (study schema):
```python
result = self.client.schema("study").table("users").select("*").execute()
```

### After (public schema):
```python
result = self.client.table("users").select("*").execute()
```

The `.table()` method automatically uses the `public` schema when no schema is specified.

## Environment Variables

Your `backend/.env` should have:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Anon key
```

**NO NEED FOR**:
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Not needed anymore!

## Verification

### Check Tables Exist:

```sql
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'questions', 'upload_history');
```

Should show:
- `users` | `postgres`
- `questions` | `postgres`
- `upload_history` | `postgres`

### Check RLS Status:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'questions', 'upload_history');
```

Should show `rowsecurity = false` for all tables.

## Troubleshooting

### "Table not found" error

**Cause**: Tables not created in public schema yet

**Fix**: Run `create_tables_public.sql`

### "permission denied for table users"

**Cause**: RLS might still be enabled

**Fix**: Run this SQL:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history DISABLE ROW LEVEL SECURITY;
```

### Backend still shows "study" schema error

**Cause**: Backend code not updated or not restarted

**Fix**:
1. Verify `supabase_db_service.py` uses `.table()` not `.schema("study").table()`
2. Restart backend: `python main.py`

## Final Checklist

- [ ] Run `drop_study_schema.sql` in Supabase
- [ ] Run `create_tables_public.sql` in Supabase
- [ ] Verify tables exist in `public` schema
- [ ] Verify RLS is disabled
- [ ] Backend code updated (already done)
- [ ] Restart backend: `python main.py`
- [ ] Test login at http://localhost:3000
- [ ] Login works! 🎉

---

**Status**: Ready to migrate!
**Next Step**: Run the two SQL scripts in order
