# Railway Database Connection Guide

## ⚠️ Current Status
Your Railway deployment is NOT connecting to the database because the deployment hasn't picked up the new environment variables.

## Required Actions in Railway Dashboard:

### 1. Verify Environment Variables
Go to your SignalDesk service (not PostgreSQL) and ensure these are set:
- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- `NODE_ENV` = `production`
- `PORT` = `${{PORT}}`
- `CLAUDE_API_KEY` = (your key)
- `JWT_SECRET` = (your secret)

### 2. Force Redeploy
Sometimes Railway caches deployments. To force a fresh build:
1. Go to your SignalDesk service
2. Click on "Settings" tab
3. Click "Redeploy" button
OR
1. Make a small change to any file
2. Run `railway up`

### 3. Get Public Database URL (for local testing)
To initialize the database from your local machine:
1. Go to PostgreSQL service in Railway
2. Click "Connect" tab
3. Copy the **Public** connection string (not the private one)
4. It should look like: `postgresql://postgres:PASSWORD@HOST.railway.app:PORT/railway`
5. Add to your local .env file as `DATABASE_PUBLIC_URL`
6. Run: `node scripts/init-railway-db-public.js`

### 4. Check Deployment Logs
1. Go to SignalDesk service
2. Click "Deployments" tab
3. Click on the latest deployment
4. Check logs for "Database configuration:" message
5. It should show:
   - DATABASE_URL: Set (hidden)
   - NODE_ENV: production

## Troubleshooting Checklist:
- [ ] PostgreSQL service is running (green status)
- [ ] Variables are linked with `${{Postgres.XXX}}` syntax
- [ ] NODE_ENV is set to "production"
- [ ] Latest deployment shows in Railway dashboard
- [ ] No build errors in deployment logs

## Test Your Deployment:
```bash
node test-railway.js
```

A successful test will show:
- ✅ Health Check: SUCCESS
- ✅ Login: SUCCESS
- ✅ Get Opportunities: SUCCESS

## If Still Not Working:
1. Try deleting and re-adding the DATABASE_URL variable
2. Restart both PostgreSQL and SignalDesk services
3. Check that both services are in the same environment (production)
4. Ensure Railway CLI is logged in: `railway login`