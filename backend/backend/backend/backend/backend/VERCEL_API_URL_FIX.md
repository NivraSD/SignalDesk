# CRITICAL: Fix Vercel API URL Configuration

## Problem
The Vercel frontend at https://frontend-p0rvzi1f9-nivra-sd.vercel.app is using the WRONG API URL:
- ❌ **WRONG:** `https://signaldesk-api-production.up.railway.app`
- ✅ **CORRECT:** `https://signaldesk-production.up.railway.app`

## Root Cause
Vercel has an environment variable that's overriding our code changes. Even though we've updated all the code files, Vercel's environment variable takes precedence during the build process.

## Solution Steps

### Option 1: Fix via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Log in with your account

2. **Select Your Project**
   - Find and click on: `frontend-p0rvzi1f9-nivra-sd` or your SignalDesk project

3. **Navigate to Environment Variables**
   - Click on "Settings" tab
   - Click on "Environment Variables" in the left sidebar

4. **Find and Update REACT_APP_API_URL**
   - Look for: `REACT_APP_API_URL`
   - Current (WRONG) value: `https://signaldesk-api-production.up.railway.app/api`
   - Change to (CORRECT): `https://signaldesk-production.up.railway.app/api`
   - Make sure it's set for: Production, Preview, and Development

5. **Save Changes**
   - Click "Save" button

6. **Trigger a Clean Redeploy**
   - Go to "Deployments" tab
   - Find the latest deployment
   - Click the three dots menu (⋮)
   - Click "Redeploy"
   - **IMPORTANT:** Uncheck "Use existing Build Cache"
   - Click "Redeploy"

### Option 2: Fix via Vercel CLI

1. **Install Vercel CLI** (if not installed)
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**
   ```bash
   cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
   ```

4. **Remove old environment variable**
   ```bash
   vercel env rm REACT_APP_API_URL production
   ```

5. **Add correct environment variable**
   ```bash
   vercel env add REACT_APP_API_URL production
   ```
   When prompted, enter: `https://signaldesk-production.up.railway.app/api`

6. **Force redeploy**
   ```bash
   vercel --prod --force
   ```

### Option 3: Use Our Force Rebuild Script

We've created a script that will help force the correct URL:

```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
./force-vercel-rebuild.sh
```

## Verification

After redeployment, verify the fix:

1. **Open the deployed site**: https://frontend-p0rvzi1f9-nivra-sd.vercel.app

2. **Open browser console** (F12 or right-click → Inspect → Console)

3. **Copy and paste this verification code**:
   ```javascript
   // Check what URL is being used
   console.log("Current API URL:", window.SIGNALDESK_API_URL);
   
   // Make a test request
   fetch('https://signaldesk-production.up.railway.app/api/health')
     .then(res => console.log('✅ Correct API is working:', res.status))
     .catch(err => console.error('❌ API error:', err));
   ```

4. **Check Network tab**
   - Go to Network tab in DevTools
   - Refresh the page
   - Look at API calls - they should all go to `signaldesk-production.up.railway.app`
   - NOT to `signaldesk-api-production.up.railway.app`

## Code Changes Made

We've updated the code to be more aggressive about using the correct URL:

1. **`/frontend/src/config/api.js`**: 
   - Now forces the correct URL even if Vercel sets the wrong one
   - Detects and overrides the incorrect URL
   - Stores correct URL in `window.SIGNALDESK_API_URL`

2. **`/frontend/src/services/apiService.js`**:
   - Added multiple safeguards to ensure correct URL
   - Checks and corrects the URL at multiple points
   - Stores verified URL in the service instance

3. **`/frontend/vercel.json`**:
   - Already has correct URL in build settings
   - But this is overridden by dashboard environment variables

## Why This Keeps Happening

Vercel's environment variable precedence order:
1. **Dashboard Environment Variables** (highest priority) ← This is overriding everything
2. Project vercel.json settings
3. .env files in the repository
4. Code defaults

Since the Dashboard has the wrong URL, it overrides all our code changes during build time.

## Permanent Fix

After following the steps above, the issue should be permanently resolved. The environment variable in Vercel's dashboard will be correct, and future deployments will use the right API URL.

## Emergency Workaround

If you need an immediate fix without changing Vercel settings, we've made the code force the correct URL regardless of environment variables. Just redeploy the current code and it should override the wrong URL at runtime.

## Contact for Help

If you continue to have issues:
1. Check Vercel's build logs for any errors
2. Verify the Railway backend is running at: https://signaldesk-production.up.railway.app
3. Ensure CORS is properly configured on the backend for the frontend URL