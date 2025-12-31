# AI Model Selection Feature - Setup Guide

This guide explains the new AI model selection feature that allows users to choose between GPT-4o and GPT-5 Chat for image analysis and AI explanations.

## Overview

Users can now select their preferred AI model from the Settings page. The selected model will be used for:
- **Image Analysis**: Extracting questions from uploaded exam papers
- **AI Explanations**: Generating step-by-step solutions for questions
- **Similar Questions**: Creating practice questions

**Default Model**: GPT-5 Chat (latest and most advanced)

## Backend Setup

### 1. Environment Variables

Add the following environment variables to your `backend/.env` file:

```env
# Existing GPT-4o configuration (keep these)
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com/
AZURE_OPENAI_API_KEY=your-gpt4o-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# New GPT-5 Chat configuration (add these)
AZURE_OPENAI_GPT5_ENDPOINT=your-gpt5-endpoint-here
AZURE_OPENAI_GPT5_API_KEY=your-gpt5-api-key-here
AZURE_OPENAI_GPT5_DEPLOYMENT_NAME=your-gpt5-deployment-name
AZURE_OPENAI_GPT5_API_VERSION=your-gpt5-api-version-here
```

**Important**: Replace the placeholder values with your actual GPT-5 Chat credentials:
- `AZURE_OPENAI_GPT5_ENDPOINT`: Your Azure OpenAI GPT-5 endpoint URL
- `AZURE_OPENAI_GPT5_API_KEY`: Your Azure OpenAI GPT-5 API key
- `AZURE_OPENAI_GPT5_DEPLOYMENT_NAME`: Your GPT-5 deployment name
- `AZURE_OPENAI_GPT5_API_VERSION`: Your GPT-5 API version

### 2. Database Migration

Run the SQL migration to add the `preferred_model` column to the `study_users` table:

**Option 1: Using Supabase SQL Editor**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `backend/migrations/add_preferred_model_column.sql`
4. Execute the SQL

**Option 2: Using psql command line**
```bash
psql "your-supabase-connection-string" -f backend/migrations/add_preferred_model_column.sql
```

The migration will:
- Add a `preferred_model` column with default value `'gpt-5-chat'`
- Add a constraint to ensure only valid values (`'gpt-4o'` or `'gpt-5-chat'`)
- Update existing users to use GPT-5 Chat as default

### 3. Restart Backend Server

After adding environment variables, restart your FastAPI backend:

```bash
cd backend
python main.py
```

## Frontend Setup

No additional frontend configuration needed! The changes are already integrated.

## Architecture Changes

### Backend Changes

1. **Config (`backend/app/config.py`)**:
   - Added GPT-5 environment variable settings
   - Both GPT-4o and GPT-5 clients are initialized

2. **AI Service (`backend/app/services/azure_ai_service.py`)**:
   - Dual client architecture (GPT-4o and GPT-5)
   - New `get_client_and_deployment()` method to select appropriate client
   - All AI methods now accept optional `model` parameter (defaults to `"gpt-5-chat"`)

3. **Schemas (`backend/app/schemas.py`)**:
   - Added `preferred_model` field to `UserResponse` and `UserUpdate`
   - New `ModelUpdateRequest` schema

4. **Auth Router (`backend/app/routers/auth.py`)**:
   - New `PUT /auth/model` endpoint to update user's preferred model
   - Validates model choice (must be `'gpt-4o'` or `'gpt-5-chat'`)

5. **Questions Router (`backend/app/routers/questions.py`)**:
   - All AI operations now use `current_user.get('preferred_model', 'gpt-5-chat')`
   - Applies to: upload, capture, regenerate, and similar questions

### Frontend Changes

1. **API Service (`src/services/api.js`)**:
   - New `updateUserModel()` function to call `/auth/model` endpoint

2. **Settings Component (`src/components/Settings.js`)**:
   - New "AI Model Preferences" section
   - Radio button selection between GPT-4o and GPT-5 Chat
   - Clear descriptions for each model
   - Save and reload on model change

## User Experience

### How Users Select Their Model

1. Navigate to **Settings** tab in Dashboard
2. Scroll to **AI Model Preferences** section
3. Choose between:
   - **GPT-5 Chat (Default, Latest)**: Most advanced model with superior reasoning
   - **GPT-4o**: Previous generation model
4. Click **Save AI Model**
5. Page reloads with new preference

### When Model Choice Applies

The selected model is used for:
- ✅ **Question Paper Analysis**: When uploading exam images
- ✅ **AI Explanations**: When generating explanations for wrong questions
- ✅ **Regenerate Explanations**: When clicking regenerate button
- ✅ **Similar Questions**: When generating practice questions
- ✅ **Quick Capture**: When capturing questions from PDF papers

## Database Schema

### New Column: `study_users.preferred_model`

```sql
Column: preferred_model
Type: VARCHAR(20)
Default: 'gpt-5-chat'
Constraint: CHECK (preferred_model IN ('gpt-4o', 'gpt-5-chat'))
```

## API Endpoints

### New Endpoint: Update Preferred Model

```http
PUT /auth/model
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferred_model": "gpt-5-chat"  // or "gpt-4o"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "grade": "sec1",
  "preferred_model": "gpt-5-chat",
  "created_at": "2024-01-01T00:00:00"
}
```

## Testing Checklist

After setup, verify the following:

### Backend Tests
- [ ] Backend starts without errors
- [ ] Both GPT-4o and GPT-5 clients initialize successfully
- [ ] Database migration completed successfully
- [ ] `GET /auth/me` returns `preferred_model` field
- [ ] `PUT /auth/model` successfully updates model preference

### Frontend Tests
- [ ] Settings page loads without errors
- [ ] AI Model Preferences section displays correctly
- [ ] Can select GPT-5 Chat (default should be selected)
- [ ] Can select GPT-4o
- [ ] Save button updates preference
- [ ] Page reloads after save

### Integration Tests
- [ ] Upload new question paper - verify selected model is used
- [ ] Generate explanation - verify selected model is used
- [ ] Regenerate explanation - verify selected model is used
- [ ] Switch models and verify change takes effect

### Model Verification
To verify which model is being used, check backend logs during operations:
```
Using model: gpt-5-chat
Using deployment: your-gpt5-deployment-name
```

## Troubleshooting

### Error: "Supabase not initialized" or connection errors
- Verify `AZURE_OPENAI_GPT5_*` environment variables are set correctly
- Restart backend server after adding variables

### Error: "Invalid model"
- Ensure only `'gpt-4o'` or `'gpt-5-chat'` are used
- Check database constraint is applied correctly

### Model selection not saving
- Check browser console for errors
- Verify `/auth/model` endpoint is accessible
- Check JWT token is valid

### Wrong model being used
- Clear browser localStorage and re-login
- Check `preferred_model` value in database
- Verify backend is reading `current_user.get('preferred_model')`

## Migration Notes for Existing Users

All existing users will automatically:
1. Have `preferred_model` set to `'gpt-5-chat'` (default)
2. See GPT-5 Chat selected in Settings
3. Use GPT-5 Chat for all AI operations (unless they change it)

No manual intervention required for existing users.

## Cost Considerations

Different models have different pricing:
- **GPT-5 Chat**: Higher cost per token, but superior quality
- **GPT-4o**: Lower cost per token, previous generation

The Usage dashboard tracks token consumption for both models combined.

## Future Enhancements

Potential improvements:
- Model selection per upload (not just global preference)
- Cost estimation before operations
- A/B testing different models
- Fine-tuned custom models
- Model performance analytics

---

## Quick Start Summary

1. Add GPT-5 environment variables to `backend/.env`
2. Run database migration in Supabase SQL Editor
3. Restart backend: `python main.py`
4. Test: Login → Settings → Select model → Save
5. Verify: Upload a question paper and check which model is used

**That's it!** Users can now choose their preferred AI model for all explanations and image analysis.
