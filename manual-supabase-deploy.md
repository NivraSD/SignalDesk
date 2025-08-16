# Manual Supabase Function Deployment

Since `supabase link` is failing, you need to manually deploy the strategic-planning function:

## Steps:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions

2. **Create a new function**:
   - Click "Create Function"
   - Name: `strategic-planning`
   - Copy the contents from: `/Users/jonathanliebowitz/Desktop/SignalDesk/frontend/frontend/supabase/functions/strategic-planning/index.ts`

3. **Deploy the function**:
   - Paste the code
   - Click "Deploy"

## Alternative: Fix via Supabase CLI

```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend/frontend
supabase login
supabase functions deploy strategic-planning --project-ref zskaxjtyuaqazydouifp
```

## Environment Variables Needed:
Make sure these are set in Supabase Dashboard > Settings > Functions:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Once deployed, the Strategic Planning feature will work!