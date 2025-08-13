# Railway Deployment Debugging Guide

## Current Status
- **Domain**: https://signaldesk-production.up.railway.app
- **Status**: 502 Bad Gateway (app is crashing)

## Check These in Railway Logs:

### 1. Missing Environment Variables
Look for errors like:
- `ANTHROPIC_API_KEY is not defined`
- `DATABASE_URL is not defined`
- `JWT_SECRET is not defined`

**Fix**: Add these in Railway Settings → Variables

### 2. Module Not Found
Look for errors like:
- `Cannot find module`
- `Module not found`

**Fix**: The module might not be installed in production

### 3. Database Connection
Look for errors like:
- `ECONNREFUSED`
- `Connection timeout`
- `Authentication failed`

**Fix**: Check DATABASE_URL format in Railway variables

### 4. Port Binding
Look for errors like:
- `EADDRINUSE`
- `Permission denied`

**Fix**: Railway sets PORT automatically, make sure code uses process.env.PORT

## Required Environment Variables

Add these in Railway Dashboard → Settings → Variables:

```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key-here
NODE_ENV=production
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

## Quick Test Commands

Once you fix the issue and redeploy:

```bash
# Test health
curl https://signaldesk-production.up.railway.app/api/health

# Test root
curl https://signaldesk-production.up.railway.app/

# Test auth
curl -X POST https://signaldesk-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"demo123"}'
```

## If Still Failing

1. In Railway Settings, try:
   - Start Command: `node backend/server.js`
   - Watch Paths: Disable
   - Health Check: `/api/health`

2. Redeploy from Railway Dashboard

3. Check build logs for any errors during Docker build

The 502 error means Railway is running your container but the Node.js app inside is crashing. The logs will show exactly why.