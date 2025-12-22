# 🚀 PostgreSQL Migration Instructions

## ✅ What's Been Done:

1. ✅ Created SQL migration script (`supabase_migration.sql`)
2. ✅ Updated `requirements.txt` (added asyncpg, removed aiosqlite)
3. ✅ Updated models to use `study` schema
4. ✅ Updated `.env` with PostgreSQL connection string

## 📋 What YOU Need to Do:

### Step 1: Run SQL in Supabase (5 minutes)

1. Open your Supabase project: https://supabase.com/dashboard/project/mbtedlrrxchxbdltmjud
2. Click **SQL Editor** in left sidebar
3. Click **New query**
4. Open the file `supabase_migration.sql` in this directory
5. Copy ALL the SQL and paste into Supabase SQL Editor
6. Click **Run** (or Ctrl+Enter)
7. You should see "Success" and verification tables listed

### Step 2: Get Your Database Password

1. In Supabase, go to **Settings** → **Database**
2. Look for **Database Password** section
3. If you don't remember it, you'll need to reset it:
   - Click "Reset database password"
   - Copy the new password (you won't see it again!)

### Step 3: Update `.env` with Password

Open `backend/.env` and replace on line 23:

```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_ACTUAL_PASSWORD_HERE@db.mbtedlrrxchxbdltmjud.supabase.co:5432/postgres
```

Replace `YOUR_ACTUAL_PASSWORD_HERE` with your real database password.

### Step 4: Install New Dependencies

```bash
cd backend
pip install asyncpg==0.29.0
```

Or reinstall all:
```bash
pip install -r requirements.txt
```

### Step 5: Restart Backend

```bash
# Stop current backend (Ctrl+C or kill process)
cd backend
python main.py
```

You should see:
- No more "WARNING: Supabase not configured"
- SQLAlchemy connecting to PostgreSQL
- No errors about tables

### Step 6: Test the Application

1. Open http://localhost:3000
2. Log in with Google
3. Try uploading a question
4. Check if everything works!

### Step 7: Verify in Supabase

1. Go to Supabase → **Table Editor**
2. Select `study` schema from dropdown
3. You should see tables:
   - users
   - questions
   - upload_history
   - question_embeddings

## 🔄 Optional: Migrate Existing SQLite Data

If you have existing data in `student_review.db`, run this script:

```python
# migrate_data.py
import sqlite3
import asyncio
import asyncpg

async def migrate():
    # Connect to SQLite
    sqlite_conn = sqlite3.connect('backend/student_review.db')
    cursor = sqlite_conn.cursor()

    # Connect to PostgreSQL
    pg_conn = await asyncpg.connect(
        'postgresql://postgres:YOUR_PASSWORD@db.mbtedlrrxchxbdltmjud.supabase.co:5432/postgres'
    )

    try:
        # Migrate users
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        for user in users:
            await pg_conn.execute("""
                INSERT INTO study.users (id, email, name, google_id, grade, profile_picture, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (email) DO NOTHING
            """, user[0], user[1], user[2], user[3], user[4], user[5], user[6], user[7])

        print(f"Migrated {len(users)} users")

        # Migrate questions
        cursor.execute("SELECT * FROM questions")
        questions = cursor.fetchall()
        for q in questions:
            await pg_conn.execute("""
                INSERT INTO study.questions
                (id, user_id, subject, grade, question_text, image_url, image_snippet_url,
                 explanation, status, vector_id, question_metadata, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO NOTHING
            """, q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9], q[10], q[11], q[12])

        print(f"Migrated {len(questions)} questions")

        # Migrate upload_history
        cursor.execute("SELECT * FROM upload_history")
        uploads = cursor.fetchall()
        for upload in uploads:
            await pg_conn.execute("""
                INSERT INTO study.upload_history
                (id, user_id, filename, subject, questions_extracted, status, error_message, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (id) DO NOTHING
            """, upload[0], upload[1], upload[2], upload[3], upload[4], upload[5], upload[6], upload[7])

        print(f"Migrated {len(uploads)} upload history records")

    finally:
        await pg_conn.close()
        sqlite_conn.close()

# Run migration
asyncio.run(migrate())
```

Run with:
```bash
python migrate_data.py
```

## ⚠️ Troubleshooting

### Error: "relation 'users' does not exist"
- You forgot to run the SQL migration in Supabase
- Go back to Step 1

### Error: "password authentication failed"
- Wrong password in `.env`
- Go to Supabase Settings → Database and reset password

### Error: "asyncpg not found"
- Run: `pip install asyncpg==0.29.0`

### Error: "could not connect to server"
- Check your internet connection
- Verify Supabase project is not paused

### Backend starts but crashes on first request
- Check that all tables exist in `study` schema
- Run verification queries in Supabase SQL Editor

## 📊 Before/After Comparison

### Before:
```
SQLite (local file) + Supabase (vectors only)
```

### After:
```
Supabase PostgreSQL (everything in cloud)
```

## 🎉 Benefits You'll Get:

1. ✅ Production-ready database
2. ✅ Automatic backups
3. ✅ Better concurrent user handling
4. ✅ No local database files to manage
5. ✅ Simpler architecture
6. ✅ Easy to scale

## 📝 Next Steps After Migration:

1. Test all features thoroughly
2. Delete `student_review.db` file (backup first!)
3. Remove `aiosqlite` from any imports
4. Update documentation
5. Deploy to production!

---

**Need Help?** Check the logs and let me know what error you see!
