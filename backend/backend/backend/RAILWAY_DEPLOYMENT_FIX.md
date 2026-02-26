# Railway Deployment Fix Guide

## 🚨 Current Issue
Railway is still running `index.js` instead of `server.js`, which means most API endpoints (Campaign Intelligence, Opportunity Engine, Media List Builder) return 404 errors.

## ✅ Quick Fix in Railway Dashboard

### Option 1: Override Start Command (Recommended)
1. Go to https://railway.app/dashboard
2. Select your SignalDesk project
3. Click on the backend service
4. Go to **Settings** tab
5. Find **Start Command** section
6. Enter: `node server.js`
7. Click **Save** or **Apply**
8. Service will automatically redeploy

### Option 2: Add Environment Variable
1. In Railway dashboard, go to your backend service
2. Click **Variables** tab
3. Add new variable:
   - Key: `RAILWAY_START_CMD`
   - Value: `node server.js`
4. Save and redeploy

### Option 3: Force Redeploy
1. In Railway dashboard, go to your backend service
2. Click **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or click **Rollback** then **Redeploy**

## 🔍 How to Verify It's Working

### Quick Test
```bash
curl https://signaldesk-api-production.up.railway.app/
```

**OLD Response (Wrong):**
```json
{
  "message": "SignalDesk API on Railway",
  "status": "online",
  "timestamp": "..."
}
```

**NEW Response (Correct):**
```json
{
  "message": "🚀 SignalDesk Platform API",
  "version": "1.0.0",
  "status": "operational",
  "endpoints": { ... },
  "database": "Connected to PostgreSQL",
  "monitoring": "Active - Processing 5,000+ articles every 5 minutes"
}
```

### Full Test
Run the verification script:
```bash
./verify-deployment.sh
```

Or test Claude features:
```bash
node test-claude-direct.js
```

## 📝 What We've Already Done

### Code Changes (All Committed)
1. ✅ Fixed Campaign Intelligence Controller syntax error
2. ✅ Updated package.json to use server.js
3. ✅ Modified nixpacks.toml to use server.js
4. ✅ Updated railway.json to use server.js
5. ✅ Created index.js redirect to server.js
6. ✅ Added Claude diagnostics endpoints

### Configuration Files
All these files now point to `server.js`:
- `package.json` - start script
- `nixpacks.toml` - start command
- `railway.json` - deploy startCommand
- `railway.toml` - startCommand
- `Procfile` - web process
- `index.js` - redirects to server.js

## 🎯 Expected Results After Fix

Once Railway uses server.js, you'll have:

### Working Endpoints
- ✅ `/api/content/*` - Content Generator
- ✅ `/api/crisis/*` - Crisis Advisor
- ✅ `/api/campaigns/*` - Campaign Intelligence
- ✅ `/api/opportunity/*` - Opportunity Engine
- ✅ `/api/media/*` - Media List Builder
- ✅ `/api/claude-diagnostics/*` - Diagnostics

### Claude Features Status
All 5 features will show as working:
```
✅ Content Generator: WORKING
✅ Crisis Advisor: WORKING
✅ Campaign Intelligence: WORKING
✅ Opportunity Engine: WORKING
✅ Media List Builder: WORKING
```

## 🛠️ Troubleshooting

### If Changes Don't Apply
1. **Clear Build Cache**
   - In Railway Settings, find "Clear Build Cache"
   - Click to clear and trigger rebuild

2. **Check Logs**
   - Go to Deployments → View Logs
   - Look for: "Starting SignalDesk server..."
   - Should show routes being registered

3. **Manual Restart**
   - Stop the service (Settings → Danger Zone → Stop Service)
   - Wait 10 seconds
   - Start the service again

### Still Using index.js?
Railway might be caching. Try:
1. Make a small change to trigger rebuild:
   ```bash
   echo "// Force rebuild $(date)" >> backend/server.js
   git add backend/server.js
   git commit -m "Force Railway rebuild"
   git push
   ```

2. Or in Railway:
   - Delete the service
   - Re-create from GitHub repo
   - Ensure Start Command is `node server.js`

## 📞 Manual Configuration in Railway

If automated deployment isn't working:

1. **Go to Service Settings**
2. **Override these settings:**
   - Build Command: `npm ci --production`
   - Start Command: `node server.js`
   - Health Check Path: `/api/health`
   - Watch Paths: `backend/**`

3. **Save and Redeploy**

## ✨ Success Indicators

You'll know it's working when:
1. Root endpoint (/) returns detailed API info with endpoints
2. `/api/claude-diagnostics/config` returns 200
3. All test scripts pass
4. No more 404 errors on campaign/opportunity/media endpoints

---

**Current Status**: Waiting for Railway to use server.js
**Action Required**: Manual intervention in Railway dashboard
**Time Estimate**: 2-3 minutes after changing start command