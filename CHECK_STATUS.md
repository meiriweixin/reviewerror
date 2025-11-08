# Setup Status Checklist

Use this to verify everything is configured correctly.

## ✅ Completed

- [x] Frontend dependencies installed (`npm install`)
- [x] Backend dependencies installed (`pip install -r requirements.txt`)
- [x] Backend `.env` file created and configured
- [x] Frontend `.env.local` file created
- [x] Backend server running (http://localhost:8000)
- [x] Frontend server running (http://localhost:3000)
- [x] Google OAuth credentials created
- [x] **Google OAuth authorized origins added** ✨ (Just done!)
- [x] Database created (SQLite)
- [x] Manifest.json created

## ⏳ Waiting (5-10 minutes)

- [ ] Google OAuth changes propagated
- [ ] Browser cache cleared
- [ ] Login tested

## ⚠️ Optional (Can Add Later)

- [ ] Supabase service role key (for vector search)
- [ ] Test image upload
- [ ] Test question extraction

## Current Status

### Backend
- **Status**: ✅ Running
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: SQLite (created automatically)
- **Warnings**: Supabase not configured (vector search disabled - OK for now)

### Frontend
- **Status**: ✅ Running
- **URL**: http://localhost:3000
- **Google OAuth**: ⏳ Waiting for changes to propagate (5-10 min)

### Services Configuration

| Service | Status | Notes |
|---------|--------|-------|
| Google OAuth | ⏳ Configured, waiting | Just added origins, wait 5-10 min |
| Azure OpenAI | ✅ Configured | API key added |
| Supabase | ⚠️ Partial | URL and anon key added, service role key missing |
| Database | ✅ Working | SQLite created automatically |

## What Works Right Now

✅ **Without Login:**
- View login page
- See app interface

✅ **After Login Works (in 5-10 min):**
- Login with Google
- Select grade
- View dashboard
- Upload images (with Azure OpenAI)
- Review questions
- Track progress

❌ **Not Working Yet:**
- Semantic/vector search (needs Supabase service role key)

## Next Actions

### Immediate (Now)
1. ⏰ Wait 5-10 minutes for Google OAuth changes
2. 🧹 Clear browser cache or use incognito mode
3. 🔐 Try logging in at http://localhost:3000

### Later (Optional)
1. Get Supabase service role key from: https://supabase.com/dashboard
2. Add to `backend/.env`: `SUPABASE_SERVICE_ROLE_KEY=eyJhbG...`
3. Restart backend
4. Vector search will work

## Testing Checklist (After Login Works)

- [ ] Login with Google
- [ ] Select grade (e.g., Secondary 1)
- [ ] Reach dashboard
- [ ] Navigate between tabs (Upload, Review, Progress, Settings)
- [ ] Try uploading an image (needs clear question marks)
- [ ] View extracted questions (if any)
- [ ] Change question status (Pending → Reviewing → Understood)
- [ ] Check progress page

## Troubleshooting

### Login Still Not Working After 10 Minutes?

1. **Verify you clicked Save** in Google Cloud Console
2. **Check Client ID matches**:
   ```bash
   # Check .env.local
   type .env.local | findstr GOOGLE_CLIENT_ID

   # Should show: 1070955723701-89h4gd8gt10l16blj5kg3ga5fo4bks02
   ```
3. **Try different browser** or incognito
4. **Check console** (F12) for errors
5. **Restart frontend**:
   ```bash
   # Stop with Ctrl+C
   npm start
   ```

### Backend Errors?

```bash
# Check if running
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

### Frontend Errors?

- Check http://localhost:3000 loads
- Check console (F12) for errors
- Verify `proxy` in package.json: `"proxy": "http://localhost:8000"`

## Success Indicators

**You'll know it's working when:**
1. ✅ No "origin is not allowed" error in console
2. ✅ Google login popup appears
3. ✅ You can select your Google account
4. ✅ You're redirected to grade selection
5. ✅ You can navigate the dashboard

## Estimated Time to Full Setup

- ✅ Initial setup: **Done!** (~30 minutes)
- ⏳ Google OAuth propagation: **5-10 minutes**
- ⏳ Testing: **5 minutes**
- **Total**: ~45 minutes (almost there! ⏰)

---

**Current Step**: Waiting for Google OAuth changes to propagate (5-10 min)

**Next Step**: Clear cache and try logging in

**You're 95% done!** 🎉
