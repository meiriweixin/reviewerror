# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered Student Review Web App for Singapore students (Secondary 1 to University level). Uses Azure OpenAI GPT-4o Vision to extract wrong questions from exam papers and stores them in Supabase for semantic search and review tracking.

**Tech Stack**: React 18 + FastAPI + Azure OpenAI GPT-4o + Supabase PostgreSQL

## Development Commands

### Running the Application

**Frontend** (React):
```bash
npm start                    # Dev server on http://localhost:3000
npm run build               # Production build
npm test                    # Run tests
```

**Backend** (FastAPI):
```bash
cd backend
# Activate virtual environment:
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows (Command Prompt)
venv\Scripts\Activate.ps1       # Windows (PowerShell)

python main.py                  # Dev server on http://localhost:8000
uvicorn main:app --reload       # Alternative with auto-reload
```

**Note**: This codebase is currently being developed on Windows (see git status paths with backslashes).

### Database Operations

The app uses **Supabase SDK only** (SQLAlchemy was removed):

```bash
# No local database file
# All data is in Supabase PostgreSQL (public schema with study_ prefix)
# Access Supabase Dashboard: https://supabase.com/dashboard
```

## Critical Architecture Patterns

### 1. Database Layer - Supabase SDK Only (NOT SQLAlchemy)

**Important**: This codebase removed SQLAlchemy in favor of direct Supabase SDK usage.

**Database Service Location**: `backend/app/services/supabase_db_service.py`

```python
from app.services.supabase_db_service import supabase_db

# All database operations use this singleton
user = await supabase_db.get_user_by_id(user_id)
question = await supabase_db.create_question(...)
stats = await supabase_db.get_user_stats(user_id)
```

**CRITICAL - Schema Configuration**: All tables are in the `public` schema with `study_` prefix:
- `study_users` - User accounts
- `study_questions` - Extracted wrong questions
- `study_upload_history` - Upload tracking
- `study_question_embeddings` - Vector embeddings for semantic search

**IMPORTANT - Schema Migration**: The app was migrated from custom `study` schema to `public` schema with `study_` table prefix to avoid PostgREST schema exposure issues.

**Supabase Access Pattern**:
```python
# Correct syntax for accessing public schema tables:
result = self.client.table("study_users").select("*").execute()

# Wrong syntax (will not work):
result = self.client.schema("study").table("users").select("*").execute()
result = self.client.table("study.users").select("*").execute()
```

**Key Pattern**: Router endpoints receive `current_user: Dict[str, Any]` (not ORM models). Access fields with `current_user['id']`, `current_user['email']`, etc.

### 2. Authentication Flow

**Backend**: JWT tokens with Google OAuth 2.0
- `get_current_user()` dependency extracts user from JWT and fetches from Supabase
- Returns `Dict[str, Any]`, not an ORM model
- Service role key used for backend operations (bypasses RLS)
- Clock skew tolerance: 10 seconds for Google OAuth token validation

**Frontend**: `@react-oauth/google` handles OAuth, stores JWT in localStorage
- **Note**: Google blocks automated browsers (like Chrome DevTools MCP) for security
- Always test authentication in a regular browser, not DevTools/automated tools

### 3. AI Vision Pipeline

**Question Extraction Flow**:
```
User uploads image
    ↓
FastAPI endpoint: POST /questions/upload
    ↓
azure_ai_service.analyze_question_paper()
    - GPT-4o Vision identifies wrong questions (marked with ✗)
    - Returns structured JSON with question text
    ↓
For each wrong question:
    - Generate explanation via azure_ai_service.explain_question()
    - Generate embedding via azure_ai_service.generate_embedding()
    - Store in study_questions via supabase_db.create_question()
    - Store vector in study_question_embeddings via supabase_service
```

**AI Explanation Format**: Explanations follow a strict 4-section structure:
```markdown
## Question
[One sentence restating the question]

## Key ideas
- [Bullet point 1]
- [Bullet point 2]

## Step-by-step solution
1. [Step 1 with calculation]
2. [Step 2 with calculation]

## Final answer
[Clear final answer statement]
```

**Math Rendering**: All mathematical expressions use LaTeX with `$...$` syntax (NOT parentheses):
- Correct: `$x = 5$`, `$y \geq 19.2$`
- Wrong: `( x = 5 )`, `( y >= 19.2 )`
- Frontend uses ReactMarkdown + remark-math + rehype-katex + KaTeX CSS

**Service Separation**:
- `azure_ai_service.py` - GPT-4o Vision for OCR and explanation
- `supabase_service.py` - Vector embeddings storage/search ONLY
- `supabase_db_service.py` - All CRUD operations (users, questions, uploads, stats)

### 4. Vector Search Architecture

**Two Supabase Services** (do not confuse them):

1. **`supabase_db_service.py`** - Main database CRUD operations
   - Uses service role key
   - Handles users, questions, uploads, statistics
   - Direct REST API calls via Supabase SDK

2. **`supabase_service.py`** - Vector embeddings ONLY
   - Uses service role key
   - Stores/searches question embeddings
   - Semantic search with pgvector

**Search Flow**:
```python
# 1. Generate query embedding
embedding = await azure_ai_service.generate_embedding(query_text)

# 2. Search vectors
results = await supabase_service.search_similar_questions(
    user_id=user_id,
    query_embedding=embedding,
    limit=10
)

# 3. Get full questions from database
for result in results:
    question = await supabase_db.get_question_by_id(result['question_id'])
```

### 5. Status Tracking System

Questions have three states (defined in `schemas.py`):
- `"pending"` - Not reviewed yet
- `"reviewing"` - Currently studying
- `"understood"` - Mastered

**Important**: These are string literals, not enum values (since SQLAlchemy was removed).

### 6. Token Usage Tracking System

**Purpose**: Monitor AI token consumption across all users for cost management and usage analytics.

**Database Schema**: Token tracking columns in `study_users` table:
- `total_tokens_used` - Cumulative total tokens consumed by user
- `prompt_tokens_used` - Total input/prompt tokens
- `completion_tokens_used` - Total output/completion tokens
- `last_token_update` - Timestamp of last token consumption

**AI Service Pattern**: All AI methods return token usage alongside results:
```python
# analyze_question_paper() returns dict with tokens_used
result = await azure_ai_service.analyze_question_paper(image_path, subject)
tokens = result["tokens_used"]  # {prompt_tokens, completion_tokens, total_tokens}

# explain_question() returns tuple (explanation, tokens_used)
explanation, tokens = await azure_ai_service.explain_question(text, subject, grade)

# generate_embedding() returns tuple (embedding, tokens_used)
embedding, tokens = await azure_ai_service.generate_embedding(text)
```

**Token Tracking Flow**:
```python
# In routers (questions.py):
# 1. Track tokens during AI operations
total_tokens = 0
analysis_result = await azure_ai_service.analyze_question_paper(...)
total_tokens += analysis_result["tokens_used"]["total_tokens"]

# 2. Save to database after operations complete
await supabase_db.add_token_usage(
    user_id=user_id,
    prompt_tokens=prompt_tokens,
    completion_tokens=completion_tokens,
    total_tokens=total_tokens
)
```

**Usage Dashboard** (`src/components/Usage.js`):
- **System-wide totals**: Displays aggregate tokens across all users
- **Individual user breakdown**: Table showing per-user consumption, sorted by usage
- **Cost estimation**: Calculates costs based on GPT-4o pricing ($5/1M input, $15/1M output)
- **Current user highlight**: User's own account highlighted in table

**API Endpoints**:
- `GET /usage/tokens` - Current user's token statistics
- `GET /usage/tokens/all` - System-wide statistics + all users breakdown

**Key Points**:
- Token tracking is non-blocking - failures don't stop operations
- Tokens tracked for: image analysis, explanations, embeddings
- Users sorted by total tokens (highest first) in dashboard
- Cost estimates are approximate based on Azure OpenAI list pricing

### 7. Grade Filtering Pattern

**CRITICAL**: Components should filter content by the selected grade from user object.

**Current Implementation Status**:
- ✅ **Upload.js** - Has `grade` state initialized from `user?.grade`, sends grade in upload API
- ⚠️ **Review.js** - Loads questions via `getWrongQuestions(filters)` but doesn't include grade in filters
- ⚠️ **Progress.js** - Loads stats via `getStudentStats()` and `getSubjectStats()` without grade parameter
- ✅ **Dashboard.tsx** - Manages grade selection and propagates user object to child components

**Expected Pattern for Grade-Aware Components**:
```javascript
// In component receiving user prop
const [grade, setGrade] = useState(user?.grade || '');

// Update grade when user prop changes
useEffect(() => {
  if (user?.grade) {
    setGrade(user.grade);
    // Reload data with new grade
    loadData();
  }
}, [user?.grade]);

// Include grade in API calls
const loadData = async () => {
  const data = await apiCall({ grade: user?.grade, ...otherParams });
};
```

**Backend API Pattern**:
- Most endpoints accept optional `grade` query parameter
- Backend filters database queries by user_id AND grade when provided
- Check router implementations for grade parameter support

## File Structure Highlights

### Backend Service Layer

```
backend/app/services/
├── azure_ai_service.py        # GPT-4o Vision for OCR and explanations
├── supabase_service.py        # Vector embeddings (pgvector)
└── supabase_db_service.py     # Main database CRUD (replaces SQLAlchemy)
```

### Backend Routers

```
backend/app/routers/
├── auth.py        # Google OAuth, JWT, user management
├── questions.py   # Upload, extract, review, search, delete, regenerate questions (tracks tokens)
├── stats.py       # User statistics, subject breakdown
└── usage.py       # Token usage endpoints (individual user + system-wide)
```

**Pattern**: All routers import `from app.services.supabase_db_service import supabase_db`

**CRITICAL - Route Ordering in questions.py**: FastAPI matches routes in definition order. More specific routes MUST come before generic ones:
```python
# Correct order:
@router.post("/{question_id}/regenerate")  # Specific route first
@router.put("/{question_id}/status")       # Specific route
@router.get("/{question_id}")              # Generic route last
@router.delete("/{question_id}")           # Generic route

# Wrong order causes 404 errors:
@router.get("/{question_id}")              # Generic route matches "regenerate" as ID
@router.post("/{question_id}/regenerate")  # Never reached!
```

### Frontend Components

```
src/components/
├── Login.js               # Google OAuth + Lottie robot animation + WebGL canvas background
├── CanvasRevealEffect.js  # WebGL shader for animated dot matrix background (Login only)
├── Dashboard.tsx          # Main container with sidebar (grade dropdown, tab navigation) and header
├── Upload.js              # Image upload and AI extraction
├── Review.js              # Question list with filters, markdown rendering, regenerate
├── Progress.js            # Analytics and achievements
├── Usage.js               # System-wide token usage dashboard with user breakdown table
├── Settings.js            # User profile and grade settings
└── GradeSelection.js      # DEPRECATED - No longer used in routing (kept for potential future use)
```

**Frontend Dependencies** (package.json):
- `react-markdown` - Markdown rendering for explanations
- `remark-math` - Parse LaTeX math in markdown
- `rehype-katex` - Render LaTeX with KaTeX
- `@tailwindcss/typography` - Prose styling for markdown content
- `lucide-react` - Icon library used in Dashboard.tsx
- `lottie-react` - Lottie animation support (used in Login.js for robot animation)
- `framer-motion` - Animation library
- `three` + `@react-three/fiber` - WebGL rendering for canvas effects (Login.js background)

**Frontend File Types**:
- Dashboard.tsx - TypeScript React component
- All other components (Upload, Review, Progress, Settings, Login, GradeSelection) - JavaScript (.js)

**UI Styling Pattern**:
- All corners use `rounded-2xl` (16px radius) for major containers
- Form inputs use `rounded-xl` (12px radius)
- Consistent Tailwind CSS classes across components
- Dark mode support in Dashboard.tsx only

### Frontend Routing & Navigation Flow

**Direct Dashboard Access**: Login goes directly to dashboard with grade selection in sidebar.

```
Login (/login)
    ↓
Dashboard (/dashboard) - Grade dropdown in left sidebar
    ├── Upload tab
    ├── Review tab
    ├── Progress tab
    └── Settings tab
```

**Key Navigation Behaviors**:
- Visiting `/` or `/login` when authenticated → redirects to `/dashboard`
- Grade selection is done via dropdown in Dashboard sidebar (not separate page)
- Changing grade updates user profile and triggers page reload
- Logging out → clears JWT token and returns to login

**State Management** (App.js):
```javascript
const [user, setUser] = useState(null);  // User object from getCurrentUser()
// No separate gradeSelected state - grade is part of user object
```

**Dashboard Grade Selection** (Dashboard.tsx):
```typescript
const [currentGrade, setCurrentGrade] = useState(user?.grade || '');

const handleGradeChange = async (newGrade: string) => {
  await updateUserGrade(newGrade);
  setCurrentGrade(newGrade);
  window.location.reload();  // Refresh to update user data
};
```

## Environment Variables

### Backend `.env` (Required)

```env
SECRET_KEY=<generate-strong-key>
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com/
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**Critical**: `SUPABASE_SERVICE_ROLE_KEY` is needed for backend operations (bypasses RLS).

### Frontend `.env.local` (Required)

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxx
```

## Common Development Scenarios

### Adding a New Question Field

1. Add column in Supabase SQL Editor:
   ```sql
   ALTER TABLE study_questions ADD COLUMN new_field TEXT;
   ```

2. Update `supabase_db_service.py`:
   ```python
   async def create_question(self, ..., new_field: Optional[str] = None):
       data = {
           ...
           "new_field": new_field,
       }
   ```

3. Update Pydantic schema in `schemas.py`:
   ```python
   class QuestionResponse(QuestionBase):
       ...
       new_field: Optional[str] = None
   ```

4. Update frontend API calls in `src/services/api.js`

**No ORM models to update** - this is the benefit of removing SQLAlchemy.

### Modifying AI Explanation Prompt

The AI explanation prompt is in `azure_ai_service.py:154-188`. Key considerations:
- Keep the 4-section structure (Question, Key ideas, Step-by-step solution, Final answer)
- Enforce `$...$` syntax for all math (examples in prompt prevent parentheses)
- Use `temperature=0.2` for consistency
- Max 600 tokens to keep explanations concise
- System message reinforces structured output

### Testing AI Question Extraction

```bash
# Use curl to test upload endpoint
curl -X POST \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "file=@test-image.jpg" \
  -F "subject=Mathematics" \
  -F "grade=sec1" \
  http://localhost:8000/questions/upload
```

**GPT-4o Vision Prompt**: Located in `azure_ai_service.py:40-70`. Looks for crosses (✗) and extracts question text.

### Debugging Database Issues

```python
# Check if Supabase connection works
from app.services.supabase_db_service import supabase_db
user = await supabase_db.get_user_by_id(1)
print(user)  # Should return dict or None
```

**Common Issues**:
- Wrong service role key → 401 errors
- Tables not created → "relation does not exist" error
- Wrong SDK syntax → Use `table("study_users")` not `schema("study").table("users")` or `table("study.users")`
- RLS blocking access → ensure backend uses service_role key

### Testing Vector Search

```python
# Generate embedding
embedding = await azure_ai_service.generate_embedding("algebra question")

# Search
results = await supabase_service.search_similar_questions(
    user_id=1,
    query_embedding=embedding,
    limit=5
)
```

**Note**: Embeddings are 1536 dimensions (Azure text-embedding-ada-002 model).

## API Documentation

When backend is running:
- Interactive API docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Migration Notes

**Recent Changes** (see `SQLALCHEMY_REMOVAL_COMPLETE.md`):
- Removed SQLAlchemy, asyncpg, vecs, pgvector, psycopg2-binary
- All database operations now via Supabase SDK
- `models.py` and `database.py` archived (`.old` extension)
- Router endpoints return dicts, not ORM objects
- Use `UserResponse(**user_dict)` to convert to Pydantic models

**Recent UI Changes** (November 2024):
- Removed separate `/grade-selection` route - grade selection now in Dashboard sidebar
- Updated all UI components to use `rounded-2xl` for consistent rounded corners
- Dashboard converted to TypeScript (Dashboard.tsx) with Lucide icons
- Grade display formatting added (sec1 → SEC 1, jc1 → JC 1, etc.)
- Grade changes now trigger full page reload to update user data across components
- Login page enhanced with:
  - Lottie robot animation (src/robot.json) displayed at 120x120px
  - WebGL animated dot matrix canvas background (CanvasRevealEffect component)
  - Blue/indigo/purple gradient color scheme with glass morphism effects
  - Note: @react-three/fiber downgraded to v8.15.12 for React 18 compatibility

**If you see references to SQLAlchemy**: These are outdated. Use `supabase_db` service instead.

**If Settings.js references `/grade-selection` navigation**: This is outdated - grade selection is now in Dashboard sidebar only.

## Security Patterns

1. **Backend uses service role key** - Full database access, bypasses RLS
2. **Frontend uses anon key** - Would be restricted by RLS (but frontend doesn't directly access database)
3. **JWT tokens** - Stored in localStorage, sent in Authorization header
4. **Google OAuth** - No password storage, OAuth 2.0 flow with clock skew tolerance
5. **File uploads** - Validated for image type, max 10MB, unique filenames

## Troubleshooting

### "Supabase not initialized" or connection errors
- Check `SUPABASE_SERVICE_ROLE_KEY` in backend `.env`
- Verify Supabase project is not paused
- Ensure tables exist in `public` schema with `study_` prefix

### "Table not found" errors
- Tables are in `public` schema with `study_` prefix
- Run SQL migration in Supabase dashboard if tables don't exist
- Check `create_study_tables.sql` for table definitions

### "relation 'study_users' does not exist"
- Tables haven't been created in Supabase yet
- Run the SQL migration in Supabase SQL Editor
- Ensure you're connected to the correct database/project

### GPT-4o Vision not detecting questions
- Ensure image has clear crosses (✗) or wrong marks
- Check Azure OpenAI quota and deployment status
- Review prompt in `azure_ai_service.py` - may need tuning for different exam formats

### Google OAuth fails in Chrome DevTools / automated browsers
- Google blocks automated browsers for security
- Always test login in regular Chrome/Edge browser
- DevTools MCP / automated tools will show "This browser or app may not be secure"

### JWT "Subject must be a string" error
- Already fixed: JWT payload uses `str(user['id'])` not `user['id']`
- If you see this, ensure user ID is converted to string before encoding

## Testing Checklist

Before deploying:
- [ ] Google OAuth login works (test in regular browser, NOT DevTools)
- [ ] Grade selection/update works
- [ ] Image upload triggers AI extraction
- [ ] Questions appear in review list
- [ ] Explanations render with proper markdown formatting
- [ ] Math expressions render correctly with KaTeX (no parentheses)
- [ ] Regenerate button creates new explanation with updated format
- [ ] Status updates (pending → reviewing → understood)
- [ ] Search finds relevant questions
- [ ] Statistics display correctly
- [ ] Delete question removes from database and vectors

## Key Files to Read First

1. `SQLALCHEMY_REMOVAL_COMPLETE.md` - Recent architecture change
2. `TOKEN_USAGE_IMPLEMENTATION.md` - Token tracking system documentation
3. `FIX_LOGIN_ISSUE.md` - Schema syntax fix
4. `EXPOSE_STUDY_SCHEMA_GUIDE.md` - Supabase schema exposure
5. `backend/app/services/supabase_db_service.py` - Database operations + token tracking
6. `backend/app/services/azure_ai_service.py` - AI vision logic (returns token usage)
7. `backend/app/routers/questions.py` - Main workflow with token tracking
8. `backend/app/routers/usage.py` - Token usage API endpoints
9. `src/components/Dashboard.tsx` - Main UI container with grade selection
10. `src/components/Login.js` - OAuth + Lottie + WebGL canvas implementation
11. `src/components/Usage.js` - Token usage dashboard
12. `src/components/Upload.js` - Frontend upload flow

## Known Issues & Next Steps

### Grade Filtering Implementation Needed

**Current Status**: Grade selection UI exists in Dashboard sidebar, but child components don't fully utilize it.

**Required Changes**:

1. **Review.js** - Add grade to filters:
   ```javascript
   const [filters, setFilters] = useState({
     subject: '',
     status: 'pending',
     grade: user?.grade || '',  // Add this
     start_date: '',
     end_date: '',
   });

   // Watch for user.grade changes
   useEffect(() => {
     if (user?.grade) {
       setFilters(prev => ({ ...prev, grade: user.grade }));
     }
   }, [user?.grade]);
   ```

2. **Progress.js** - Pass grade to stats API:
   ```javascript
   const loadStats = async () => {
     const [generalStats, subjects] = await Promise.all([
       getStudentStats(user?.grade),  // Add grade parameter
       getSubjectStats(user?.grade),  // Add grade parameter
     ]);
   };
   ```

3. **Backend API** - Verify grade parameter support:
   - Check if `questions.py` router endpoints accept and filter by grade
   - Check if `stats.py` router endpoints accept and filter by grade
   - Update SQL queries to include `WHERE grade = ?` when grade provided

### Settings.js Cleanup

The Settings component still has a "Go to Grade Selection" button (line 120-124) that navigates to `/grade-selection`. This should be removed or updated to inform users that grade changes are now in the Dashboard sidebar.

### TypeScript Migration Consideration

Dashboard is now TypeScript (.tsx), but other components remain JavaScript (.js). Consider:
- Gradual migration of other components to TypeScript
- Or keep mixed approach if team prefers JavaScript for simpler components
