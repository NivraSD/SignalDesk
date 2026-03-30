# SignalDesk Supabase Setup Guide

## 🚀 Quick Setup Steps

### 1. Configure Your Supabase Project

1. **Go to your Supabase Dashboard**: https://app.supabase.com
2. **Create a new project** (if not already done)
3. **Save your credentials**:
   - Project URL: `https://YOUR_PROJECT_ID.supabase.co`
   - Anon Key: Found in Settings > API
   - Service Key: Found in Settings > API (keep secret!)

### 2. Set Up Database Schema

1. **Go to SQL Editor** in Supabase Dashboard
2. **Run the schema setup**:
   - Copy entire contents of `/supabase-migration/01-schema-setup.sql`
   - Paste in SQL Editor
   - Click "Run"
   - You should see "Success. No rows returned"

3. **Set up demo data** (optional):
   - Copy contents of `/supabase-migration/02-demo-data.sql`
   - Update the user ID in line 5 with your actual Supabase Auth user ID
   - Run in SQL Editor

### 3. Enable Realtime

1. **Go to Database > Replication** in Supabase
2. **Enable replication** for these tables:
   - `intelligence_findings`
   - `intelligence_targets`
   - `monitoring_runs`
   - `opportunity_queue`
   - `memoryvault_items`

### 4. Set Up Authentication

1. **Go to Authentication > Users**
2. **Create a demo user**:
   - Email: `demo@signaldesk.com`
   - Password: `demo123`
3. **Copy the User ID** (you'll need this)
4. **Update the users table**:
   ```sql
   UPDATE users 
   SET id = 'YOUR_AUTH_USER_ID'::uuid 
   WHERE email = 'demo@signaldesk.com';
   ```

### 5. Deploy Edge Functions

1. **Install Supabase CLI**:
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   cd /Users/jonathanliebowitz/Desktop/SignalDesk
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. **Deploy the monitoring function**:
   ```bash
   supabase functions deploy monitor-intelligence
   ```

### 6. Set Up Environment Variables

**For local development** - Create `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Keep your existing Claude API key
ANTHROPIC_API_KEY=your_existing_claude_key
```

**For Vercel** - Add these in Vercel Dashboard > Settings > Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY`

### 7. Update Your Frontend Code

Replace API calls with Supabase client:

```javascript
// Old Express API call
const response = await fetch(`${API_URL}/api/intelligence/findings`)

// New Supabase call
import { supabase } from '@/lib/supabase'
const { data, error } = await supabase
  .from('intelligence_findings')
  .select('*')
  .order('created_at', { ascending: false })
```

### 8. Set Up Scheduled Monitoring

In Supabase Dashboard > Database > Extensions:
1. Enable `pg_cron` extension
2. Go to SQL Editor and run:

```sql
-- Schedule monitoring every 5 minutes
SELECT cron.schedule(
  'monitor-all-targets',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/monitor-intelligence',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body:='{"organizationId": "demo-org"}'::jsonb
  );
  $$
);
```

## 🔄 Migration from Railway

### Export Railway Data

```bash
# Connect to Railway PostgreSQL
PGPASSWORD=your_railway_password pg_dump \
  -h your_railway_host \
  -U postgres \
  -d railway \
  --no-owner \
  --no-acl \
  > railway_backup.sql
```

### Import to Supabase

```bash
# Connect to Supabase
psql postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres < railway_backup.sql
```

## ✅ Verification Checklist

- [ ] Schema created successfully
- [ ] Demo user can login
- [ ] Real-time enabled on tables
- [ ] Edge function deployed
- [ ] Environment variables set
- [ ] Can query data from frontend
- [ ] Real-time subscriptions working
- [ ] Monitoring function runs

## 🎉 Next Steps

1. **Test real-time monitoring**:
   ```javascript
   // In your React component
   useEffect(() => {
     const subscription = subscribeToIntelligence('demo-org', (finding) => {
       console.log('New finding!', finding)
       // Update your UI
     })
     
     return () => subscription.unsubscribe()
   }, [])
   ```

2. **Trigger a monitoring run**:
   ```javascript
   const { data, error } = await triggerMonitoring('demo-org')
   ```

3. **Set up Vercel API routes** for Niv and other features

## 🆘 Troubleshooting

### "Permission denied" errors
- Check RLS policies are set up
- Ensure user is authenticated
- Verify organization_id matches

### Real-time not working
- Check table replication is enabled
- Verify WebSocket connection
- Check browser console for errors

### Edge function not running
- Check function logs: `supabase functions logs monitor-intelligence`
- Verify environment variables are set
- Check CORS settings

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Vector/Embedding Search](https://supabase.com/docs/guides/ai/vector-embeddings)

---

Need help? The Supabase + Vercel stack will give you:
- ✅ No timeout issues for monitoring
- ✅ Real-time updates for Niv
- ✅ 70% cost savings
- ✅ Better scalability
- ✅ Built-in auth & security