# Migration Plan: SQLite → Supabase PostgreSQL

## Overview

This document outlines the plan to migrate from dual storage (SQLite + Supabase pgvector) to a unified Supabase PostgreSQL database.

## Current Architecture

```
SQLite (Local File)
├── users
├── questions
└── upload_history

Supabase (Cloud)
└── study.question_embeddings (vector only)
```

## Proposed Architecture

```
Supabase PostgreSQL (Cloud)
└── study schema
    ├── users
    ├── questions
    ├── upload_history
    └── question_embeddings (with vector)
```

## Benefits

1. **Single Database**: Simplified architecture
2. **Production-Ready**: PostgreSQL handles concurrent users
3. **Cloud-Native**: No local database files to manage
4. **Better Transactions**: All data in one ACID-compliant database
5. **Advanced Features**: Full-text search, JSONB, materialized views
6. **Automatic Backups**: Supabase handles this
7. **Easier Deployment**: No database file to deploy

## Migration Steps

### Phase 1: Create PostgreSQL Schema (15 min)

#### 1.1 Create Tables in Supabase

```sql
-- Use the existing study schema
-- Create users table
CREATE TABLE IF NOT EXISTS study.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    grade VARCHAR(50),
    profile_picture VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS study.questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study.users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    grade VARCHAR(50),
    question_text TEXT NOT NULL,
    image_url VARCHAR(500),
    image_snippet_url VARCHAR(500),
    explanation TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'understood')),
    vector_id UUID,  -- Reference to question_embeddings.id
    question_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upload_history table
CREATE TABLE IF NOT EXISTS study.upload_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES study.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    subject VARCHAR(100),
    questions_extracted INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key from question_embeddings to questions
ALTER TABLE study.question_embeddings
ADD CONSTRAINT fk_questions
FOREIGN KEY (question_id) REFERENCES study.questions(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_users_email ON study.users(email);
CREATE INDEX idx_users_google_id ON study.users(google_id);
CREATE INDEX idx_questions_user_id ON study.questions(user_id);
CREATE INDEX idx_questions_subject ON study.questions(subject);
CREATE INDEX idx_questions_grade ON study.questions(grade);
CREATE INDEX idx_questions_status ON study.questions(status);
CREATE INDEX idx_questions_created_at ON study.questions(created_at);
CREATE INDEX idx_upload_history_user_id ON study.upload_history(user_id);
CREATE INDEX idx_upload_history_created_at ON study.upload_history(created_at);
```

#### 1.2 Enable RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE study.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study.upload_history ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
ON study.users FOR SELECT
USING (true);  -- We handle auth in application layer

CREATE POLICY "Users can update their own profile"
ON study.users FOR UPDATE
USING (true);

-- Questions table policies
CREATE POLICY "Users can view their own questions"
ON study.questions FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own questions"
ON study.questions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own questions"
ON study.questions FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own questions"
ON study.questions FOR DELETE
USING (true);

-- Upload history policies
CREATE POLICY "Users can view their own upload history"
ON study.upload_history FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own upload history"
ON study.upload_history FOR INSERT
WITH CHECK (true);
```

### Phase 2: Update Backend Code (30 min)

#### 2.1 Update Database Configuration

**File**: `backend/app/database.py`

Change from:
```python
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./student_review.db"
```

To:
```python
from app.config import settings

# Use Supabase PostgreSQL
SQLALCHEMY_DATABASE_URL = f"postgresql+asyncpg://{settings.SUPABASE_DB_USER}:{settings.SUPABASE_DB_PASSWORD}@{settings.SUPABASE_DB_HOST}:{settings.SUPABASE_DB_PORT}/{settings.SUPABASE_DB_NAME}"
```

#### 2.2 Update Environment Variables

**File**: `backend/.env`

Add:
```env
# Supabase PostgreSQL Connection
SUPABASE_DB_HOST=db.mbtedlrrxchxbdltmjud.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-database-password-from-project-settings
```

#### 2.3 Update Dependencies

**File**: `backend/requirements.txt`

Add:
```
asyncpg==0.29.0  # PostgreSQL async driver
```

Remove:
```
aiosqlite==0.19.0  # No longer needed
```

#### 2.4 Update Models

**File**: `backend/app/models.py`

Change:
```python
from app.database import Base

# Add schema to all tables
class User(Base):
    __tablename__ = "users"
    __table_args__ = {'schema': 'study'}
    # ... rest of model

class Question(Base):
    __tablename__ = "questions"
    __table_args__ = {'schema': 'study'}
    # ... rest of model

class UploadHistory(Base):
    __tablename__ = "upload_history"
    __table_args__ = {'schema': 'study'}
    # ... rest of model
```

### Phase 3: Data Migration (10 min)

#### 3.1 Export from SQLite

```python
# migration_script.py
import sqlite3
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.app.models import User, Question, UploadHistory

async def migrate_data():
    # Connect to SQLite
    sqlite_conn = sqlite3.connect('backend/student_review.db')
    sqlite_cursor = sqlite_conn.cursor()

    # Connect to PostgreSQL
    pg_engine = create_async_engine("postgresql+asyncpg://...")
    async_session = sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Migrate users
        sqlite_cursor.execute("SELECT * FROM users")
        for row in sqlite_cursor.fetchall():
            user = User(id=row[0], email=row[1], ...)
            session.add(user)

        # Migrate questions
        # Migrate upload_history

        await session.commit()

# Run migration
asyncio.run(migrate_data())
```

### Phase 4: Testing (15 min)

1. Test authentication
2. Test question upload
3. Test question retrieval
4. Test vector search
5. Test all CRUD operations

### Phase 5: Cleanup (5 min)

1. Remove SQLite database file
2. Remove aiosqlite from requirements
3. Update documentation

## Rollback Plan

If migration fails:
1. Keep SQLite database file as backup
2. Revert backend/.env to SQLite connection
3. Restart backend

## Estimated Total Time: ~1.5 hours

## Cost Implications

**Supabase Free Tier Limits:**
- Database: 500MB (plenty for this app)
- Bandwidth: 2GB/month
- API requests: Unlimited
- Storage: 1GB (for images)

**When to Upgrade ($25/month):**
- Database > 500MB
- Bandwidth > 2GB/month
- Need more than 1GB storage
- Want Point-in-Time Recovery

## Alternative: Hybrid Approach (Keep SQLite for Development)

```python
# backend/app/database.py
import os

if os.getenv("ENV") == "production":
    # Use PostgreSQL in production
    DATABASE_URL = f"postgresql+asyncpg://..."
else:
    # Use SQLite in development
    DATABASE_URL = "sqlite+aiosqlite:///./student_review.db"
```

This gives you:
- ✅ Fast local development (no internet needed)
- ✅ Production uses PostgreSQL
- ❌ Need to maintain both code paths
- ❌ Dev/prod environment differences

## Recommendation

**Full Migration** is better because:
1. Simpler codebase (one database path)
2. Dev environment matches production
3. Supabase local development is available
4. You're already committing to Supabase

## Next Steps

Would you like me to:
1. ✅ Create the PostgreSQL tables in Supabase
2. ✅ Update the backend code
3. ✅ Write the migration script
4. ✅ Test the migration

Let me know and I'll execute the migration!
