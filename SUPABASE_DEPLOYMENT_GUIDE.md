# SignalDesk Supabase Deployment Guide

## Complete Setup Checklist for Supabase Project

Your Supabase project URL: `https://zskaxjtyuaqazydouifp.supabase.co`

## Prerequisites

1. **Supabase CLI** (for Edge Functions deployment)
   ```bash
   npm install -g supabase
   ```

2. **Anthropic API Key** for Claude integration
   - Get from: https://console.anthropic.com/

## Step 1: Database Setup

### 1.1 Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and paste the entire contents of `supabase-setup.sql`
5. Click **Run** to execute

This will create:
- All required tables (users, organizations, intelligence_findings, etc.)
- Row Level Security (RLS) policies
- Indexes for performance
- Real-time subscriptions setup
- Default organization

### 1.2 Verify Tables Created

Go to **Table Editor** in Supabase Dashboard and verify these tables exist:
- [ ] organizations
- [ ] users
- [ ] intelligence_targets
- [ ] intelligence_findings
- [ ] monitoring_runs
- [ ] opportunity_queue
- [ ] projects
- [ ] content
- [ ] memoryvault_items

## Step 2: Authentication Setup

### 2.1 Create Admin User

1. Go to **Authentication** > **Users**
2. Click **Invite user**
3. Enter:
   - Email: `admin2@signaldesk.com`
   - Password: Choose a secure password
4. Click **Send invitation**

### 2.2 Link User to Organization

After user is created, run this SQL in SQL Editor:
```sql
UPDATE users 
SET 
  organization_id = (SELECT id FROM organizations WHERE name = 'SignalDesk Demo'),
  role = 'admin',
  full_name = 'Admin User'
WHERE email = 'admin2@signaldesk.com';
```

## Step 3: Edge Functions Deployment

### 3.1 Login to Supabase CLI

```bash
supabase login
```

### 3.2 Link Your Project

```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
supabase link --project-ref zskaxjtyuaqazydouifp
```

### 3.3 Set Environment Secrets

```bash
# Set your Anthropic API key
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3.4 Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy claude-chat
supabase functions deploy monitor-intelligence
supabase functions deploy niv-chat
```

### 3.5 Verify Deployment

Check function status:
```bash
supabase functions list
```

## Step 4: Frontend Configuration

### 4.1 Environment Variables

Ensure `.env` file has:
```env
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8
```

### 4.2 Test the Connection

Run the verification script:
```bash
npm install @supabase/supabase-js dotenv
node verify-supabase-setup.js
```

## Step 5: Enable Real-time

1. Go to **Database** > **Replication** in Supabase Dashboard
2. Enable replication for:
   - [ ] intelligence_findings
   - [ ] monitoring_runs
   - [ ] opportunity_queue

## Step 6: Optional - Storage Setup

If you need file storage:

1. Go to **Storage** in Supabase Dashboard
2. Create buckets:
   - `content-assets` - for content files
   - `organization-logos` - for org branding
3. Set policies as needed

## Verification Checklist

Run all these checks to ensure everything works:

### Database
- [ ] Can query all tables
- [ ] RLS policies are active
- [ ] Triggers work (updated_at auto-updates)

### Authentication
- [ ] admin2@signaldesk.com can login
- [ ] User profile is created in users table
- [ ] User is linked to organization

### Edge Functions
- [ ] claude-chat responds to test requests
- [ ] monitor-intelligence can create monitoring runs
- [ ] niv-chat provides strategic responses

### Real-time
- [ ] Subscriptions connect successfully
- [ ] Changes trigger real-time updates

### Frontend Integration
- [ ] Login works from the app
- [ ] Data fetching works
- [ ] Real-time updates appear
- [ ] AI features respond

## Troubleshooting

### Issue: Authentication fails
- Check user exists in Auth > Users
- Verify password is correct
- Check users table has profile

### Issue: Edge Functions return 404
- Ensure functions are deployed: `supabase functions list`
- Check function logs: `supabase functions logs function-name`

### Issue: Edge Functions return API key error
- Set the secret: `supabase secrets set ANTHROPIC_API_KEY=your_key`
- Verify: `supabase secrets list`

### Issue: Tables not accessible
- Check RLS policies are created
- Verify user has organization_id set
- Test with service role key (bypasses RLS)

### Issue: Real-time not working
- Enable replication for tables
- Check WebSocket connection in browser console
- Verify anon key has proper permissions

## Production Considerations

1. **API Keys Security**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

2. **Rate Limiting**
   - Implement rate limiting on Edge Functions
   - Monitor Claude API usage

3. **Backup Strategy**
   - Enable point-in-time recovery
   - Regular backups of critical data

4. **Monitoring**
   - Set up alerts for Edge Function errors
   - Monitor database performance
   - Track API usage and costs

5. **Scaling**
   - Consider connection pooling for high traffic
   - Optimize queries with proper indexes
   - Use caching where appropriate

## Support Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project Dashboard: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp

## Next Steps

1. Complete all setup steps above
2. Run verification script
3. Test all features in the app
4. Monitor logs for any issues
5. Set up production monitoring