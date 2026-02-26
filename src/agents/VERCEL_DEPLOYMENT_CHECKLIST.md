# SignalDesk Vercel Deployment Configuration Checklist

## Current Issues Identified

### 1. API Connectivity Issues
- **Problem**: Frontend on Vercel cannot properly connect to Railway backend
- **Symptoms**: 
  - Some API calls returning mock data instead of real Claude AI responses
  - Response structure mismatches between frontend expectations and backend responses
  - Possible CORS issues with the Railway backend

### 2. Environment Variables Configuration
- **Current Setup**:
  - Frontend: `REACT_APP_API_URL=https://signaldesk-production.up.railway.app/api`
  - Backend CORS: Set to allow all origins (`origin: true`)

## Vercel Configuration Checklist

### Step 1: Verify Environment Variables in Vercel Dashboard

1. **Login to Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select your SignalDesk project

2. **Check Environment Variables**
   - Navigate to: Settings → Environment Variables
   - Ensure these are set:
   ```
   REACT_APP_API_URL = https://signaldesk-production.up.railway.app/api
   ```
   - **Important**: Environment variables must be set for:
     - [x] Production
     - [x] Preview
     - [x] Development

3. **Trigger a Rebuild**
   - After setting environment variables, you MUST redeploy
   - Go to Deployments → Click three dots on latest → Redeploy

### Step 2: Update vercel.json Configuration

The current `vercel.json` in `/frontend` should be updated:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "env": {
    "REACT_APP_API_URL": "https://signaldesk-production.up.railway.app/api"
  },
  "build": {
    "env": {
      "REACT_APP_API_URL": "https://signaldesk-production.up.railway.app/api"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3: Backend CORS Configuration (Railway)

Ensure the Railway backend has proper CORS configuration:

1. **Current Configuration** (in `server.js`):
   ```javascript
   app.use(cors({
     origin: true, // This allows all origins
     credentials: true
   }));
   ```

2. **Recommended Production Configuration**:
   ```javascript
   app.use(cors({
     origin: [
       'https://signaldesk-frontend.vercel.app',
       'https://signaldesk-frontend-*.vercel.app', // For preview deployments
       'http://localhost:3000' // For local development
     ],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
   }));
   ```

### Step 4: API Response Structure Validation

The backend is using fallback responses when Claude is not available. Check these endpoints:

1. **Media Search** (`/api/media/search-reporters`)
   - Currently returns mock journalist data
   - Frontend expects: Array of journalist objects with specific fields

2. **Crisis Advisor** (`/api/crisis/advisor`)
   - May return string instead of expected JSON structure
   - Frontend expects: Object with advice fields

3. **Campaign Intelligence** (`/api/campaign/insights`)
   - Mock data structure may not match frontend expectations

### Step 5: Testing Procedure

1. **Open the Test Dashboard**
   - File: `/backend/src/agents/test-all-features.html`
   - Open in browser directly (file://)
   - Configure with your Vercel and Railway URLs

2. **Run Tests in Order**:
   - [ ] Health Check - Verify backend is accessible
   - [ ] CORS Configuration - Check headers are correct
   - [ ] Environment Variables - Verify they're in the build
   - [ ] Claude AI Integration - Test AI responses
   - [ ] Media Search - Verify journalist data structure
   - [ ] Crisis Advisor - Check response format
   - [ ] Campaign Intelligence - Validate insights structure
   - [ ] Content Generator - Test content generation
   - [ ] Monitoring System - Check sentiment analysis
   - [ ] Authentication - Test login flow

3. **Expected Results**:
   - All tests should return HTTP 200 status
   - Response structures should match frontend expectations
   - No CORS errors in browser console

### Step 6: Frontend API Configuration Verification

1. **Check API Base URL Usage**:
   ```javascript
   // In /frontend/src/config/api.js
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://signaldesk-production.up.railway.app/api';
   ```

2. **Verify in Browser Console**:
   - Open deployed site
   - Open Developer Console
   - Check for API configuration logs
   - Look for CORS errors

### Step 7: Claude API Integration Fix

The backend is currently using fallback responses. To restore full Claude functionality:

1. **Check Claude Configuration** (Railway environment variables):
   ```
   ANTHROPIC_API_KEY = your-api-key-here
   ```

2. **Verify Claude Service** (`/backend/config/claude.js`):
   - Ensure proper initialization
   - Check error handling
   - Verify API key is loaded

### Step 8: Deployment Commands

```bash
# Frontend (Vercel) - from /frontend directory
vercel --prod

# Or using Git integration (recommended)
git push origin main

# Backend (Railway) - automatic on push to main
git push origin main
```

### Step 9: Post-Deployment Verification

1. **Check Vercel Deployment Logs**:
   - Look for build errors
   - Verify environment variables are injected
   - Check for missing dependencies

2. **Check Railway Logs**:
   - Verify server started successfully
   - Check for database connection
   - Look for route loading confirmations

3. **Browser Testing**:
   - Clear browser cache
   - Test in incognito mode
   - Check Network tab for API calls
   - Verify response payloads

## Common Issues and Solutions

### Issue 1: Environment Variables Not Working
**Solution**: 
- Redeploy after adding environment variables
- Check if using correct prefix (REACT_APP_)
- Verify in build logs

### Issue 2: CORS Errors
**Solution**:
- Update backend CORS configuration
- Check preflight OPTIONS requests
- Verify credentials flag

### Issue 3: Mock Data Instead of Real Data
**Solution**:
- Check Claude API key in Railway
- Verify Claude service initialization
- Check fallback conditions in routes

### Issue 4: 404 Errors on API Calls
**Solution**:
- Verify API base URL includes /api
- Check route definitions in backend
- Ensure routes are loaded (check logs)

## Testing Checklist Summary

- [ ] Environment variables set in Vercel Dashboard
- [ ] Redeployed after environment variable changes
- [ ] CORS properly configured on Railway backend
- [ ] All API endpoints returning correct response structure
- [ ] No CORS errors in browser console
- [ ] Claude API key configured in Railway
- [ ] All features working as expected
- [ ] Test dashboard shows all green

## Contact Points for Issues

1. **Vercel Issues**: Check deployment logs in Vercel dashboard
2. **Railway Issues**: Check application logs in Railway dashboard
3. **API Issues**: Use the test dashboard to isolate problems
4. **Claude Issues**: Verify API key and check Railway logs

## Next Steps

1. Run the test dashboard with your deployment URLs
2. Fix any failing tests based on the results
3. Update configurations as needed
4. Redeploy both frontend and backend
5. Verify all features are working correctly