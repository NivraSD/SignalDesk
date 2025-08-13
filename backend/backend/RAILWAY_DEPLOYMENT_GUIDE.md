# SignalDesk Railway Deployment Guide

## Critical Fix Instructions

### Current Issues Identified
1. **Claude API Key not configured in Railway** - This is causing mock data to be returned
2. **Route conflicts** - enhancedClaudeRoutes overriding sophisticated implementations
3. **Missing environment variables** in Railway dashboard

### Immediate Actions Required

## Step 1: Set Railway Environment Variables

Go to your Railway Dashboard and add these environment variables:

```
ANTHROPIC_API_KEY = _YOUR_API_KEY_HERE
NODE_ENV = production
CLAUDE_MODEL = claude-3-5-sonnet-20241022
JWT_SECRET = your-secret-jwt-key-here-change-this-in-production
```

**CRITICAL**: The ANTHROPIC_API_KEY must be set exactly as shown above for Claude to work.

## Step 2: Apply Code Fixes

The following fixes have been implemented:

1. **Disabled conflicting routes** in `/backend/index.js`:
   - Line 244: `enhancedClaudeRoutes` is permanently disabled
   - This prevents mock data from overriding real Claude responses

2. **Added Claude initialization** in `/backend/src/utils/claudeInit.js`:
   - Validates API key on startup
   - Provides clear error messages if misconfigured

3. **Enhanced health monitoring** in `/backend/src/routes/healthCheckRoutes.js`:
   - `/api/health/detailed` - Full system diagnostics
   - `/api/health/status` - Quick status check

## Step 3: Deploy to Railway

### Option A: Using Railway CLI
```bash
# Make the deployment script executable
chmod +x railway-deploy-fix.sh

# Run the deployment
./railway-deploy-fix.sh
```

### Option B: Manual Deployment
```bash
# 1. Commit the fixes
git add -A
git commit -m "Fix: Restore Claude functionality for Railway deployment"

# 2. Push to Railway
railway up

# 3. Wait for deployment to complete (check Railway dashboard)
```

## Step 4: Verify Deployment

### Quick Verification
```bash
# Make the verification script executable
chmod +x verify-deployment.sh

# Run verification (replace with your actual Railway URL)
./verify-deployment.sh https://your-app.railway.app
```

### Manual Verification

1. **Check Health Status**:
   ```
   https://your-app.railway.app/api/health/detailed
   ```
   
   Look for:
   - `"claude": "WORKING"` - Claude is functioning
   - `"isRealClaude": true` - Real AI responses, not mock data
   - `"apiKeys.ANTHROPIC_API_KEY.exists": true` - Key is set

2. **Test Each Feature**:
   
   **Crisis Management**:
   - Navigate to `/crisis` in frontend
   - Click "Get AI Advice"
   - Should return real-time crisis guidance, not generic text
   
   **Content Generator**:
   - Navigate to `/content` in frontend
   - Generate any content type
   - Should return unique, contextual content
   
   **Media List Builder**:
   - Navigate to `/media` in frontend
   - Search for journalists
   - Should return varied, relevant journalists (not always the same 5)
   
   **Campaign Intelligence**:
   - Navigate to `/campaigns` in frontend
   - Analyze a campaign
   - Should return detailed, specific analysis

## Step 5: Monitor Logs

```bash
# View live logs
railway logs

# Check for these success indicators:
# ✅ "Claude service initialized with model: claude-3-5-sonnet-20241022"
# ✅ "API Key found: true"
# ✅ "API Key length: 108" (or similar)

# Check for these error indicators:
# ❌ "CLAUDE_API_KEY not properly configured!"
# ❌ "Claude client not initialized"
# ❌ "Using fallback response"
```

## Troubleshooting

### Issue: Still Getting Mock Data

1. **Verify API Key in Railway**:
   ```bash
   railway variables
   ```
   Should show ANTHROPIC_API_KEY with the correct value

2. **Force Redeploy**:
   ```bash
   railway up --detach
   ```

3. **Check Route Order**:
   Ensure in `/backend/index.js`:
   - Specific routes (crisis, content, media, campaigns) load BEFORE line 241
   - enhancedClaudeRoutes is commented out on line 244

### Issue: Claude Test Fails

1. **Check API Key Format**:
   - Must start with `sk-ant-api03-`
   - Must be exactly 108 characters
   - No spaces or quotes around the key

2. **Test Claude Directly**:
   ```
   curl -X GET https://your-app.railway.app/api/claude-test
   ```

### Issue: Routes Return 404

1. **Verify Route Registration**:
   Check that all route files exist in `/backend/src/routes/`
   - crisisRoutes.js
   - contentRoutes.js
   - mediaRoutes.js
   - campaignRoutes.js

2. **Check Middleware Order**:
   Auth middleware should be applied correctly to protected routes

## Success Indicators

When properly deployed, you should see:

1. **In Health Check** (`/api/health/detailed`):
   ```json
   {
     "services": {
       "claude": {
         "testResult": {
           "success": true,
           "isRealClaude": true,
           "isMockResponse": false
         }
       }
     },
     "status": {
       "overall": "HEALTHY",
       "claude": "WORKING"
     }
   }
   ```

2. **In Application**:
   - Unique, contextual AI responses
   - No repeated mock data
   - Fast response times (1-3 seconds for Claude)
   - All features functioning as they did locally

## Railway Configuration File

The `railway.json` file has been created with optimal settings:
- Health check endpoint configured
- Restart policy for resilience
- Environment variables pre-configured
- Proper build and start commands

## Support

If issues persist after following this guide:

1. Check Railway deployment logs for specific errors
2. Verify all environment variables are set correctly
3. Ensure the latest code changes are deployed
4. Test the health endpoint for diagnostic information

## Next Steps After Successful Deployment

1. **Update Frontend Configuration**:
   - Update API_URL in frontend to point to Railway backend
   - Redeploy frontend with new backend URL

2. **Set Up Monitoring**:
   - Configure uptime monitoring for `/api/health/status`
   - Set up alerts for failed health checks
   - Monitor Claude API usage in Anthropic dashboard

3. **Security Hardening**:
   - Change JWT_SECRET to a strong, unique value
   - Review CORS settings for production
   - Enable rate limiting if needed

4. **Database Configuration**:
   - Ensure DATABASE_URL is properly set in Railway
   - Verify database migrations are up to date
   - Set up database backups

## Complete Deployment Checklist

- [ ] ANTHROPIC_API_KEY set in Railway variables
- [ ] NODE_ENV set to "production"
- [ ] JWT_SECRET changed from default
- [ ] enhancedClaudeRoutes disabled in index.js
- [ ] Claude initialization added to startup
- [ ] Health monitoring endpoints working
- [ ] All features tested and working
- [ ] No mock data being returned
- [ ] Logs show successful Claude initialization
- [ ] Frontend connected to Railway backend

---

**Remember**: The most critical step is setting the ANTHROPIC_API_KEY environment variable in Railway. Without this, all AI features will fail or return mock data.