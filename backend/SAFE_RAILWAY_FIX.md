# Safe Railway Fix - Preserving PostgreSQL & MCPs

## ⚠️ IMPORTANT: Your Setup
- **PostgreSQL Database**: Connected via Railway (crossover.proxy.rlwy.net)
- **MCPs**: Configured in your environment
- **Environment Variables**: Multiple API keys and configurations

## Option 1: Try Changing Builder (SAFEST)

1. Go to Railway Dashboard → Backend Service
2. **Settings** → **Build** section
3. Change **Builder** from "Dockerfile" to "Nixpacks"
4. Click **Save Changes**
5. Go to **Deployments** → **Trigger Deploy**

## Option 2: Create Parallel Service (SAFE)

### Step 1: Backup Current Variables
1. Go to current backend service → **Variables** tab
2. Copy ALL variables to a text file, especially:
   ```
   DATABASE_URL=postgresql://...
   DATABASE_PUBLIC_URL=...
   ANTHROPIC_API_KEY=...
   REDIS_URL=...
   JWT_SECRET=...
   ```

### Step 2: Create NEW Service (Don't Delete Old One)
1. In Railway project → **New Service** → **GitHub Repo**
2. Select your repo
3. **IMPORTANT**: Set root directory to `/backend`
4. Choose **Nixpacks** as builder
5. Deploy

### Step 3: Configure New Service
1. Add all environment variables from backup
2. Ensure DATABASE_URL points to same PostgreSQL
3. Test the new service works
4. Update your frontend to point to new service URL

### Step 4: Only After Verification
1. Confirm new service works
2. Database connection is good
3. Then remove old service

## Option 3: Force Clear Cache (Try First!)

### Via Railway CLI:
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend
railway login
railway link  # Link to your project
railway service  # Select backend service
railway variables  # Verify you're connected
railway up --detach  # Force new deployment
```

### Via Dashboard:
1. Go to Settings → Danger Zone
2. Look for **"Clear Build Cache"** button
3. Click it if available
4. Redeploy

## PostgreSQL Connection Notes

Your database is at: `crossover.proxy.rlwy.net:56706`
- This is Railway's PostgreSQL service
- It will persist even if you delete/recreate the backend service
- Just make sure to use the same DATABASE_URL

## MCP Considerations

MCPs are configured locally on your machine, not in Railway. They connect via:
- API endpoints (your backend)
- Database connections

As long as you maintain the same:
- DATABASE_URL
- API routes
- Port configuration

Your MCPs will continue to work.

## Recommended Approach

1. **First**: Try Option 3 (Force Clear Cache)
2. **Second**: Try Option 1 (Change Builder in Settings)
3. **Last Resort**: Option 2 (Create Parallel Service)

Never delete anything until you've verified the new setup works!

## Testing After Changes

```bash
# Test backend is running
curl https://your-new-railway-url.railway.app/api/health

# Test database connection
curl https://your-new-railway-url.railway.app/api/test

# Test from frontend
# Update frontend API_URL if service URL changed
```

---
**Remember**: Your PostgreSQL data is safe in Railway's database service. It's separate from your backend service.