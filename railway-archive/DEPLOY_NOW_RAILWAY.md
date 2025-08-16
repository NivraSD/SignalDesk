# 🚀 Deploy to Railway NOW (Optimized for $5 Plan)

## Step 1: Open Railway Dashboard
Go to: https://railway.app/dashboard

## Step 2: Select your SignalDesk project

## Step 3: Add PostgreSQL Database (if not already added)
- Click "New Service" 
- Select "Database" → "PostgreSQL"
- It will auto-connect with DATABASE_URL

## Step 4: Set Environment Variables
Click on your backend service, go to "Variables" tab and add:

```
NODE_ENV=production
ANTHROPIC_API_KEY=<your-claude-api-key>
JWT_SECRET=your-secret-key-here
PORT=3001
```

The DATABASE_URL should already be there from PostgreSQL.

## Step 5: Deploy from GitHub
In Railway dashboard:
1. Click "New Service" → "GitHub Repo"
2. Select your SignalDesk repo
3. Set root directory to: `/backend`
4. Railway will auto-deploy

## Step 6: Manual Deploy (Alternative)
From your terminal:
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend
railway up
```

## What I've Optimized:
✅ Reduced database connections (5 instead of 10)
✅ Limited memory to 400MB (safe for $5 plan)
✅ Added connection timeouts
✅ Optimized package.json start script
✅ Created nixpacks.toml for proper Node.js version

## After Deployment:
1. Get your Railway URL from dashboard
2. Update frontend/src/config/api.js:
```javascript
const API_BASE_URL = 'https://your-app.up.railway.app';
```

## Monitor for Issues:
```bash
railway logs --tail
```

If it crashes, check logs for:
- "JavaScript heap out of memory" → Need $20 plan
- "ECONNREFUSED" → Database connection issue
- "Cannot find module" → Dependency issue