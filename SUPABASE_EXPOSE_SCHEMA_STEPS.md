# How to Expose the Study Schema in Supabase

## The Problem

Supabase's PostgREST API by default only exposes: `public`, `storage`, `graphql_public`

Your backend is trying to access `study` schema, which results in:
```
The schema must be one of the following: public, storage, graphql_public
```

## The Solution: Configure PostgREST

You need to tell Supabase's PostgREST to expose the `study` schema. Here are the methods:

---

## Method 1: Supabase Dashboard (Easiest - If Available)

### Step 1: Find the Setting

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to find one of these settings:
   - **"Exposed schemas"**
   - **"Extra schemas"**
   - **"DB schemas"**

### Step 2: Add the Study Schema

In the field, add `study` to the list:
```
public,storage,graphql_public,study
```

Or if it's a multi-line field, add:
```
study
```

### Step 3: Save and Reload

- Click **Save**
- Wait 30-60 seconds for PostgREST to reload the configuration
- Your API should now expose the `study` schema

**Note**: This setting might not be available on all Supabase plans or versions. If you don't see it, try Method 2.

---

## Method 2: Via Supabase CLI or Project Config

If you're using Supabase CLI or have access to project configuration:

### Using Supabase CLI

1. Install Supabase CLI if not already:
   ```bash
   npm install -g supabase
   ```

2. Login and link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. Update `supabase/config.toml`:
   ```toml
   [api]
   schemas = ["public", "storage", "graphql_public", "study"]
   ```

4. Push the configuration:
   ```bash
   supabase db push
   ```

---

## Method 3: Contact Supabase Support

If the above methods don't work:

1. Go to Supabase Dashboard → **Support**
2. Ask them to expose the `study` schema for your project
3. Provide your project reference ID

---

## Method 4: Alternative - Use Public Schema (Quickest Workaround)

If you can't expose `study` schema, **use `public` schema instead**:

### Step 1: Create Tables in Public Schema

Run this modified SQL (changes `study.` to `public.`):

```sql
-- ================== USERS TABLE ==================

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    grade VARCHAR(50),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);

-- ================== QUESTIONS TABLE ==================

CREATE TABLE IF NOT EXISTS public.questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(50),
    question_text TEXT NOT NULL,
    image_url VARCHAR(500),
    image_snippet_url VARCHAR(500),
    explanation TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    vector_id UUID,
    question_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_grade ON public.questions(grade);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at);

-- ================== UPLOAD HISTORY TABLE ==================

CREATE TABLE IF NOT EXISTS public.upload_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    subject VARCHAR(100),
    questions_extracted INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_history_user_id ON public.upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON public.upload_history(created_at);
```

### Step 2: Update Backend Code

Change backend to use public schema (which is the default):

In `backend/app/services/supabase_db_service.py`, change:
```python
# FROM:
result = self.client.schema("study").table("users").insert(data).execute()

# TO:
result = self.client.table("users").insert(data).execute()
```

This uses `public` schema by default (no need to specify).

I can make this change for you if you want to use the public schema approach.

---

## Recommended Approach

Try in this order:

1. ✅ **Method 1** - Check Supabase Dashboard for "Exposed schemas" setting (fastest if available)
2. ⚠️ **Method 4** - Use `public` schema instead (guaranteed to work, simplest)
3. 📧 **Method 3** - Contact Supabase support (if you specifically need custom schema)
4. 🔧 **Method 2** - Use Supabase CLI (if you're using local development)

---

## My Recommendation: Use Public Schema (Method 4)

Unless you have a specific reason to use a custom `study` schema, I recommend **Method 4 (public schema)** because:

- ✅ Works immediately, no configuration needed
- ✅ No permission or role issues
- ✅ Standard Supabase approach
- ✅ `public` schema is always exposed by PostgREST

The only downside is organizational - all tables are in `public` instead of a custom `study` schema. But functionally, it's identical.

---

## What Would You Like to Do?

**Option A**: Try to expose `study` schema (might require Supabase support)

**Option B**: Switch to `public` schema (I can update the backend code and SQL for you right now)

Let me know which approach you prefer!
