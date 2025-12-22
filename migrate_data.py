#!/usr/bin/env python3
"""
Data Migration Script: SQLite → PostgreSQL (Supabase)
Migrates users, questions, and upload_history from local SQLite to Supabase PostgreSQL
"""

import sqlite3
import asyncio
import asyncpg
import os
from datetime import datetime

# Configuration
SQLITE_DB_PATH = 'backend/student_review.db'
POSTGRES_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:YOUR_PASSWORD@db.mbtedlrrxchxbdltmjud.supabase.co:5432/postgres')

# Remove the asyncpg prefix if present
if POSTGRES_URL.startswith('postgresql+asyncpg://'):
    POSTGRES_URL = POSTGRES_URL.replace('postgresql+asyncpg://', 'postgresql://')

async def migrate():
    """Main migration function"""

    # Check if SQLite database exists
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"❌ SQLite database not found at: {SQLITE_DB_PATH}")
        print("No data to migrate. Skipping migration.")
        return

    # Connect to SQLite
    print("📂 Connecting to SQLite database...")
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row  # Enable column access by name
    cursor = sqlite_conn.cursor()

    # Connect to PostgreSQL
    print("🔗 Connecting to PostgreSQL (Supabase)...")
    try:
        pg_conn = await asyncpg.connect(POSTGRES_URL)
        print("✅ Connected to Supabase PostgreSQL!")
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        print("Please check your DATABASE_URL in .env file")
        sqlite_conn.close()
        return

    try:
        # Migrate users
        print("\n👥 Migrating users...")
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()

        users_migrated = 0
        for user in users:
            try:
                await pg_conn.execute("""
                    INSERT INTO study.users (id, email, name, google_id, grade, profile_picture, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (email) DO UPDATE SET
                        name = EXCLUDED.name,
                        google_id = EXCLUDED.google_id,
                        grade = EXCLUDED.grade,
                        profile_picture = EXCLUDED.profile_picture,
                        updated_at = EXCLUDED.updated_at
                """, user['id'], user['email'], user['name'], user['google_id'],
                     user['grade'], user['profile_picture'], user['created_at'], user['updated_at'])
                users_migrated += 1
            except Exception as e:
                print(f"  ⚠️  Failed to migrate user {user['email']}: {e}")

        print(f"✅ Migrated {users_migrated}/{len(users)} users")

        # Update user ID sequence
        if users_migrated > 0:
            max_id = await pg_conn.fetchval("SELECT MAX(id) FROM study.users")
            if max_id:
                await pg_conn.execute(f"SELECT setval('study.users_id_seq', {max_id}, true)")
                print(f"  📌 Set users ID sequence to {max_id}")

        # Migrate questions
        print("\n❓ Migrating questions...")
        cursor.execute("SELECT * FROM questions")
        questions = cursor.fetchall()

        questions_migrated = 0
        for q in questions:
            try:
                await pg_conn.execute("""
                    INSERT INTO study.questions
                    (id, user_id, subject, grade, question_text, image_url, image_snippet_url,
                     explanation, status, vector_id, question_metadata, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
                    ON CONFLICT (id) DO UPDATE SET
                        subject = EXCLUDED.subject,
                        grade = EXCLUDED.grade,
                        question_text = EXCLUDED.question_text,
                        image_url = EXCLUDED.image_url,
                        image_snippet_url = EXCLUDED.image_snippet_url,
                        explanation = EXCLUDED.explanation,
                        status = EXCLUDED.status,
                        vector_id = EXCLUDED.vector_id,
                        question_metadata = EXCLUDED.question_metadata,
                        updated_at = EXCLUDED.updated_at
                """, q['id'], q['user_id'], q['subject'], q['grade'], q['question_text'],
                     q['image_url'], q['image_snippet_url'], q['explanation'], q['status'],
                     q['vector_id'], q['question_metadata'] or '{}', q['created_at'], q['updated_at'])
                questions_migrated += 1
            except Exception as e:
                print(f"  ⚠️  Failed to migrate question {q['id']}: {e}")

        print(f"✅ Migrated {questions_migrated}/{len(questions)} questions")

        # Update questions ID sequence
        if questions_migrated > 0:
            max_id = await pg_conn.fetchval("SELECT MAX(id) FROM study.questions")
            if max_id:
                await pg_conn.execute(f"SELECT setval('study.questions_id_seq', {max_id}, true)")
                print(f"  📌 Set questions ID sequence to {max_id}")

        # Migrate upload_history
        print("\n📤 Migrating upload history...")
        cursor.execute("SELECT * FROM upload_history")
        uploads = cursor.fetchall()

        uploads_migrated = 0
        for upload in uploads:
            try:
                await pg_conn.execute("""
                    INSERT INTO study.upload_history
                    (id, user_id, filename, subject, questions_extracted, status, error_message, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (id) DO UPDATE SET
                        filename = EXCLUDED.filename,
                        subject = EXCLUDED.subject,
                        questions_extracted = EXCLUDED.questions_extracted,
                        status = EXCLUDED.status,
                        error_message = EXCLUDED.error_message
                """, upload['id'], upload['user_id'], upload['filename'], upload['subject'],
                     upload['questions_extracted'], upload['status'], upload['error_message'], upload['created_at'])
                uploads_migrated += 1
            except Exception as e:
                print(f"  ⚠️  Failed to migrate upload {upload['id']}: {e}")

        print(f"✅ Migrated {uploads_migrated}/{len(uploads)} upload history records")

        # Update upload_history ID sequence
        if uploads_migrated > 0:
            max_id = await pg_conn.fetchval("SELECT MAX(id) FROM study.upload_history")
            if max_id:
                await pg_conn.execute(f"SELECT setval('study.upload_history_id_seq', {max_id}, true)")
                print(f"  📌 Set upload_history ID sequence to {max_id}")

        # Summary
        print("\n" + "="*50)
        print("🎉 MIGRATION COMPLETE!")
        print("="*50)
        print(f"Users:         {users_migrated}/{len(users)}")
        print(f"Questions:     {questions_migrated}/{len(questions)}")
        print(f"Upload History: {uploads_migrated}/{len(uploads)}")
        print("="*50)

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()

    finally:
        # Close connections
        await pg_conn.close()
        sqlite_conn.close()
        print("\n🔒 Database connections closed")

if __name__ == "__main__":
    print("="*50)
    print("SQLite → PostgreSQL Migration Tool")
    print("="*50)
    print(f"Source: {SQLITE_DB_PATH}")
    print(f"Target: Supabase PostgreSQL")
    print("="*50)
    print()

    # Run migration
    asyncio.run(migrate())

    print("\n✨ Migration script finished!")
