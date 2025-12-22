# Final Fix: Use Supabase API Key (No Database Roles Needed)

## The Problem

Your Supabase setup is **API-based**, not database-role-based. This means:
- ✅ You have `SUPABASE_KEY` (anon key for API access)
- ❌ You don't have database roles like `anon`, `authenticated`, `service_role`
- ❌ The backend was trying to use `SUPABASE_SERVICE_ROLE_KEY` which doesn't exist

## The Solution

Use the **Supabase API key** you already have, and disable RLS to avoid permission issues.

### Step 1: Run SQL to Disable RLS

**Run [disable_rls_simple.sql](disable_rls_simple.sql)** in Supabase SQL Editor

This will:
- Disable RLS on all tables
- Grant full permissions to `postgres` role
- Remove any restrictive policies

### Step 2: Add Service Role Key to .env

You need to get your **service role key** from Supabase dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **"service_role" "secret"** key (NOT the anon key)

Then add it to `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://mbtedlrrxchxbdltmjud.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Anon key (you already have this)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ADD THIS - service role key
```

### Step 3: Revert Backend Code to Use Service Role Key

I need to revert the changes I made. The backend should use `SUPABASE_SERVICE_ROLE_KEY`:

```python
# backend/app/services/supabase_db_service.py
self.client: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY  # Use service role key
)
```

Let me revert those changes for you.

### Step 4: Restart Backend

After adding the service role key:

```bash
cd backend
python main.py
```

### Step 5: Test Login

Open http://localhost:3000 and try logging in!

## Why This Works

1. **Service Role Key** = Full API access, bypasses all RLS
2. **RLS Disabled** = No database-level restrictions
3. **Postgres Role** = Has full permissions on all tables and sequences
4. **No Database Roles Needed** = Works with Supabase API-based setup

## Where to Find Service Role Key

**Supabase Dashboard**:
1. Go to your project: https://supabase.com/dashboard/project/mbtedlrrxchxbdltmjud
2. Settings → API
3. Look for **"Project API keys"** section
4. Find the key labeled **"service_role"** with a "secret" badge
5. Click **"Copy"** or **"Reveal"**

⚠️ **Important**: The service role key is SECRET - never commit it to git or expose it publicly!

## Summary

Your setup is:
- ✅ Supabase API-based (not direct database access)
- ✅ Need `SUPABASE_SERVICE_ROLE_KEY` for backend
- ✅ RLS disabled (backend handles all authorization)
- ✅ Simple and works with your current architecture
