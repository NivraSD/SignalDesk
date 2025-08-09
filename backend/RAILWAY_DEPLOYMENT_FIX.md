# 🚀 SignalDesk Railway Deployment Fix Guide

## 🔴 CRITICAL ISSUES IDENTIFIED

### 1. Claude AI Integration Not Working
**Problem**: ANTHROPIC_API_KEY is either not set or incorrectly configured in Railway
**Impact**: All AI features return mock data instead of real responses

### 2. Route Registration Conflicts
**Problem**: Generic Claude routes were overriding sophisticated feature-specific routes
**Impact**: Features like Crisis Management and Media List Builder not using proper prompts

### 3. Package.json Inconsistencies
**Problem**: Two different package.json files with conflicting dependencies
**Impact**: Potential runtime errors and version conflicts

## ✅ FIXES APPLIED

### 1. Created Comprehensive Health Check System
- **New endpoint**: `/api/health/detailed` - Shows complete system status
- **Quick check**: `/api/health/status` - For uptime monitoring
- **Feature tests**: `/api/health/test-feature` - Test individual features

### 2. Fixed Route Registration Order
- Disabled conflicting `enhancedClaudeRoutes` that were overriding specific routes
- Ensured sophisticated routes (crisis, content, media, campaigns) load BEFORE generic routes
- Added health check routes at the very beginning

### 3. Consolidated Dependencies
- Synchronized package.json files
- Updated Node.js engine requirement to >=20.0.0
- Aligned all dependency versions

### 4. Created Deployment Verification Script
- Located at: `/backend/src/scripts/verify-deployment.js`
- Tests all critical endpoints and services
- Provides detailed diagnostic output

## 🚨 IMMEDIATE ACTIONS REQUIRED

### Step 1: Set Claude API Key in Railway

1. **Go to Railway Dashboard**
   - Navigate to your SignalDesk project
   - Click on the backend service

2. **Add Environment Variable**
   - Click on "Variables" tab
   - Click "New Variable"
   - Add:
     ```
     ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ACTUAL-KEY-HERE
     ```
   - Get your key from: https://console.anthropic.com/api-keys

3. **Verify Other Required Variables**
   Ensure these are set:
   - `DATABASE_URL` (should be auto-set by Railway PostgreSQL)
   - `JWT_SECRET` (any secure random string)
   - `NODE_ENV=production`
   - `PORT` (usually auto-set by Railway)

### Step 2: Deploy the Fixed Code

1. **Commit the changes**:
   ```bash
   git add .
   git commit -m "Fix Claude AI integration and route conflicts"
   git push origin main
   ```

2. **Railway will auto-deploy** (if connected to GitHub)
   - Or manually trigger deployment in Railway dashboard

### Step 3: Verify Deployment

1. **Wait for deployment to complete** (2-3 minutes)

2. **Run verification from your local machine**:
   ```bash
   cd backend
   npm run verify -- --production
   ```

3. **Check health endpoint directly**:
   ```bash
   curl https://signaldesk-production.up.railway.app/api/health/detailed
   ```

4. **Test Claude integration**:
   ```bash
   curl https://signaldesk-production.up.railway.app/api/claude-test
   ```

## 📊 MONITORING ENDPOINTS

### Production URLs to Monitor

1. **Overall Health**
   ```
   GET https://signaldesk-production.up.railway.app/api/health/status
   ```
   Expected: `{"status": "ok", "services": {"claude": "ok", "database": "ok"}}`

2. **Detailed Diagnostics**
   ```
   GET https://signaldesk-production.up.railway.app/api/health/detailed
   ```
   Shows complete system status including Claude API test results

3. **Claude Test**
   ```
   GET https://signaldesk-production.up.railway.app/api/claude-test
   ```
   Should show: `"claudeIntegrationWorking": true`

## 🔍 TROUBLESHOOTING

### If Claude Still Returns Mock Data:

1. **Check API Key in Railway**:
   - Ensure no quotes around the key
   - Verify it starts with `sk-ant-api03-`
   - Make sure it's named exactly `ANTHROPIC_API_KEY`

2. **Check Railway Logs**:
   ```bash
   railway logs
   ```
   Look for:
   - "🔑 API Key found: true"
   - "Claude service initialized"
   - Any error messages about API authentication

3. **Test Specific Features**:
   ```bash
   # Test Crisis Management
   curl -X POST https://signaldesk-production.up.railway.app/api/claude-test/crisis

   # Test Content Generation  
   curl -X POST https://signaldesk-production.up.railway.app/api/claude-test/content

   # Test Media List Builder
   curl -X POST https://signaldesk-production.up.railway.app/api/claude-test/media
   ```

### If Routes Return 404:

1. **Check route registration in logs**:
   - Look for "All routes registered successfully"
   - Verify specific routes are being loaded

2. **Ensure latest code is deployed**:
   - Check Railway deployment logs
   - Verify GitHub integration is working

### If Database Connection Fails:

1. **Check DATABASE_URL**:
   - Should be automatically set by Railway PostgreSQL
   - Format: `postgresql://user:pass@host:port/dbname`

2. **Verify PostgreSQL service**:
   - Check if PostgreSQL service is running in Railway
   - Look for connection errors in logs

## 🎯 SUCCESS CRITERIA

Your deployment is successful when:

1. ✅ `/api/health/status` returns `{"status": "ok"}`
2. ✅ `/api/claude-test` shows `"claudeIntegrationWorking": true`
3. ✅ Crisis Management returns real AI advice (not mock)
4. ✅ Content Generator creates actual content
5. ✅ Media List Builder finds real journalists
6. ✅ Campaign Intelligence provides real analysis

## 📝 VERIFICATION CHECKLIST

- [ ] ANTHROPIC_API_KEY set in Railway environment
- [ ] Latest code pushed to GitHub
- [ ] Railway deployment completed successfully
- [ ] Health check endpoint returns "ok"
- [ ] Claude test confirms real AI responses
- [ ] All feature endpoints working with real data
- [ ] No 404 errors on critical routes
- [ ] Database connection successful

## 🆘 SUPPORT

If issues persist after following this guide:

1. **Run full diagnostics**:
   ```bash
   curl https://signaldesk-production.up.railway.app/api/health/detailed | python -m json.tool
   ```

2. **Check Railway deployment logs**:
   ```bash
   railway logs --tail 100
   ```

3. **Test with verification script**:
   ```bash
   cd backend
   node src/scripts/verify-deployment.js --production
   ```

## 📌 IMPORTANT NOTES

- **Never commit API keys to Git** - Always use environment variables
- **Monitor costs** - Claude API usage incurs charges
- **Rate limiting** - Consider implementing rate limits for production
- **Caching** - Consider caching Claude responses to reduce API calls
- **Fallbacks** - Current system falls back to mock data if Claude fails

## 🚀 QUICK COMMAND REFERENCE

```bash
# Local testing
npm run dev

# Run tests
npm test

# Verify deployment
npm run verify -- --production

# Check logs
railway logs

# Deploy manually
railway up

# Check environment variables
railway variables
```

## ✨ EXPECTED OUTCOME

After completing these steps, your SignalDesk backend should:
1. Respond with real Claude AI-generated content
2. Handle all feature requests properly
3. Show green status on all health checks
4. Work exactly as it did locally

---

**Last Updated**: August 2025
**Version**: 2.0
**Status**: CRITICAL FIX REQUIRED