# Quick Reference Guide

Quick commands and tips for working with the Student Review App.

## Quick Setup

```bash
# Automated setup (recommended)
chmod +x setup.sh
./setup.sh

# Manual setup
npm install
cd backend && python -m venv venv && pip install -r requirements.txt
```

## Running the App

### Development Mode

**Option 1: Automated (both servers)**
```bash
# macOS/Linux
chmod +x start-dev.sh
./start-dev.sh

# Windows
start-dev.bat
```

**Option 2: Manual (separate terminals)**

Terminal 1 - Frontend:
```bash
npm start
```

Terminal 2 - Backend:
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

### Production Mode

Frontend:
```bash
npm run build
npx serve -s build
```

Backend:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Common Commands

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test

# Check for outdated packages
npm outdated

# Update packages
npm update
```

### Backend

```bash
# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py

# Run with auto-reload
uvicorn main:app --reload

# Generate requirements
pip freeze > requirements.txt

# Check for security issues
pip-audit
```

## Environment Variables

### Required Frontend Variables
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=xxx
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxx
```

### Required Backend Variables
```env
SECRET_KEY=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
AZURE_OPENAI_ENDPOINT=xxx
AZURE_OPENAI_API_KEY=xxx
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

## Database

### SQLite Commands

```bash
# Open database
sqlite3 backend/student_review.db

# List tables
.tables

# Show schema
.schema

# Query users
SELECT * FROM users;

# Query questions
SELECT id, subject, status, created_at FROM questions;

# Backup database
.backup backup.db

# Export to CSV
.mode csv
.output questions.csv
SELECT * FROM questions;
.output stdout

# Exit
.quit
```

### Reset Database

```bash
# Stop the backend server first!
cd backend
rm student_review.db
python main.py  # Will recreate tables
```

## Supabase

### Connect to Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref
```

### Common Queries

```sql
-- Count embeddings
SELECT COUNT(*) FROM question_embeddings;

-- View recent questions
SELECT
    question_text,
    subject,
    created_at
FROM question_embeddings
ORDER BY created_at DESC
LIMIT 10;

-- Delete all data for a user
DELETE FROM question_embeddings WHERE user_id = 1;

-- Vacuum database
VACUUM;
```

## Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Get user info (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/auth/me

# Upload image
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test-image.jpg" \
  -F "subject=Mathematics" \
  -F "grade=sec1" \
  http://localhost:8000/questions/upload

# Get questions
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/questions/wrong
```

## Troubleshooting

### Port Already in Use

Frontend (port 3000):
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Backend (port 8000):
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Clear Node Modules

```bash
rm -rf node_modules package-lock.json
npm install
```

### Reset Python Virtual Environment

```bash
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### CORS Issues

Add frontend URL to `backend/.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Google OAuth Not Working

1. Check credentials are correct
2. Verify authorized origins include your domain
3. Clear browser cookies
4. Check Google Cloud Console for errors

### Azure OpenAI Rate Limits

Wait and retry, or:
1. Request quota increase
2. Implement exponential backoff
3. Add request queuing

## Git Commands

```bash
# Initial setup
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <url>
git push -u origin main

# Daily workflow
git pull
git add .
git commit -m "Description of changes"
git push

# Create feature branch
git checkout -b feature/feature-name
git push -u origin feature/feature-name

# Merge to main
git checkout main
git merge feature/feature-name
git push
```

## Performance Tips

### Frontend Optimization

```bash
# Analyze bundle size
npm run build
npx source-map-explorer build/static/js/*.js

# Check for duplicate dependencies
npx npm-dedupe
```

### Backend Optimization

```python
# Add to main.py for connection pooling
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40
)
```

## Monitoring

### Check Logs

Frontend:
```bash
# Browser console (F12)
# Network tab for API calls
```

Backend:
```bash
# Terminal output
# Add logging:
import logging
logging.basicConfig(level=logging.INFO)
```

### Monitor API Usage

Azure OpenAI:
- Check Azure Portal → Your Resource → Metrics

Supabase:
- Check Supabase Dashboard → Settings → Usage

Google OAuth:
- Check Google Cloud Console → APIs & Services → Credentials

## Useful Links

- [React Docs](https://react.dev/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Azure OpenAI Docs](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)

## Support

- GitHub Issues: Create an issue for bugs
- Documentation: Check README.md and other .md files
- Community: Join our Discord (if applicable)

## Tips

1. **Always activate virtual environment** before running backend
2. **Keep dependencies updated** regularly
3. **Backup database** before major changes
4. **Test locally** before deploying
5. **Check logs** when debugging
6. **Use environment variables** for sensitive data
7. **Follow git best practices** for version control
8. **Monitor API quotas** to avoid service disruption

---

Keep this guide handy for quick reference! 📚
