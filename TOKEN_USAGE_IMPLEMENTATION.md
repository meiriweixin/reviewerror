# Token Usage Tracking Implementation

## Overview
Added comprehensive token usage tracking to monitor AI consumption across the Student Review App. The system tracks tokens used by Azure OpenAI GPT-4o Vision and embeddings, stores them in Supabase, and displays statistics in a new Usage dashboard.

## Implementation Summary

### 1. Database Schema Changes

**File**: `add_token_tracking.sql`

Added columns to `study_users` table:
- `total_tokens_used` - Total tokens consumed
- `prompt_tokens_used` - Input/prompt tokens
- `completion_tokens_used` - Output/completion tokens
- `last_token_update` - Timestamp of last update

**To Apply**: Run the SQL script in Supabase SQL Editor:
```bash
# Execute in Supabase Dashboard > SQL Editor
add_token_tracking.sql
```

### 2. Backend Changes

#### AI Service Updates (`backend/app/services/azure_ai_service.py`)

All AI methods now return token usage information:

- `analyze_question_paper()` - Returns dict with `tokens_used` key
- `explain_question()` - Returns tuple: `(explanation, tokens_used)`
- `generate_embedding()` - Returns tuple: `(embedding, tokens_used)`

Token usage extracted from Azure OpenAI API responses:
```python
tokens_used = {
    "prompt_tokens": response.usage.prompt_tokens,
    "completion_tokens": response.usage.completion_tokens,
    "total_tokens": response.usage.total_tokens
}
```

#### Database Service Updates (`backend/app/services/supabase_db_service.py`)

New methods added:

- `add_token_usage(user_id, prompt_tokens, completion_tokens, total_tokens)` - Increments user's token count
- `get_user_token_usage(user_id)` - Returns user's token statistics

#### Router Updates

**`backend/app/routers/questions.py`**:
- Upload endpoint tracks tokens from image analysis, explanation generation, and embeddings
- Regenerate endpoint tracks tokens from explanation generation
- Both call `supabase_db.add_token_usage()` after AI operations

**`backend/app/routers/usage.py`** (NEW):
- `GET /usage/tokens` - Returns current user's token usage stats

**`backend/main.py`**:
- Added usage router: `app.include_router(usage.router, prefix="/usage", tags=["Usage"])`

### 3. Frontend Changes

#### API Service (`src/services/api.js`)

Added new API function:
```javascript
export const getTokenUsage = async () => {
  const response = await api.get('/usage/tokens');
  return response.data;
};
```

#### Usage Component (`src/components/Usage.js`) - NEW

Beautiful dashboard displaying:

**Stats Cards**:
- Total Tokens (blue gradient)
- Input Tokens (green gradient)
- Output Tokens (purple gradient)
- Estimated Cost (orange gradient)

**Details Section**:
- User email
- Last token update timestamp
- Breakdown of all token types

**Info Section**:
- Explanation of token usage
- Tips to reduce consumption
- Pricing information

**Cost Calculation**:
- Based on GPT-4o pricing: $5 per 1M input tokens, $15 per 1M output tokens
- Real-time cost estimation

#### Dashboard Integration (`src/components/Dashboard.tsx`)

Added Usage tab:
- Import: `import Usage from './Usage';`
- Import icon: `import { Activity } from 'lucide-react';`
- Menu item: `{ id: 'usage', label: 'Usage', icon: Activity }`
- Render: `{activeTab === 'usage' && <Usage user={user} />}`

### 4. Token Tracking Flow

**Upload Flow**:
```
User uploads image
  ↓
analyze_question_paper() → tokens tracked
  ↓
For each question:
  - explain_question() → tokens tracked
  - generate_embedding() → tokens tracked
  ↓
Total tokens calculated
  ↓
add_token_usage() saves to database
```

**Regenerate Flow**:
```
User clicks regenerate
  ↓
explain_question() → tokens tracked
  ↓
add_token_usage() saves to database
```

## API Endpoints

### GET /usage/tokens
**Description**: Get current user's token usage statistics

**Authentication**: Required (JWT Bearer token)

**Response**:
```json
{
  "user_id": 1,
  "user_email": "user@example.com",
  "total_tokens_used": 15234,
  "prompt_tokens_used": 8456,
  "completion_tokens_used": 6778,
  "last_token_update": "2024-11-18T10:30:00Z"
}
```

### GET /usage/tokens/all
**Description**: Get system-wide token usage across all users

**Authentication**: Required (JWT Bearer token)

**Response**:
```json
{
  "total_tokens": 125234,
  "total_prompt_tokens": 68456,
  "total_completion_tokens": 56778,
  "total_users": 5,
  "users": [
    {
      "user_id": 3,
      "email": "user3@example.com",
      "name": "John Doe",
      "total_tokens_used": 45000,
      "prompt_tokens_used": 25000,
      "completion_tokens_used": 20000,
      "last_token_update": "2024-11-18T15:30:00Z"
    },
    {
      "user_id": 1,
      "email": "user1@example.com",
      "name": "Jane Smith",
      "total_tokens_used": 35000,
      "prompt_tokens_used": 18000,
      "completion_tokens_used": 17000,
      "last_token_update": "2024-11-18T14:20:00Z"
    }
  ]
}
```

**Note**: Users are sorted by total_tokens_used in descending order.

## Testing Checklist

- [ ] Run SQL migration in Supabase to add token columns
- [ ] Upload an exam paper and verify tokens are tracked
- [ ] Check Usage dashboard displays correct statistics
- [ ] Regenerate explanation and verify tokens increment
- [ ] Verify cost calculation is accurate
- [ ] Test with multiple uploads to see cumulative totals

## Cost Estimation

The system uses GPT-4o pricing (as of Nov 2024):
- Input tokens: $5.00 per 1M tokens
- Output tokens: $15.00 per 1M tokens

Example calculation:
- 10,000 input tokens = $0.05
- 5,000 output tokens = $0.075
- **Total**: $0.125

## Future Enhancements

Potential improvements:
1. **Usage History**: Track token usage over time with daily/weekly/monthly breakdowns
2. **Usage Alerts**: Notify users when approaching token limits
3. **Cost Limits**: Set budget caps and warn users
4. **Per-Subject Tracking**: Show which subjects consume most tokens
5. **Export Reports**: Download usage reports as CSV/PDF
6. **Admin Dashboard**: View all users' token consumption (if multi-tenant)
7. **Token Quota System**: Implement fair usage policies

## Files Modified

**Backend**:
- `backend/app/services/azure_ai_service.py` - Return token usage
- `backend/app/services/supabase_db_service.py` - Token tracking methods
- `backend/app/routers/questions.py` - Track tokens on upload/regenerate
- `backend/app/routers/usage.py` - NEW: Usage stats endpoint
- `backend/main.py` - Register usage router

**Frontend**:
- `src/services/api.js` - Add getTokenUsage() function
- `src/components/Usage.js` - NEW: Usage dashboard component
- `src/components/Dashboard.tsx` - Add Usage tab

**Database**:
- `add_token_tracking.sql` - NEW: Schema migration

## Notes

- Token tracking is non-blocking - failures are logged but don't stop operations
- All token counts start at 0 for existing users
- Tokens are tracked immediately after each AI operation
- The Usage dashboard loads data in real-time from Supabase
- Cost estimates are approximate based on current Azure OpenAI pricing
