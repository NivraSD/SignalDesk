# Deploy to Railway - Step by Step

## Prerequisites
- Railway account (https://railway.app)
- Railway CLI installed: `npm install -g @railway/cli`

## Step 1: Initialize Railway Project
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend
railway login
railway init
```

## Step 2: Add PostgreSQL Database
```bash
railway add
# Select PostgreSQL
```

## Step 3: Set Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set CLAUDE_API_KEY="your-actual-claude-key-here"
railway variables set JWT_SECRET="your-secret-key-here"
railway variables set PORT=5001
```

## Step 4: Deploy Backend
```bash
railway up
```

## Step 5: Get Database URL
```bash
railway variables
# Copy the DATABASE_URL
```

## Step 6: Run Database Migration
```bash
railway run node scripts/populate-source-indexes.js
```

## Step 7: Deploy Frontend
```bash
cd ../frontend
railway init
railway variables set REACT_APP_API_URL="https://your-backend.railway.app"
railway up
```

## Step 8: Start Monitoring Service
The Procfile will automatically start both web and worker processes.

## Troubleshooting

### If "Application failed to respond":
1. Check logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Check if PORT is set correctly
4. Ensure package.json has "start" script

### Common Issues:
- Missing environment variables
- Database not connected
- Wrong PORT configuration
- Build failures

## Expected Result
Once deployed:
- Backend: https://your-backend.railway.app
- Frontend: https://your-frontend.railway.app
- Monitoring: Running continuously
- Database: PostgreSQL with all sources