# Debug: Google OAuth 400 Error - "Unable to Issue Token"

## Error Messages You're Seeing

```
1. "When fetching the id assertion endpoint, a 400 HTTP response code was received"
2. "Provider is unable to issue a token, but provided details on the error"
3. "[GSI_LOGGER]: FedCM get() rejects with IdentityCredentialError: Error retrieving a token"
```

## What This Means

A **400 Bad Request** from Google OAuth means:
- ❌ Your request to Google is malformed or rejected
- ❌ Something is wrong in your Google Cloud Console configuration
- ❌ Google cannot issue a token because of a configuration mismatch

## 🔍 Step-by-Step Debugging

### Step 1: Verify Your Google Cloud Console Setup

#### A. Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Make sure you're in the **correct project**
3. Go to: **APIs & Services** → **Credentials**

#### B. Check Your OAuth 2.0 Client ID

Click on your OAuth 2.0 Client ID and verify:

**1. Application Type**
- ✅ Must be: **Web application**
- ❌ NOT: Desktop app, iOS app, Android app

**2. Authorized JavaScript origins**
```
http://localhost:3000
http://localhost
```
⚠️ **Must be exactly these** (no trailing slashes, no port variations)

**3. Authorized redirect URIs**
```
http://localhost:3000
```
⚠️ **Must match exactly** (case-sensitive, no trailing slash)

#### C. Check OAuth Consent Screen

Go to: **APIs & Services** → **OAuth consent screen**

**1. User Type**
- If "Internal" → Only works for your Google Workspace organization users
- If "External" → Works for any Google account ✅

**2. Publishing Status**
- If "Testing" → Only test users can sign in
- If "In Production" → Anyone can sign in ✅

**3. Test Users (if in Testing mode)**
- Add your Google account email to test users list
- Click **+ ADD USERS**
- Enter your email address

### Step 2: Verify Your Client ID in Code

**Check `.env.local` file:**
```bash
# Windows Command Prompt
type .env.local

# PowerShell
Get-Content .env.local
```

Look for:
```env
REACT_APP_GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
```

**Verify it matches Google Cloud Console:**
1. Copy the Client ID from Google Cloud Console
2. Compare with `.env.local`
3. They must be **exactly the same**

### Step 3: Common Configuration Mistakes

#### ❌ Mistake 1: Wrong Authorized JavaScript Origins
```
❌ Wrong: http://localhost:3000/
❌ Wrong: https://localhost:3000
❌ Wrong: http://127.0.0.1:3000
✅ Correct: http://localhost:3000
```

#### ❌ Mistake 2: Missing Redirect URI
You must have **both**:
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000`

#### ❌ Mistake 3: App in Testing Mode
If OAuth consent screen is in "Testing" mode:
- Only added test users can sign in
- Solution: Add your email as test user OR publish the app

#### ❌ Mistake 4: Wrong Client ID Type
- Must be "Web application" type
- NOT "iOS", "Android", or "Desktop" type

#### ❌ Mistake 5: Client ID Mismatch
- `.env.local` Client ID doesn't match Google Cloud Console
- Copy-paste error with extra spaces or characters

### Step 4: Check Browser Console for Details

Open browser DevTools (F12) and check:

**Console Tab:**
Look for detailed error messages with more info

**Network Tab:**
1. Filter by: `accounts.google.com`
2. Click on failed request
3. Look at "Response" tab for error details

Common error responses:
```json
{
  "error": "redirect_uri_mismatch",
  "error_description": "The redirect URI provided does not match..."
}
```

```json
{
  "error": "unauthorized_client",
  "error_description": "The OAuth client was not found."
}
```

### Step 5: Correct Configuration Example

Here's what a correct setup looks like:

**Google Cloud Console → Credentials → OAuth 2.0 Client**

```
Name: My Web App
Application type: Web application

Authorized JavaScript origins:
  http://localhost:3000
  http://localhost

Authorized redirect URIs:
  http://localhost:3000

(No other entries needed for local development)
```

**OAuth Consent Screen:**
```
User Type: External
Publishing status: Testing
Test users: your-email@gmail.com (added)
```

**.env.local:**
```env
REACT_APP_GOOGLE_CLIENT_ID=123456789-abc123xyz.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=xxx
```

## 🔧 Fixes to Try (In Order)

### Fix 1: Double-Check JavaScript Origins
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Under "Authorized JavaScript origins":
   - Remove any entries with trailing slashes
   - Remove any HTTPS entries for localhost
   - Ensure you have: `http://localhost:3000`
4. Click **SAVE**
5. **Wait 5 minutes** (changes take time to propagate)
6. Restart your dev server
7. Clear browser cache
8. Try again

### Fix 2: Add Yourself as Test User
1. Go to: APIs & Services → OAuth consent screen
2. Click "ADD USERS" under Test users
3. Enter your Google account email
4. Click **SAVE**
5. Try logging in with that email

### Fix 3: Verify Client ID
1. Copy Client ID from Google Cloud Console
2. Open `.env.local`
3. Replace the entire `REACT_APP_GOOGLE_CLIENT_ID` value
4. Save file
5. Restart dev server: `npm start`
6. Hard refresh browser: `Ctrl+Shift+R`

### Fix 4: Create New OAuth Client
Sometimes the existing client is corrupted:

1. Go to Google Cloud Console → Credentials
2. Click "+ CREATE CREDENTIALS"
3. Select "OAuth client ID"
4. Application type: **Web application**
5. Name: "Student Review App - Web"
6. Authorized JavaScript origins:
   - Add: `http://localhost:3000`
   - Add: `http://localhost`
7. Authorized redirect URIs:
   - Add: `http://localhost:3000`
8. Click **CREATE**
9. Copy the **Client ID**
10. Update `.env.local` with new Client ID
11. Restart dev server

### Fix 5: Publish the App (Remove Testing Restrictions)
1. Go to: APIs & Services → OAuth consent screen
2. Click "PUBLISH APP" button
3. Confirm publishing
4. Now anyone with a Google account can sign in

## 🧪 Testing Procedure

After making changes:

```bash
# 1. Stop dev server
Ctrl+C

# 2. Clear cache
rm -rf node_modules/.cache         # Mac/Linux
rmdir /s node_modules\.cache       # Windows

# 3. Restart server
npm start

# 4. Clear browser data
Press Ctrl+Shift+Delete
- Select "Cookies and other site data"
- Select "Cached images and files"
- Time range: "All time"
- Click "Clear data"

# 5. Hard refresh
Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# 6. Test login
- Visit http://localhost:3000
- Click "Get Started"
- Click "Continue with Google"
- Select your account
```

## 📋 Configuration Checklist

Mark each item as you verify:

**Google Cloud Console:**
- [ ] Project selected (correct project name at top)
- [ ] OAuth client type is "Web application"
- [ ] Authorized JavaScript origins: `http://localhost:3000`
- [ ] Authorized JavaScript origins: `http://localhost` (optional but recommended)
- [ ] Authorized redirect URIs: `http://localhost:3000`
- [ ] Changes saved (clicked SAVE button)
- [ ] Waited 5+ minutes after saving

**OAuth Consent Screen:**
- [ ] User Type is "External" (or "Internal" if G Suite)
- [ ] If Testing: Your email added to test users
- [ ] If Testing: You're signing in with a test user email
- [ ] App name and email configured

**Local Environment:**
- [ ] `.env.local` file exists in project root
- [ ] `REACT_APP_GOOGLE_CLIENT_ID` matches Console Client ID exactly
- [ ] No extra spaces or quotes in Client ID
- [ ] Dev server restarted after changing `.env.local`

**Browser:**
- [ ] Cache cleared (Ctrl+Shift+Delete)
- [ ] Third-party cookies enabled for google.com
- [ ] Popup blocker disabled for localhost
- [ ] Testing in regular window (not incognito)
- [ ] Tried different browser (Chrome, Firefox, Edge)

## 🎯 Most Likely Causes (Based on 400 Error)

**Top 5 reasons for 400 error:**

1. **Missing or incorrect Authorized JavaScript origins** (90% of cases)
   - Fix: Add `http://localhost:3000` to JavaScript origins

2. **App in Testing mode without test users**
   - Fix: Add your email to test users OR publish the app

3. **Wrong Client ID in .env.local**
   - Fix: Copy-paste from Console, restart server

4. **Client is not "Web application" type**
   - Fix: Create new OAuth client with correct type

5. **Changes not propagated yet**
   - Fix: Wait 5-10 minutes after saving changes

## 🔍 Advanced Debugging

### Check the Actual Network Request

1. Open DevTools (F12)
2. Go to **Network** tab
3. Check "Preserve log"
4. Try to login
5. Look for requests to `accounts.google.com`
6. Click on the failed request
7. Check the **Response** tab

Common error responses and fixes:

**Error: `redirect_uri_mismatch`**
```
Fix: Add exact redirect URI to Google Console
Add: http://localhost:3000
```

**Error: `invalid_client`**
```
Fix: Client ID is wrong or doesn't exist
- Verify Client ID in .env.local matches Console
- Check you're using the Web application client
```

**Error: `unauthorized_client`**
```
Fix: OAuth consent screen not configured properly
- Complete OAuth consent screen setup
- Add required scopes
```

**Error: `access_denied`**
```
Fix: User not authorized
- If Testing mode: Add email to test users
- OR: Publish the app
```

## 📞 Still Stuck?

If none of these work, provide:

1. **Screenshot of Google Cloud Console:**
   - Credentials page showing your OAuth client
   - Authorized JavaScript origins section
   - Authorized redirect URIs section

2. **Screenshot of OAuth Consent Screen:**
   - User Type
   - Publishing Status
   - Test users (if any)

3. **Console Errors:**
   - Full error message from browser console
   - Network tab showing failed request details

4. **Your Configuration:**
   ```
   Browser: Chrome/Firefox/Edge/Safari
   OS: Windows/Mac/Linux
   Testing URL: http://localhost:3000 or other?
   ```

## Summary

**The 400 error means Google is rejecting your OAuth request.**

**Most common fix:**
1. Add `http://localhost:3000` to Authorized JavaScript origins
2. Add `http://localhost:3000` to Authorized redirect URIs
3. If Testing mode: Add your email to test users
4. Wait 5 minutes for changes to propagate
5. Restart dev server
6. Clear browser cache
7. Try again

**99% of the time, this is a Google Cloud Console configuration issue, not a code issue.**








