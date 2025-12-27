# Category Taxonomy Implementation

**Date:** 2025-12-28
**Feature:** Question Category Taxonomy for Enhanced Filtering and Reporting

## Overview

This document outlines the implementation of a category taxonomy feature for the Review Questions page. This feature enables users to categorize questions by specific topics (e.g., "Algebra" or "Geometry" within Mathematics), improving filtering capabilities and enabling better report generation.

## Changes Summary

### 1. Database Changes

**File:** `backend/migrations/add_category_column.sql`

- Added `category` column to `study_questions` table (TEXT type)
- Created index `idx_study_questions_category` for faster category filtering
- Created composite index `idx_study_questions_subject_category` for common filter combinations

**To Apply Migration:**
```bash
# Run this SQL in your Supabase SQL Editor:
# Navigate to: https://supabase.com/dashboard -> Your Project -> SQL Editor
# Paste and execute the contents of backend/migrations/add_category_column.sql
```

### 2. Backend Changes

#### **Schema Updates** (`backend/app/schemas.py`)
- Added `category: Optional[str] = None` to `QuestionBase` model
- Category field is now part of all question-related schemas (create, update, response)

#### **Database Service Updates** (`backend/app/services/supabase_db_service.py`)
- Updated `create_question()` to accept and store `category` parameter
- Updated `get_questions_by_user()` to filter by `category` parameter
- Category filtering works seamlessly with existing filters (subject, grade, status)

#### **Router Updates** (`backend/app/routers/questions.py`)
- Updated `GET /questions/wrong` endpoint to accept `category` query parameter
- Category filter is applied at database query level for optimal performance

### 3. Frontend Changes

#### **Review Component Updates** (`src/components/Review.js`)

**Filter State:**
- Added `category: ''` to filters state
- Implemented cascading dropdown logic (category options depend on selected subject)

**Category Options by Subject:**
```javascript
{
  Mathematics: ['Algebra', 'Geometry', 'Arithmetic', 'Calculus', 'Statistics', 'Trigonometry'],
  Physics: ['Mechanics', 'Electricity', 'Magnetism', 'Thermodynamics', 'Optics', 'Modern Physics'],
  Chemistry: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
  Biology: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Biology', 'Botany'],
  English: ['Grammar', 'Comprehension', 'Composition', 'Literature', 'Vocabulary'],
  Other: []
}
```

**UI Enhancements:**
- **Category Dropdown:** Positioned between Subject and Status filters
  - Disabled when no subject is selected
  - Shows "Select Subject First" placeholder when disabled
  - Auto-resets when subject changes
  - Matches dark theme styling with `rounded-2xl` corners

- **Category Badge Display:**
  - Question Cards: Blue pill badge next to subject name
  - Modal Detail View: Larger badge in header next to subject
  - Styling: `bg-blue-100/80 dark:bg-blue-900/40` with matching border
  - Only displays when category is present (gracefully handles null)

**Filter Grid Update:**
- Changed from 4-column to 5-column grid (`lg:grid-cols-5`) to accommodate new category filter

#### **API Service Updates** (`src/services/api.js`)
- Updated `getWrongQuestions()` to include `category` parameter in query string

## UI/UX Design

### Filter Bar Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Subject ▼  │  Category ▼  │  Status ▼  │  From Date  │  To Date │
└─────────────────────────────────────────────────────────────────┘
```

### Question Card Design
```
┌────────────────────────────────────────────────────┐
│ Mathematics [Algebra]              [pending]       │
│ Date: 2025-12-28                                   │
│                                                    │
│ [Question Image]                                   │
│ Question text preview...                           │
│                                                    │
│ [Reviewing]  [Understood]                          │
└────────────────────────────────────────────────────┘
```

Category badge styling:
- Rounded full (pill shape)
- Blue color scheme matching the app theme
- Semi-transparent background for dark mode compatibility
- Small font size (text-xs) to avoid overwhelming the UI

## Testing Checklist

### 1. Database Migration
- [ ] Run SQL migration in Supabase SQL Editor
- [ ] Verify `category` column exists in `study_questions` table
- [ ] Check that indexes were created successfully

### 2. Backend Testing
- [ ] Start backend server: `cd backend && python main.py`
- [ ] Test API endpoint: `GET /questions/wrong?subject=Mathematics&category=Algebra`
- [ ] Verify category filtering works in API response
- [ ] Check that existing questions (with null category) still load correctly

### 3. Frontend Testing

**Filter Functionality:**
- [ ] Navigate to Review Questions page
- [ ] Verify Category dropdown is disabled when no subject is selected
- [ ] Select "Mathematics" - Category dropdown should enable with 6 options
- [ ] Select "Algebra" - Questions should filter to show only Algebra questions
- [ ] Change subject - Category should reset to "All Categories"
- [ ] Test "All Subjects" + "All Categories" - Should show all questions

**Visual Display:**
- [ ] Verify category badge appears on question cards (when category exists)
- [ ] Check badge styling in light mode
- [ ] Check badge styling in dark mode
- [ ] Open question detail modal - verify category badge in header
- [ ] Test with questions that have no category (badge should not appear)

**Cascading Behavior:**
- [ ] Select Physics → verify Physics categories appear
- [ ] Select Chemistry → verify Chemistry categories appear
- [ ] Select "All Subjects" → verify Category dropdown disables

### 4. Integration Testing
- [ ] Upload new questions and verify they can be assigned categories (manual DB update for now)
- [ ] Test category filtering with other filters (status, date range, grade)
- [ ] Verify search functionality still works with category-filtered questions
- [ ] Test regenerate explanation - ensure category is preserved
- [ ] Test delete question - ensure operation completes successfully

## Future Enhancements

### 1. AI-Powered Category Assignment
Currently, categories must be manually assigned in the database. Future enhancement:
- Update `azure_ai_service.analyze_question_paper()` to detect category from question content
- Add category prediction to AI explanation prompt
- Auto-assign category during question upload

**Implementation Path:**
```python
# In azure_ai_service.py
async def detect_question_category(question_text: str, subject: str) -> str:
    """Use GPT-4o to detect question category based on content"""
    # Add to existing AI prompt or create separate category detection call
```

### 2. Custom Categories
Allow users to create custom categories per subject:
- Add `study_categories` table for user-defined categories
- UI for category management in Settings
- Dynamic category dropdown based on user's saved categories

### 3. Category Analytics
Enhance Progress/Stats page with category breakdown:
- Show performance by category (% understood per category)
- Identify weak categories that need more practice
- Category-based progress charts

### 4. Bulk Category Assignment
Add UI feature to bulk-assign categories to existing questions:
- Multi-select questions
- Assign category to selected questions
- Useful for categorizing historical data

## Known Limitations

1. **Existing Questions:** Questions uploaded before this update have `category = null`
   - Solution: Manually update via Supabase dashboard or SQL
   - Future: Implement bulk assignment feature

2. **No Category Validation:** Backend accepts any string as category
   - Current: Frontend controls valid options via dropdown
   - Future: Add backend validation with allowed categories per subject

3. **Static Category List:** Categories are hardcoded in frontend
   - Current: Easy to modify in Review.js
   - Future: Store in database for dynamic management

## Database Schema Reference

```sql
-- study_questions table structure (relevant fields)
CREATE TABLE study_questions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT,  -- NEW FIELD
  question_text TEXT NOT NULL,
  grade TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE,
  ...
);

-- Indexes
CREATE INDEX idx_study_questions_category ON study_questions(category);
CREATE INDEX idx_study_questions_subject_category ON study_questions(subject, category);
```

## API Endpoints

### Get Questions with Category Filter
```http
GET /questions/wrong?subject=Mathematics&category=Algebra&status=pending&grade=sec1
```

**Query Parameters:**
- `subject` (optional): Filter by subject
- `category` (optional): Filter by category
- `status` (optional): Filter by status (pending/reviewing/understood)
- `grade` (optional): Filter by grade level
- `start_date` (optional): Filter by creation date (from)
- `end_date` (optional): Filter by creation date (to)

**Response:**
```json
[
  {
    "id": 1,
    "subject": "Mathematics",
    "category": "Algebra",
    "question_text": "Solve for x: 2x + 5 = 15",
    "grade": "sec1",
    "status": "pending",
    "explanation": "...",
    "created_at": "2025-12-28T10:00:00Z",
    ...
  }
]
```

## Troubleshooting

### Category Dropdown Not Showing Options
- **Check:** Is a subject selected?
- **Fix:** Select a subject first; dropdown is intentionally disabled when subject is empty

### Category Filter Not Working
- **Check:** Has the SQL migration been run?
- **Fix:** Execute `add_category_column.sql` in Supabase SQL Editor
- **Verify:** Check if `category` column exists in `study_questions` table

### Category Badge Not Appearing
- **Check:** Does the question have a category value in the database?
- **Fix:** Category badge only appears when `question.category` is not null
- **Test:** Manually set a category value in Supabase dashboard to verify display

### Backend Error: "column category does not exist"
- **Cause:** Migration has not been applied
- **Fix:** Run the SQL migration file in Supabase SQL Editor

## Files Modified

### Backend
- `backend/app/schemas.py` - Added category field to schemas
- `backend/app/services/supabase_db_service.py` - Added category parameter to methods
- `backend/app/routers/questions.py` - Added category query parameter

### Frontend
- `src/components/Review.js` - Added category filter UI and badge display
- `src/services/api.js` - Added category to API request parameters

### Database
- `backend/migrations/add_category_column.sql` - New SQL migration file

### Documentation
- `CATEGORY_TAXONOMY_IMPLEMENTATION.md` - This file

## Support

For issues or questions about this implementation:
1. Check this documentation first
2. Verify all files have been updated correctly
3. Ensure SQL migration has been run in Supabase
4. Test with the provided checklist above

---

**Implementation Complete:** All core functionality has been implemented and is ready for testing.
**Next Steps:** Run SQL migration → Test filtering → Consider future enhancements (AI category detection)
