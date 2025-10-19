# Supabase + Vercel Deployment Fix Guide

## Issues Identified and Fixed

### 1. **Critical: Supabase SDK in Wrong Dependencies Section**
**Problem:** `@supabase/supabase-js` was in `devDependencies` instead of `dependencies`
**Impact:** Supabase SDK wasn't installed in production builds
**Fix Applied:** Moved to `dependencies` in package.json

### 2. **Missing Environment Variables in Vercel**
**Problem:** Supabase credentials not configured in Vercel platform
**Impact:** Runtime errors when trying to connect to Supabase
**Fix Applied:** Created setup script and updated vercel.json

### 3. **No Supabase Health Check API Route**
**Problem:** No way to verify Supabase integration in deployment
**Impact:** Difficult to debug connection issues
**Fix Applied:** Created `/api/supabase-check.js` endpoint

### 4. **Edge Functions Not Deployed**
**Problem:** Supabase Edge Functions exist but aren't deployed
**Impact:** Backend functionality missing
**Fix Applied:** Deployment script provided

## Deployment Steps

### Step 1: Install Dependencies Locally
```bash
cd frontend
npm install
```

### Step 2: Set Up Vercel Environment
```bash
# Run the setup script
./setup-vercel-env.sh

# Or manually set variables
vercel env add REACT_APP_SUPABASE_URL production preview development
vercel env add REACT_APP_SUPABASE_ANON_KEY production preview development
```

### Step 3: Deploy Supabase Edge Functions
```bash
cd frontend/supabase
./deploy-functions.sh
```

### Step 4: Deploy to Vercel
```bash
cd frontend
vercel --prod --force
```

### Step 5: Verify Deployment
```bash
node verify-supabase-deployment.js
```

## Environment Variables Required

| Variable | Value | Scope |
|----------|-------|-------|
| `REACT_APP_SUPABASE_URL` | `https://zskaxjtyuaqazydouifp.supabase.co` | All |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | All |
| `CI` | `false` | Build |
| `GENERATE_SOURCEMAP` | `false` | Production |
| `NODE_OPTIONS` | `--max-old-space-size=4096` | Build |

## API Endpoints

### Health Check
- **URL:** `https://your-app.vercel.app/api/health`
- **Purpose:** Basic deployment health check

### Supabase Check
- **URL:** `https://your-app.vercel.app/api/supabase-check`
- **Purpose:** Verify Supabase connection and configuration
- **Response:** Connection status, auth status, database status

## Supabase Edge Functions

### Deployed Functions
1. `monitor-intelligence` - Intelligence monitoring service
2. `claude-chat` - Claude AI integration
3. `niv-chat` - Niv assistant chat

### Function URLs
```
https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-intelligence
https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-chat
https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-chat
```

## Testing the Deployment

### 1. Check API Health
```bash
curl https://your-app.vercel.app/api/health
curl https://your-app.vercel.app/api/supabase-check
```

### 2. Test Supabase Connection
Open browser console on your deployed app:
```javascript
// Should be available globally
window.__SIGNALDESK_SUPABASE__
window.__SIGNALDESK_CONFIG__
```

### 3. Monitor Logs
```bash
# Vercel logs
vercel logs --follow

# Supabase logs (in dashboard)
# Go to: https://app.supabase.com/project/zskaxjtyuaqazydouifp/logs/edge-functions
```

## Troubleshooting

### Issue: "Supabase is not defined"
**Solution:** Ensure `@supabase/supabase-js` is in `dependencies` not `devDependencies`

### Issue: "Invalid API key"
**Solution:** Check environment variables are set in Vercel dashboard

### Issue: "Edge Function not found"
**Solution:** Deploy Edge Functions using `supabase functions deploy`

### Issue: "CORS errors"
**Solution:** Check Edge Function CORS headers and Vercel API route headers

### Issue: "Build fails on Vercel"
**Solution:** 
1. Clear cache: `vercel --prod --force`
2. Check build logs for missing dependencies
3. Ensure `CI=false` is set

## Quick Deploy Command
```bash
# One-liner to deploy everything
cd frontend && npm install && ./setup-vercel-env.sh && vercel --prod --force && node verify-supabase-deployment.js
```

## Files Modified/Created
- `/frontend/package.json` - Moved Supabase to dependencies
- `/frontend/vercel.json` - Added environment variable configuration
- `/frontend/api/supabase-check.js` - New health check endpoint
- `/frontend/setup-vercel-env.sh` - Environment setup script
- `/frontend/verify-supabase-deployment.js` - Deployment verification

## Next Steps
1. Run the deployment steps above
2. Verify all endpoints are working
3. Test authentication flow
4. Monitor error logs for any issues
5. Set up custom domain if needed