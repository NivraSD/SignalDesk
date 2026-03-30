# Complete Supabase Fix Guide for SignalDesk

## Problem Summary
Your Supabase connection is broken due to:
1. **Invalid API Key** - The anon key in your .env file is either incorrect or the project doesn't exist
2. **Missing Database Tables** - Tables need to be created
3. **Missing Edge Functions** - Functions need to be deployed

## Solution Steps

### Step 1: Verify Your Supabase Project

1. **Check if your project exists:**
   - Go to: https://app.supabase.com/projects
   - Look for project with URL: `https://zskaxjtyuaqazydouifp.supabase.co`
   
2. **If project doesn't exist:**
   - You'll need to create a new project
   - Update all references to the new project URL and keys

3. **If project exists:**
   - Continue to Step 2

### Step 2: Get Correct API Keys

1. Go to your project settings:
   ```
   https://app.supabase.com/project/zskaxjtyuaqazydouifp/settings/api
   ```

2. Copy these keys:
   - **Project URL**: Should match `https://zskaxjtyuaqazydouifp.supabase.co`
   - **anon public**: This is your public API key
   - **service_role**: Keep this secret! Only for server-side use

3. Update your `.env` file:
   ```env
   REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
   ```

4. **IMPORTANT**: If the project URL is different, you need to update it everywhere

### Step 3: Create Database Tables

1. Go to SQL Editor:
   ```
   https://app.supabase.com/project/zskaxjtyuaqazydouifp/sql/new
   ```

2. Copy the entire contents of `setup-supabase-complete.sql`

3. Paste and run the SQL script

4. Verify tables were created:
   ```
   https://app.supabase.com/project/zskaxjtyuaqazydouifp/editor
   ```

### Step 4: Deploy Edge Functions

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref zskaxjtyuaqazydouifp
   ```

4. Deploy functions:
   ```bash
   supabase functions deploy claude-integration
   supabase functions deploy monitor-intelligence
   ```

5. Set environment variables:
   ```bash
   supabase secrets set CLAUDE_API_KEY=your-anthropic-api-key
   ```

#### Option B: Manual Deployment

1. Go to Edge Functions:
   ```
   https://app.supabase.com/project/zskaxjtyuaqazydouifp/functions
   ```

2. Create new function: `claude-integration`
   - Copy code from `supabase/functions/claude-integration/index.ts`

3. Create new function: `monitor-intelligence`
   - Copy code from `supabase/functions/monitor-intelligence/index.ts`

4. Set environment variables in Vault:
   ```
   https://app.supabase.com/project/zskaxjtyuaqazydouifp/settings/vault
   ```
   - Add: `CLAUDE_API_KEY` = your Anthropic API key

### Step 5: Configure Authentication

1. Go to Authentication settings:
   ```
   https://app.supabase.com/project/zskaxjtyuaqazydouifp/auth/configuration
   ```

2. Configure email settings:
   - Enable email confirmations (or disable for testing)
   - Set up SMTP if needed

3. Create a test user:
   ```
   https://app.supabase.com/project/zskaxjtyuaqazydouifp/auth/users
   ```
   - Click "Add user"
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Auto confirm user: Yes (for testing)

### Step 6: Test Everything

1. Run the verification script:
   ```bash
   node verify-supabase-fix.js
   ```

2. All checks should pass:
   - ✅ API Key is valid
   - ✅ All tables exist
   - ✅ Edge functions deployed
   - ✅ Authentication working

### Step 7: Update Your Application

1. Restart your React app:
   ```bash
   npm start
   ```

2. Test login with your test user

3. Verify data is loading correctly

## Quick Test Commands

Test your Supabase connection:
```bash
# Test API connection
curl https://zskaxjtyuaqazydouifp.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test Edge Function
curl https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-integration \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'
```

## Common Issues

### Issue: "Invalid API key"
**Solution**: Your project might have been deleted or the key is wrong. Create a new project or get the correct key.

### Issue: "relation does not exist"
**Solution**: Tables haven't been created. Run the SQL setup script.

### Issue: "Edge function not found"
**Solution**: Functions haven't been deployed. Use the deployment script or deploy manually.

### Issue: "Row Level Security policy violation"
**Solution**: RLS is blocking access. Make sure you're authenticated or adjust RLS policies.

## Alternative: Create New Project

If the current project is inaccessible, create a new one:

1. Go to: https://app.supabase.com/projects
2. Click "New Project"
3. Name: "SignalDesk"
4. Database Password: (save this!)
5. Region: Choose closest to you
6. Click "Create new project"
7. Update all configuration with new URL and keys
8. Run the setup SQL script
9. Deploy edge functions
10. Test everything

## Support Files Created

- `setup-supabase-complete.sql` - Complete database setup
- `deploy-edge-functions.sh` - Automated deployment script
- `verify-supabase-fix.js` - Verification tool
- `test-supabase-connection.js` - Detailed connection tester
- `supabase/functions/claude-integration/index.ts` - Claude AI integration
- `supabase/functions/monitor-intelligence/index.ts` - Intelligence monitoring

## Next Steps

After everything is working:
1. Create real user accounts
2. Set up proper organizations
3. Configure real API keys (Claude, etc.)
4. Set up monitoring and alerts
5. Configure backups
6. Review and adjust RLS policies for production