# Paper Library "Closed Loop" Implementation Plan

**Date:** 2025-12-28
**Feature:** Comprehensive Paper Library with PDF capture and closed-loop learning

## Overview

Transform the Review Questions app into a complete learning platform where users can:
1. Upload exam papers to earn credits
2. Browse and download papers from a shared library
3. Open papers in "Practice Mode" with a PDF viewer
4. Capture specific questions from PDFs by drawing rectangles
5. Automatically add captured questions to their Review list

## Architecture Changes

### Database Layer
```
New Tables:
- study_papers (stores uploaded PDF papers)
- study_credit_transactions (tracks credit history)

Updated Tables:
- study_users: + credits column (default: 5)
- study_questions: + source_paper_id column (links to study_papers)
```

### Backend Services
```
New Services:
- Paper Library Service (CRUD for papers)
- Credits Service (manage user credits)
- PDF Storage Service (upload/download PDFs)

New Endpoints:
- GET/POST /papers - List/upload papers
- GET /papers/{id} - Get paper details
- POST /papers/{id}/download - Download (costs 1 credit)
- POST /papers/{id}/practice - Open in practice mode (costs 1 credit)
- GET /credits - Get user credits
- POST /questions/capture - Create question from PDF snippet
```

### Frontend Components
```
New Components:
- Sidebar (navigation menu)
- PaperLibrary (list papers)
- PaperUpload (upload new papers)
- PDFViewer (view + capture tool)
- CaptureModal (add captured question to review)

Updated Components:
- Dashboard (add sidebar layout)
- Review (show source paper info)
```

## Implementation Phases

### Phase 1: Database Setup ✅
**Files:**
- `backend/migrations/add_paper_library.sql`
- `backend/app/schemas.py`

**Status:** Complete

### Phase 2: Backend Services (Current)
**Files to Create/Update:**
1. `backend/app/services/supabase_db_service.py`
   - Add paper CRUD methods
   - Add credit transaction methods
   - Update create_question to accept source_paper_id

2. `backend/app/services/supabase_storage_service.py`
   - Add PDF upload/download methods (separate from images)

3. `backend/app/routers/papers.py` (NEW)
   - Paper list/upload/download/practice endpoints

4. `backend/app/routers/credits.py` (NEW)
   - Get user credits
   - Transaction history

5. `backend/app/routers/questions.py`
   - Add capture_question endpoint
   - Update upload to support source_paper_id

### Phase 3: Frontend Layout Refactor
**Files to Update:**
1. `src/components/Dashboard.tsx`
   - Add permanent sidebar
   - Add credits display at bottom
   - Update routing for "My Review" and "Paper Library"

### Phase 4: Paper Library Page
**Files to Create:**
1. `src/components/PaperLibrary.js`
   - List all papers in cards/table
   - Upload button/form
   - Download button (1 credit)
   - "Open & Capture" button (1 credit)

2. `src/services/api.js`
   - Add paper API calls

### Phase 5: PDF Viewer with Capture Tool
**Files to Create:**
1. `src/components/PDFViewer.js`
   - Integrate react-pdf
   - Add selection tool for drawing rectangles
   - Capture selected area as image

2. `src/components/CaptureModal.js`
   - Form to add question details
   - Auto-fill subject/date from paper
   - Select category, add note
   - Save to Review Questions

### Phase 6: Integration & Testing
- Test credit system
- Test PDF capture workflow
- Test closed-loop (capture → review → practice)

## Technical Implementation Details

### Credits System

**Starting Balance:** 5 credits (on user creation)

**Earn Credits:**
- Upload paper: +1 credit

**Spend Credits:**
- Download paper: -1 credit
- Practice mode (PDF viewer): -1 credit

**Backend Logic:**
```python
async def add_credits(user_id: int, amount: int, type: str, description: str):
    # Update user credits
    # Log transaction

async def deduct_credits(user_id: int, amount: int, type: str, description: str):
    # Check if user has enough credits
    # Deduct credits
    # Log transaction
```

### PDF Storage

**Upload:**
- Store in Supabase Storage: `papers/[user_id]/[filename].pdf`
- Save metadata in `study_papers` table

**Download:**
- Generate signed URL from Supabase Storage
- Return URL to frontend

### PDF Capture Tool

**Option 1: react-pdf + Selection**
```javascript
// Use react-pdf to render PDF
// Overlay a canvas for drawing rectangles
// Capture selected area as image
// Send image to backend
```

**Option 2: Mock Implementation**
```javascript
// User clicks "Capture"
// Shows file upload for snippet image
// Simpler for prototype
```

**Recommended:** Start with Option 2 (mock) for faster development

### Data Flow: Capture Question

```
1. User clicks "Open & Capture" on paper
   → Deduct 1 credit
   → Open PDF viewer

2. User draws rectangle around question
   → Capture area as image
   → Show CaptureModal

3. User fills form:
   - Subject (auto-filled from paper)
   - Category (dropdown)
   - Note (text input)
   → Click "Save"

4. Backend creates question:
   - question_text: from OCR or user note
   - image_url: captured snippet
   - source_paper_id: link to paper
   - subject, category, grade from form

5. Redirect to Review Questions
   → New question appears in "pending" list
```

## UI/UX Mockups

### Sidebar Navigation
```
┌──────────────────┐
│  My Review       │ ← Current page icon
├──────────────────┤
│  Paper Library   │
├──────────────────┤
│                  │
│  (space)         │
│                  │
├──────────────────┤
│  My Credits: 5   │ ← Bottom
└──────────────────┘
```

### Paper Library Page
```
┌─────────────────────────────────────────────────────┐
│ Paper Library                 [Upload Paper +1 📤]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ 2023 Mid-Year Mathematics Exam                 │ │
│ │ Subject: Mathematics | Grade: SEC 1 | Year: 2023│ │
│ │ Uploaded by: John Doe                          │ │
│ │ [Download 💾 -1] [Open & Capture 🔍 -1]        │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
│ ┌────────────────────────────────────────────────┐ │
│ │ 2024 Physics Final Exam                        │ │
│ │ Subject: Physics | Grade: SEC 2 | Year: 2024  │ │
│ │ Uploaded by: Jane Smith                        │ │
│ │ [Download 💾 -1] [Open & Capture 🔍 -1]        │ │
│ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### PDF Viewer with Capture
```
┌─────────────────────────────────────────────────────┐
│ 2023 Mid-Year Mathematics Exam      [Capture 📸]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ [PDF Content]                                 │   │
│ │                                               │   │
│ │   Question 3:                                 │   │
│ │   ┌────────────────────────┐                 │   │
│ │   │ Solve for x: 2x + 5 = │ ← Selection box  │   │
│ │   │                       │                  │   │
│ │   └────────────────────────┘                 │   │
│ │                                               │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ [Cancel]                    [Add to Review List]   │
└─────────────────────────────────────────────────────┘
```

### Capture Modal
```
┌─────────────────────────────────────────┐
│ Add Question to Review List             │
├─────────────────────────────────────────┤
│                                         │
│ Subject: [Mathematics    ▼] (auto)     │
│ Category: [Algebra       ▼]            │
│ Note: [____________________________]   │
│                                         │
│ [Cancel]                      [Save]   │
└─────────────────────────────────────────┘
```

## Testing Checklist

### Database
- [ ] Run SQL migration
- [ ] Verify `study_papers` table created
- [ ] Verify `study_credit_transactions` table created
- [ ] Verify `study_users.credits` column added
- [ ] Verify `study_questions.source_paper_id` column added

### Backend
- [ ] Upload paper endpoint works
- [ ] List papers endpoint works
- [ ] Download paper deducts credit
- [ ] Practice mode deducts credit
- [ ] Capture question creates review entry
- [ ] Credits are tracked in transactions table

### Frontend
- [ ] Sidebar shows "My Review" and "Paper Library"
- [ ] Credits display at bottom of sidebar
- [ ] Upload paper increments credits
- [ ] Download button works and shows credit cost
- [ ] "Open & Capture" button opens PDF viewer
- [ ] PDF viewer displays PDF correctly
- [ ] Capture tool allows selection
- [ ] CaptureModal saves question to review
- [ ] New question appears in Review page

### Integration
- [ ] Complete flow: Upload paper → Browse → Capture → Review
- [ ] Credits system works end-to-end
- [ ] Source paper link preserved in questions

## Dependencies to Install

### Backend
```bash
# No new dependencies needed (using existing Supabase Storage)
```

### Frontend
```bash
npm install react-pdf pdfjs-dist
npm install react-image-crop  # For capture tool (optional)
```

## Future Enhancements

1. **OCR for Captured Questions**
   - Auto-extract text from captured image using Azure Vision

2. **Community Features**
   - Like/favorite papers
   - Comments/ratings
   - Report inappropriate content

3. **Advanced Capture**
   - Multi-question capture
   - Batch capture mode
   - Auto-detect question boundaries

4. **Credits Marketplace**
   - Buy credits with real money
   - Credit packs and bundles
   - Subscription model

5. **Analytics**
   - Most downloaded papers
   - User contribution leaderboard
   - Paper quality scoring

---

**Next Steps:** Begin Phase 2 - Backend Services Implementation
