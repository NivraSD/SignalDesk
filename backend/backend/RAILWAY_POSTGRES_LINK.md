# Railway PostgreSQL Connection Guide

## Important: Link PostgreSQL Variables to Your Service

Since you've added PostgreSQL to your Railway project, you now need to make sure the database variables are available to your SignalDesk service.

### Option 1: Use Reference Variables (Recommended)
In your Railway dashboard:

1. **Click on your SignalDesk service** (not the Postgres service)
2. Go to the **Variables** tab
3. Click **"New Variable"** and add these reference variables:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
PGDATABASE=${{Postgres.PGDATABASE}}
PGHOST=${{Postgres.PGHOST}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGPORT=${{Postgres.PGPORT}}
PGUSER=${{Postgres.PGUSER}}
```

**Note:** Replace "Postgres" with the actual name of your PostgreSQL service if it's different.

### Option 2: Use Railway's Variable References UI
1. In your SignalDesk service's Variables tab
2. Click "New Variable"
3. Type "DATABASE_URL" as the key
4. Click the reference button (looks like `${}`)
5. Select your Postgres service → DATABASE_URL
6. Repeat for other PG variables if needed

### Option 3: Use Shared Variables
If Railway has already created shared variables:
1. Look for a section called "Shared Variables" in your SignalDesk service
2. These should automatically include the PostgreSQL connection details
3. If not visible, you may need to restart the service

### Also Update These Variables:
```
NODE_ENV=production
PORT=${{PORT}}
```

### After Adding Variables:
1. Railway will automatically redeploy your service
2. Check the deployment logs to confirm database connection
3. Run the test script to verify:
   ```bash
   node test-railway.js
   ```

### Troubleshooting:
- If variables don't appear, try refreshing the Railway dashboard
- Make sure both services are in the same environment (production)
- Check that the PostgreSQL service is running (green status)
- The DATABASE_URL is the most important variable - if that's set, the others are optional