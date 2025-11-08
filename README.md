# AI-Powered Student Review Web App

A comprehensive web application that helps students from Singapore Secondary 1 to University level review and master their wrongly answered questions across all subjects. The app uses Azure OpenAI GPT-4o Vision to intelligently extract wrong questions from scanned exam papers and stores them in a Supabase vector database for semantic search and review.

## Features

- **Google OAuth Authentication** - Secure login with Gmail
- **Grade Selection** - Support for Secondary 1-4, JC, Polytechnic, and University levels
- **AI-Powered Question Extraction** - Automatically identifies and extracts wrongly answered questions from uploaded images
- **Vector Database Storage** - Stores questions in Supabase with semantic search capabilities
- **Review & Redo Mode** - Track progress on each question (Pending, Reviewing, Understood)
- **Progress Tracking** - Visual analytics and achievement system
- **Multi-Subject Support** - Covers all academic subjects
- **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Supabase Client** - Vector database integration

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - ORM for SQLite database
- **Azure OpenAI GPT-4o** - Vision model for question extraction
- **Supabase** - Vector database for semantic search
- **Google OAuth 2.0** - Authentication
- **JWT** - Secure token-based auth

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js** (v16 or higher)
- **Python** (v3.9 or higher)
- **Google Cloud Project** with OAuth 2.0 credentials
- **Azure OpenAI** account with GPT-4o deployment
- **Supabase** account and project

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd student-review-app
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Application Settings
SECRET_KEY=your-secret-key-here-generate-a-strong-random-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database
DATABASE_URL=sqlite+aiosqlite:///./student_review.db

# File Upload
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE=10485760

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Supabase Setup

Create the following table in your Supabase SQL editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create question embeddings table
CREATE TABLE IF NOT EXISTS question_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    subject VARCHAR(100),
    grade VARCHAR(50),
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX ON question_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX idx_question_embeddings_user_id ON question_embeddings(user_id);
CREATE INDEX idx_question_embeddings_subject ON question_embeddings(subject);
CREATE INDEX idx_question_embeddings_grade ON question_embeddings(grade);
```

### 5. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - Your production domain
7. Add authorized redirect URIs:
   - `http://localhost:3000`
   - Your production domain
8. Copy the Client ID and Client Secret

### 6. Azure OpenAI Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create an "Azure OpenAI" resource
3. Deploy the GPT-4o model
4. Note down:
   - Endpoint URL
   - API Key
   - Deployment name

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

The backend will run on `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Production Build

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Project Structure

```
student-review-app/
├── public/                 # Static files
├── src/                   # Frontend source code
│   ├── components/        # React components
│   │   ├── Login.js
│   │   ├── GradeSelection.js
│   │   ├── Dashboard.js
│   │   ├── Upload.js
│   │   ├── Review.js
│   │   ├── Progress.js
│   │   └── Settings.js
│   ├── services/          # API services
│   │   ├── api.js
│   │   └── supabase.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── backend/               # Backend source code
│   ├── app/
│   │   ├── routers/       # API routes
│   │   │   ├── auth.py
│   │   │   ├── questions.py
│   │   │   └── stats.py
│   │   ├── services/      # Business logic
│   │   │   ├── azure_ai_service.py
│   │   │   └── supabase_service.py
│   │   ├── models.py      # Database models
│   │   ├── schemas.py     # Pydantic schemas
│   │   ├── database.py    # Database config
│   │   └── config.py      # App config
│   ├── main.py            # FastAPI app
│   └── requirements.txt
├── package.json
├── tailwind.config.js
└── README.md
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Main Endpoints

**Authentication:**
- `POST /auth/google` - Login with Google
- `GET /auth/me` - Get current user
- `PUT /auth/grade` - Update user grade

**Questions:**
- `POST /questions/upload` - Upload question paper
- `GET /questions/wrong` - Get all wrong questions
- `GET /questions/{id}` - Get specific question
- `PUT /questions/{id}/status` - Update question status
- `POST /questions/search` - Semantic search questions
- `DELETE /questions/{id}` - Delete question

**Statistics:**
- `GET /stats/` - Get overall stats
- `GET /stats/by-subject` - Get subject-wise stats

## Usage Guide

### 1. Login
- Click "Continue with Google"
- Authorize the application
- Select your grade level

### 2. Upload Questions
- Navigate to the "Upload" tab
- Select subject from dropdown
- Upload a clear image of your exam paper/worksheet
- Ensure check marks (✓) and crosses (✗) are visible
- Click "Analyze & Extract Wrong Questions"
- Wait for AI to process the image

### 3. Review Questions
- Navigate to the "Review" tab
- Use filters to find specific questions
- Click on a question to view details
- Mark questions as:
  - **Pending** - Not reviewed yet
  - **Reviewing** - Currently studying
  - **Understood** - Mastered

### 4. Track Progress
- Navigate to the "Progress" tab
- View overall completion percentage
- See subject-wise breakdown
- Earn achievements for milestones

## Troubleshooting

### Backend Issues

**Database errors:**
```bash
# Delete database and restart
rm student_review.db
python main.py
```

**Module import errors:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

**Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**CORS errors:**
- Ensure backend ALLOWED_ORIGINS includes your frontend URL
- Check that proxy is set in package.json

### Azure OpenAI Issues

**Rate limiting:**
- Implement retry logic
- Request quota increase from Azure

**Vision API errors:**
- Ensure image is properly encoded
- Check image size (max 10MB)
- Verify deployment has vision capability

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use strong SECRET_KEY** for JWT tokens
3. **Implement rate limiting** in production
4. **Validate file uploads** to prevent malicious files
5. **Use HTTPS** in production
6. **Keep dependencies updated** regularly

## Future Enhancements

- [ ] Export questions to PDF/CSV
- [ ] Teacher dashboard for bulk question import
- [ ] Collaborative study groups
- [ ] Spaced repetition algorithm
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Integration with learning management systems
- [ ] AI-powered question recommendations

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Create an issue on GitHub
- Email: support@studentreviewapp.com

## Acknowledgments

- Azure OpenAI for GPT-4o Vision
- Supabase for vector database
- Google for OAuth authentication
- FastAPI and React communities

---

Built with ❤️ for students by students
