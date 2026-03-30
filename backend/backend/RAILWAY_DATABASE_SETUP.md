# Railway PostgreSQL Database Setup

## Step 1: Create PostgreSQL Database in Railway

1. Go to your Railway project dashboard
2. Click **"+ New"** button
3. Select **"Database"**
4. Choose **"PostgreSQL"**
5. Railway will create the database (takes ~30 seconds)

## Step 2: Connect Database to Backend Service

### Option A: Automatic Connection (Recommended)
1. In your backend service, go to **Variables** tab
2. Click **"Add Variable Reference"**
3. Select your PostgreSQL service
4. Choose **DATABASE_URL**
5. Railway will automatically inject the correct URL

### Option B: Manual Connection
1. Click on your PostgreSQL database service
2. Go to **Variables** tab
3. Copy the **DATABASE_URL** value
4. Go to your backend service
5. Add/Update the DATABASE_URL variable with the copied value

## Step 3: Initialize Database Schema

Once connected, run this script to create all required tables:

```bash
# Save the DATABASE_URL from Railway first
export DATABASE_URL="your-railway-postgres-url-here"

# Run the initialization script
node backend/scripts/init-complete-railway-db.js
```

Or use the SQL files directly:

```sql
-- Run these in Railway's PostgreSQL query interface
-- Found under Data tab in your PostgreSQL service

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT false,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create demo user
INSERT INTO users (email, password, organization) 
VALUES ('demo@signaldesk.com', '$2a$10$H7Qk1r5Y6R1J3x5z7W9Yx.7Zk9Qw8E4R2T5Y8U1I3O6P9A3S5D2F8G', 'Demo Organization')
ON CONFLICT (email) DO NOTHING;
```

## Step 4: Verify Connection

After updating the DATABASE_URL:

1. **Restart your backend service**
   - Click "Redeploy" in Railway

2. **Check logs for**:
   ```
   ✅✅✅ POSTGRES CONNECTED SUCCESSFULLY ✅✅✅
   ```

3. **Test the API**:
   ```bash
   curl https://signaldesk-production.up.railway.app/api/health
   ```
   Should return: `{"status":"ok"}`

## Common Database URLs Format

Railway PostgreSQL URLs look like:
```
postgresql://postgres:PASSWORD@CONTAINER.railway.app:PORT/railway
```

Your service needs exactly this URL - don't modify it!

## Troubleshooting

### Error: "Connection refused"
- Database isn't running or URL is wrong
- Check PostgreSQL service is active in Railway

### Error: "Authentication failed"
- PASSWORD in URL doesn't match
- Re-copy the DATABASE_URL from Railway

### Error: "Database does not exist"
- Database name in URL is wrong
- Use the exact URL from Railway

### Error: "Relation does not exist"
- Tables haven't been created
- Run the initialization SQL above

## Quick Test

Once connected, test with:
```bash
# Login endpoint (uses database)
curl -X POST https://signaldesk-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"demo123"}'
```

Success = Database is working!