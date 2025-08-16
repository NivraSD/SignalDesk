# Railway PostgreSQL Setup Instructions

## IMPORTANT: You need to add PostgreSQL to your Railway project

### Step 1: Add PostgreSQL to Railway
1. Go to your Railway dashboard: https://railway.app
2. Open your SignalDesk project
3. Click "New Service" or "+" button
4. Select "Database" → "Add PostgreSQL"
5. Railway will automatically create a PostgreSQL database and inject the following variables:
   - DATABASE_URL
   - PGDATABASE
   - PGHOST
   - PGPASSWORD
   - PGPORT
   - PGUSER

### Step 2: Update Environment Variables
After adding PostgreSQL, also set these variables in your Railway dashboard:

1. Click on your SignalDesk service (not the database)
2. Go to "Variables" tab
3. Update/Add these variables:

```
NODE_ENV=production
PORT=${{PORT}}
CLAUDE_API_KEY=your-actual-key-here
JWT_SECRET=your-jwt-secret-here
```

### Step 3: Verify Database Connection
Once PostgreSQL is added, Railway will automatically restart your service with the database variables.

### Step 4: Initialize Database
After the database is connected, run this locally to initialize it:
```bash
railway run node scripts/init-railway-db.js
```

### Step 5: Test Deployment
```bash
node test-railway.js
```

## Current Status
✅ Application deployed
✅ CLAUDE_API_KEY set
✅ JWT_SECRET set
❌ NODE_ENV is set to "development" (should be "production")
❌ PostgreSQL database NOT added yet
❌ DATABASE_URL not available

## Next Steps
1. Add PostgreSQL database to your Railway project (Step 1 above)
2. Change NODE_ENV to "production" in Railway variables
3. The deployment should automatically restart and connect