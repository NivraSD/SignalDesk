# Deploy Niv Database Edge Function

Since Supabase CLI is having issues, deploy the edge function manually through the dashboard:

## Steps to Deploy:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp
   - Go to "Edge Functions" in the sidebar

2. **Create New Function**
   - Click "New Function"
   - Name it: `niv-database`

3. **Copy Function Code**
   - Copy ALL the code from: `frontend/supabase/functions/niv-database/index.ts`
   - Paste it into the editor

4. **Set Environment Variables**
   - Make sure these are set in your Edge Function environment:
     - `CLAUDE_API_KEY` (your Anthropic API key)
     - `SUPABASE_URL` (already set)
     - `SUPABASE_SERVICE_ROLE_KEY` (already set)

5. **Deploy**
   - Click "Deploy Function"

## Alternative: Deploy via Dashboard SQL Editor

If the above doesn't work, you can also deploy via SQL:

```sql
-- This creates the edge function via SQL
SELECT extensions.create_function(
  'niv-database',
  $$
  -- Paste the TypeScript code here
  $$,
  'ts'
);
```

## Test the Deployment

Once deployed, test at: http://localhost:3000/niv-database

The interface should:
1. ✅ Show chat interface
2. ✅ Save messages to database (no realtime needed)
3. ✅ Create artifacts when strategic content is detected
4. ✅ Display artifacts in the right panel

## Troubleshooting

If you get CORS errors:
- Make sure the Edge Function has proper CORS headers (already included in code)

If you get 404 errors:
- Make sure the tables were created (run CREATE_NIV_TABLES_SAFE.sql)

If you get authentication errors:
- Check that RLS is disabled on the tables (for testing)