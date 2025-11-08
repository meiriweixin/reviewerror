# Backend Setup Guide

Quick guide to get the backend running.

## Prerequisites

- Python 3.9+ installed
- Service accounts created (see below)

## Step 1: Install Dependencies

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Install packages
pip install -r requirements.txt
```

## Step 2: Create .env File

```bash
# Copy the template
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux
```

## Step 3: Configure Environment Variables

### 3.1 Generate SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it in `.env` as `SECRET_KEY`.

### 3.2 Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **"Google+ API"**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Application type: **Web application**
7. Add authorized JavaScript origins:
   - `http://localhost:3000`
8. Add authorized redirect URIs:
   - `http://localhost:3000`
9. Copy **Client ID** and **Client Secret**
10. Paste in `.env`:
   ```
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   ```

### 3.3 Get Azure OpenAI Credentials

**Don't have Azure account? See "Testing Without Services" below.**

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create **"Azure OpenAI"** resource
3. Deploy **GPT-4o** model:
   - Go to Azure OpenAI Studio
   - Deployments → Create
   - Model: GPT-4o
   - Name: gpt-4o (or your choice)
4. Get credentials:
   - Keys and Endpoint → Copy Key and Endpoint
5. Paste in `.env`:
   ```
   AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com/
   AZURE_OPENAI_API_KEY=xxx
   AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
   ```

### 3.4 Get Supabase Credentials

**Don't have Supabase? See "Testing Without Services" below.**

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to initialize
4. Go to **Settings** → **API**
5. Copy:
   - Project URL
   - anon public key
   - service_role key (keep this secret!)
6. Paste in `.env`:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_KEY=xxx-anon-key
   SUPABASE_SERVICE_ROLE_KEY=xxx-service-role-key
   ```
7. Run the SQL setup from `../SUPABASE_SETUP.md`

## Step 4: Run the Backend

```bash
# Make sure you're in backend/ directory
# Make sure virtual environment is activated

python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 5: Test the Backend

Open your browser:
- API Root: http://localhost:8000
- API Docs: http://localhost:8000/docs (interactive Swagger UI)
- Health Check: http://localhost:8000/health

## Testing Without Services

If you don't have Azure OpenAI or Supabase yet, you can:

### Option 1: Use Dummy Values (for initial testing)

```env
# .env - TEMPORARY dummy values
SECRET_KEY=generate-this-with-python-command-above

GOOGLE_CLIENT_ID=dummy-for-now
GOOGLE_CLIENT_SECRET=dummy-for-now

AZURE_OPENAI_ENDPOINT=https://dummy.openai.azure.com/
AZURE_OPENAI_API_KEY=dummy-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

SUPABASE_URL=https://dummy.supabase.co
SUPABASE_KEY=dummy-key
SUPABASE_SERVICE_ROLE_KEY=dummy-key

DATABASE_URL=sqlite+aiosqlite:///./student_review.db
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760
ALLOWED_ORIGINS=http://localhost:3000
```

**With dummy values:**
- ✅ Backend will start
- ✅ Database will work
- ❌ Google login won't work
- ❌ Image upload/analysis won't work
- ❌ Vector search won't work

### Option 2: Start with Google OAuth Only

Get Google OAuth working first (it's free!), then add others later:

1. Set up Google OAuth (free, takes 5 minutes)
2. Use dummy values for Azure/Supabase
3. Test login functionality
4. Add Azure OpenAI when ready to test image upload
5. Add Supabase when ready to test search

## Common Issues

### "Module not found"
```bash
# Make sure virtual environment is activated
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Reinstall dependencies
pip install -r requirements.txt
```

### "Validation error for Settings"
- Make sure `.env` file exists in `backend/` directory
- Make sure all required variables are set
- Check for typos in variable names

### "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### "Import errors"
```bash
# Make sure you're in backend/ directory
cd backend

# Check Python version
python --version  # Should be 3.9+

# Try with python3 instead
python3 main.py
```

## Environment Variables Summary

| Variable | Required? | Where to Get |
|----------|-----------|--------------|
| SECRET_KEY | ✅ Yes | Generate with Python |
| GOOGLE_CLIENT_ID | ✅ Yes | Google Cloud Console |
| GOOGLE_CLIENT_SECRET | ✅ Yes | Google Cloud Console |
| AZURE_OPENAI_ENDPOINT | ✅ Yes* | Azure Portal |
| AZURE_OPENAI_API_KEY | ✅ Yes* | Azure Portal |
| SUPABASE_URL | ✅ Yes* | Supabase Dashboard |
| SUPABASE_KEY | ✅ Yes* | Supabase Dashboard |
| SUPABASE_SERVICE_ROLE_KEY | ✅ Yes* | Supabase Dashboard |
| DATABASE_URL | ⚙️ Optional | Default: SQLite |
| UPLOAD_DIR | ⚙️ Optional | Default: uploads |
| ALLOWED_ORIGINS | ⚙️ Optional | Default: localhost |

*Required for full functionality, can use dummy values for initial testing

## Next Steps

1. ✅ Backend running
2. Configure frontend `.env.local`
3. Start frontend: `npm start`
4. Test the full application

## Getting Help

- Check [../README.md](../README.md) for full documentation
- See [../QUICK_REFERENCE.md](../QUICK_REFERENCE.md) for commands
- Review [../GETTING_STARTED.md](../GETTING_STARTED.md) for setup

---

**Backend running?** Great! Now start the frontend and you're ready to go! 🚀
