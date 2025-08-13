# Railway Fresh Service Setup Guide
**Created:** August 12, 2025

## 🚀 Quick Setup Steps

### 1️⃣ Delete Old Service
- Go to Railway Dashboard → SignalDesk project
- Click on backend service → Settings → Delete Service
- Confirm deletion

### 2️⃣ Create New Service
1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose **NivraSD/SignalDesk** repository
4. Select **main** branch
5. Railway will auto-detect the `/backend` directory

### 3️⃣ Configure Environment Variables
Add these in the service Settings → Variables:

```bash
# REQUIRED - Copy these exactly
ANTHROPIC_API_KEY=your-actual-anthropic-api-key-here
DATABASE_URL=postgresql://postgres:MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV@crossover.proxy.rlwy.net:56706/railway
JWT_SECRET=your-secret-key-here
NODE_ENV=production
PORT=3000

# OPTIONAL - For monitoring
RAILWAY_DEPLOYMENT_ID=${{RAILWAY_DEPLOYMENT_ID}}
RAILWAY_GIT_COMMIT_SHA=${{RAILWAY_GIT_COMMIT_SHA}}
BUILD_ID=${{RAILWAY_DEPLOYMENT_ID}}
```

### 4️⃣ Configure Build Settings
In Settings → Build:
- **Root Directory:** `/backend`
- **Build Command:** `npm ci --production=false`
- **Start Command:** `node server.js`

### 5️⃣ Configure Deploy Settings
In Settings → Deploy:
- **Health Check Path:** `/api/health`
- **Restart Policy:** Always

### 6️⃣ Deploy
1. Click **"Deploy"** button
2. Watch logs for successful startup
3. Look for: "🚀 SignalDesk API Server running on port 3000"

## ✅ Verification Checklist

After deployment (wait 3-5 minutes), verify:

### Test 1: Version Endpoint
```bash
curl https://signaldesk-production.up.railway.app/api/version
```
**Expected:** JSON with version, commit, timestamp

### Test 2: Health Check
```bash
curl https://signaldesk-production.up.railway.app/api/health
```
**Expected:** `{"status":"ok","message":"SignalDesk API is running"}`

### Test 3: Root Endpoint
```bash
curl https://signaldesk-production.up.railway.app/
```
**Expected:** Full API documentation JSON

### Test 4: Run Full Verification
```bash
./verify-railway-deployment.sh
```
**All tests should pass!**

## 🔍 What to Look For in Logs

Good signs:
- `🚀🚀🚀 STARTING SIGNALDESK SERVER v2.0`
- `✅ Persistent conversation state management active`
- `🔓 Setting up PERMISSIVE CORS`
- `✅ Database connected successfully`
- `✅ Claude service initialized`

Bad signs:
- `⚠️ WARNING: Claude service not properly initialized`
- `Failed to connect to database`
- Any unhandled promise rejections

## 🚨 Common Issues & Fixes

### Issue: API endpoints return 404
**Fix:** Check root directory is set to `/backend`

### Issue: Version endpoint returns auth error
**Fix:** You're still hitting old service. Wait for DNS to update (5-10 mins)

### Issue: Claude not working
**Fix:** Verify ANTHROPIC_API_KEY is set correctly in environment variables

### Issue: Database connection fails
**Fix:** Check DATABASE_URL is exactly as provided above

## 📝 Post-Deployment Tasks

1. **Update Frontend Environment**
   - Update Vercel environment to point to new Railway URL (if changed)
   
2. **Test Core Features**
   - Login with demo@signaldesk.com / demo123
   - Create a project
   - Test AI Assistant
   - Test Content Generator

3. **Monitor Performance**
   - Check Railway metrics
   - Monitor logs for errors
   - Verify memory usage is stable

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ `/api/version` returns current commit hash
- ✅ `/api/health` returns ok status
- ✅ AI Assistant asks questions (not info dumps)
- ✅ Content appears in workspace (not chat)
- ✅ All verification script tests pass

## 💡 Pro Tips

1. **Save your environment variables** before deleting the old service
2. **Use Railway's "Raw Editor"** for bulk environment variable input
3. **Enable "Automatic Deploys"** for GitHub pushes
4. **Set up deployment notifications** in Discord/Slack
5. **Use Railway CLI** for future deployments: `railway link` then `railway up`

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check deployment logs for specific errors