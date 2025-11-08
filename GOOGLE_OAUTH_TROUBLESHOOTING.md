# Google OAuth Login Troubleshooting

## Error: "Can't continue with google.com - Something went wrong"

This error occurs when Google OAuth is not properly configured. Follow these steps to fix it.

## Solution Steps

### 1. Open Google Cloud Console

Go to: https://console.cloud.google.com/

### 2. Select Your Project

Make sure you're in the correct project (the one where you created OAuth credentials).

### 3. Navigate to Credentials

1. Click **☰ Menu** (top-left)
2. Go to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID
4. Click the **pencil icon** (Edit) next to it

### 4. Configure Authorized JavaScript Origins

In the "Authorized JavaScript origins" section, click **+ ADD URI** and add:

```
http://localhost:3000
```

Also add (for better compatibility):
```
http://localhost
http://127.0.0.1:3000
```

**Screenshot location**: Near the middle of the page, labeled "Authorized JavaScript origins"

### 5. Configure Authorized Redirect URIs

In the "Authorized redirect URIs" section, click **+ ADD URI** and add:

```
http://localhost:3000
```

Also add:
```
http://localhost:3000/
http://127.0.0.1:3000
```

### 6. Save Changes

1. Click **SAVE** button at the bottom
2. Wait 5-10 minutes for changes to propagate
3. Clear your browser cache or use incognito/private mode
4. Try logging in again

## Verify Your Setup

After saving, verify these settings are correct:

**Your Client ID (from `.env.local`):**
```
1070955723701-89h4gd8gt10l16blj5kg3ga5fo4bks02.apps.googleusercontent.com
```

**Authorized JavaScript origins should include:**
- ✅ http://localhost:3000
- ✅ http://localhost
- ✅ http://127.0.0.1:3000

**Authorized redirect URIs should include:**
- ✅ http://localhost:3000
- ✅ http://localhost:3000/

## Common Mistakes

### ❌ Wrong Origins
```
https://localhost:3000  ← WRONG (https instead of http)
localhost:3000          ← WRONG (missing http://)
http://localhost:3000/  ← Works but / not needed for origins
```

### ✅ Correct Origins
```
http://localhost:3000   ← CORRECT
http://localhost        ← CORRECT
http://127.0.0.1:3000   ← CORRECT
```

## Still Not Working?

### Try These Steps:

1. **Clear Browser Cache**
   - Chrome: Ctrl+Shift+Delete → Clear all
   - Or use Incognito mode (Ctrl+Shift+N)

2. **Check OAuth Consent Screen**
   - Go to **APIs & Services** → **OAuth consent screen**
   - Make sure it's configured (even for testing)
   - User type: "External" is fine for testing
   - Add your email as a test user

3. **Verify Client ID in Frontend**

   Check `.env.local`:
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=1070955723701-89h4gd8gt10l16blj5kg3ga5fo4bks02.apps.googleusercontent.com
   ```

4. **Restart Frontend**
   ```bash
   # Stop the frontend (Ctrl+C)
   # Start again
   npm start
   ```

5. **Check for Errors in Console**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for red error messages
   - Share them if you need help

## Advanced Debugging

### Check Network Requests

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try logging in
4. Look for failed requests (red)
5. Click on them to see error details

### Common Error Messages

**"redirect_uri_mismatch"**
- Your redirect URIs aren't configured correctly
- Add all the URIs listed above

**"invalid_client"**
- Client ID might be wrong
- Check `.env.local` matches Google Console

**"access_denied"**
- User canceled login, or
- App not verified for this user

## Production Setup

When deploying to production, also add:

**Authorized JavaScript origins:**
```
https://your-app.vercel.app
https://www.your-app.vercel.app
```

**Authorized redirect URIs:**
```
https://your-app.vercel.app
https://your-app.vercel.app/
```

## Testing Checklist

- [ ] Credentials created in Google Cloud Console
- [ ] OAuth consent screen configured
- [ ] Authorized JavaScript origins include http://localhost:3000
- [ ] Authorized redirect URIs include http://localhost:3000
- [ ] Client ID copied to `.env.local`
- [ ] Client Secret copied to `backend/.env`
- [ ] Frontend restarted after .env changes
- [ ] Tried in incognito/private mode
- [ ] Waited 5-10 minutes after saving changes

## Need More Help?

1. **Screenshot your Google Cloud Console settings**
   - Go to your OAuth credentials
   - Take screenshot of the "Authorized JavaScript origins" section
   - Take screenshot of the "Authorized redirect URIs" section

2. **Check browser console errors**
   - F12 → Console tab
   - Screenshot any red errors

3. **Verify environment variables**
   ```bash
   # Check frontend .env.local exists
   type .env.local

   # Check backend .env exists
   type backend\.env
   ```

---

**After following these steps**, your Google login should work! 🎉

The most common issue is missing `http://localhost:3000` from Authorized JavaScript origins.
