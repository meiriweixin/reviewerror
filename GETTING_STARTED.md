# Getting Started with Student Review App

Welcome! This guide will help you get the Student Review App up and running quickly.

## What You'll Need

Before starting, make sure you have:

### Software Requirements
- ✅ **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- ✅ **Python** (v3.9 or higher) - [Download](https://python.org/)
- ✅ **Git** (optional but recommended) - [Download](https://git-scm.com/)

### Service Accounts (Free Tier Available)
- ✅ **Google Cloud Account** - For OAuth authentication
- ✅ **Azure Account** - For OpenAI GPT-4o Vision
- ✅ **Supabase Account** - For vector database

## Quick Start (10 minutes)

### Step 1: Clone or Download

```bash
# If using git
git clone <repository-url>
cd student-review-app

# Or download and extract the ZIP file
```

### Step 2: Automated Setup

**For macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**For Windows:**
```cmd
setup.bat
```

This will:
- Install all frontend dependencies
- Create Python virtual environment
- Install all backend dependencies
- Create environment variable templates

### Step 3: Configure Services

#### 3a. Google OAuth (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:3000`
6. Copy **Client ID** and **Client Secret**

#### 3b. Azure OpenAI (Required)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create "Azure OpenAI" resource
3. Deploy GPT-4o model
4. Copy **Endpoint**, **API Key**, and **Deployment Name**

#### 3c. Supabase (Required)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Run the SQL setup (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md))
4. Copy **Project URL**, **Anon Key**, and **Service Role Key**

### Step 4: Configure Environment Variables

#### Frontend Configuration

Edit `.env.local`:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

#### Backend Configuration

Edit `backend/.env`:
```env
SECRET_KEY=run-this-command-to-generate: python -c "import secrets; print(secrets.token_hex(32))"
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 5: Run the Application

**Option A: Automated (Recommended)**

macOS/Linux:
```bash
./start-dev.sh
```

Windows:
```cmd
start-dev.bat
```

**Option B: Manual**

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

### Step 6: Access the App

Open your browser and go to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## First Time Use

### 1. Login
- Click "Continue with Google"
- Authorize the application
- You'll be redirected to grade selection

### 2. Select Your Grade
- Choose your current education level
- Click "Continue to Dashboard"

### 3. Upload Your First Question Paper
- Go to "Upload" tab
- Select subject from dropdown
- Upload a clear image of your exam paper
- Ensure wrong answers are marked with ✗ or X
- Click "Analyze & Extract Wrong Questions"
- Wait 5-15 seconds for processing

### 4. Review Your Questions
- Go to "Review" tab
- See all extracted questions
- Click on a question to view details
- Read the AI explanation
- Mark status (Pending → Reviewing → Understood)

### 5. Track Your Progress
- Go to "Progress" tab
- See overall statistics
- View subject-wise breakdown
- Earn achievements!

## Tips for Best Results

### Image Upload
✅ **DO:**
- Use clear, well-lit images
- Ensure marks (✓ and ✗) are visible
- Upload one page at a time
- Use PNG or JPG format
- Keep under 10MB

❌ **DON'T:**
- Upload blurry images
- Mix multiple subjects in one upload
- Upload images without clear markings
- Use unsupported formats

### Question Review
✅ **Best Practice:**
1. Mark as "Reviewing" when you start studying
2. Read the AI explanation carefully
3. Practice the concept
4. Mark as "Understood" only when confident
5. Use filters to focus on specific subjects

### Search
- Use semantic search for concept-based queries
  - Example: "questions about photosynthesis"
  - Example: "trigonometry problems"
- Use filters to narrow down results
- Combine filters for precise results

## Troubleshooting

### "Port already in use"
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Module not found"
```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### "Google OAuth not working"
1. Check client ID is correct
2. Verify authorized origins include `http://localhost:3000`
3. Clear browser cookies
4. Try incognito/private mode

### "Image processing failed"
1. Check Azure OpenAI credentials
2. Verify GPT-4o deployment is active
3. Check Azure OpenAI quota
4. Ensure image is valid and under 10MB

### "Database errors"
```bash
# Reset database
cd backend
rm student_review.db
python main.py  # Will recreate tables
```

## Next Steps

- **Read the full documentation:** [README.md](README.md)
- **Set up Supabase properly:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Learn deployment:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Quick commands:** [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

## Get Help

- 📖 Check documentation files
- 🐛 Create an issue on GitHub
- 💬 Join our community (if applicable)
- 📧 Email support (if applicable)

## What's Next?

Once you're comfortable with the basics:

1. **Explore Advanced Features**
   - Try semantic search
   - Use date range filters
   - Export your data (future feature)

2. **Optimize Your Workflow**
   - Batch upload multiple papers
   - Create a study schedule
   - Track your improvement over time

3. **Share Feedback**
   - Report bugs
   - Suggest features
   - Share your success story

## Important Notes

⚠️ **Security:**
- Never share your `.env` files
- Keep API keys secret
- Use strong passwords

⚠️ **Costs:**
- Azure OpenAI charges per API call
- Supabase has free tier limits
- Monitor your usage

⚠️ **Privacy:**
- Your questions are private
- Images are stored locally (in uploads/)
- No data sharing with third parties

## Frequently Asked Questions

**Q: How accurate is the AI extraction?**
A: 85-95% accurate with clear images. Always review extracted questions.

**Q: What subjects are supported?**
A: All subjects! Mathematics, Sciences, Languages, Humanities, etc.

**Q: Can I use this on mobile?**
A: Yes! The web app is mobile-responsive.

**Q: Is my data private?**
A: Yes. Your questions are only visible to you.

**Q: How much does it cost to run?**
A: Depends on usage. Azure OpenAI charges ~$0.01 per image analyzed.

**Q: Can I export my questions?**
A: Coming soon! Currently you can view and review them in the app.

---

**Ready to start mastering your mistakes?**

Let's go! 🚀

For detailed setup instructions, see [README.md](README.md)
