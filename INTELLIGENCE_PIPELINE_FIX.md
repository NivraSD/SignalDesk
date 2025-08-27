# Intelligence Pipeline Database Fix Guide

## Problem Summary
Your Edge Functions are failing with 500 errors because they expect specific tables with specific columns that don't exist in your Supabase database.

## Required Tables and Columns

### 1. **organization_profiles** 
Expected by Edge Functions with these columns:
- `organization_name` (TEXT) - **CRITICAL**: This is what Edge Functions use as the key
- `profile_data` (JSONB) - Stores all organization metadata

### 2. **intelligence_stage_data**
Used to store intermediate pipeline results:
- `organization_name` (TEXT)
- `stage_name` (TEXT)
- `stage_data` (JSONB)
- `metadata` (JSONB)

### 3. **intelligence_targets**
Defines what to monitor:
- `organization_name` (TEXT)
- `competitors` (TEXT[])
- `stakeholders` (TEXT[])

### 4. **source_registry**
Manages data sources:
- `organization_name` (TEXT)
- `source_type` (TEXT)
- `source_name` (TEXT)
- Configuration fields

### 5. **monitoring_results**
Stores monitoring outputs:
- `organization_name` (TEXT)
- `monitoring_type` (TEXT)
- `findings` (JSONB)
- Other metadata

## Step-by-Step Fix Instructions

### Step 1: Connect to Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project (zskaxjtyuaqazydouifp)
3. Navigate to SQL Editor in the left sidebar

### Step 2: Run the Fix Script
1. Copy the entire contents of `fix-intelligence-pipeline-tables.sql`
2. Paste it into the SQL Editor
3. Click "Run" or press Cmd/Ctrl + Enter
4. You should see success messages in the output

### Step 3: Verify the Setup
1. Run the contents of `verify-intelligence-tables.sql`
2. Check that all tables show as existing
3. Verify that test data was inserted

### Step 4: Test with the HTML Tool
1. Open `test-intelligence-tables.html` in your browser
2. Enter your Supabase URL: `https://zskaxjtyuaqazydouifp.supabase.co`
3. Enter your Supabase anon key (get from Supabase Dashboard > Settings > API)
4. Click "Run All Tests"
5. All tests should pass with green checkmarks

### Step 5: Test Edge Functions
After tables are created, your Edge Functions should work. Test by:
```bash
# Call an edge function directly
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/your-function-name \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"organization_name": "test-org"}'
```

## Common Issues and Solutions

### Issue: "column does not exist" errors
**Solution**: The table exists but is missing required columns. The fix script handles this by:
- Checking if columns exist before adding them
- Using safe ALTER TABLE ADD COLUMN IF NOT EXISTS logic

### Issue: 500 errors from Edge Functions
**Solution**: Usually means:
1. Tables don't exist - Run the fix script
2. RLS policies blocking access - The script sets up permissive policies for testing
3. Wrong column names - Script ensures exact column names Edge Functions expect

### Issue: "permission denied" errors
**Solution**: The fix script includes:
- GRANT statements for anon/authenticated roles
- Permissive RLS policies for testing (replace with proper auth later)

## What the Fix Script Does

1. **Creates all required tables** with correct column names and types
2. **Adds missing columns** to existing tables safely
3. **Sets up indexes** for performance
4. **Enables Row Level Security** with permissive policies for testing
5. **Inserts test data** to verify everything works
6. **Grants permissions** to anon and authenticated roles

## Security Note
⚠️ **IMPORTANT**: The current RLS policies allow anonymous access for testing. Before production:
1. Replace the permissive policies with proper authentication-based policies
2. Restrict access based on organization membership
3. Add proper user authentication checks

## Testing Checklist

- [ ] Run `fix-intelligence-pipeline-tables.sql` in Supabase SQL Editor
- [ ] Run `verify-intelligence-tables.sql` to check setup
- [ ] Open `test-intelligence-tables.html` and run all tests
- [ ] Test Edge Functions with curl or your application
- [ ] Verify no more 500 errors
- [ ] Check that data flows through the pipeline

## Next Steps

After fixing the tables:
1. Update Edge Functions to handle any edge cases
2. Implement proper authentication and RLS policies
3. Add data validation in Edge Functions
4. Set up monitoring and error handling
5. Create backup and recovery procedures

## Support

If issues persist after running these fixes:
1. Check Supabase Dashboard > Logs for detailed error messages
2. Verify your Edge Functions are using correct table/column names
3. Ensure your Supabase project is active and not paused
4. Check that you're using the correct project URL and keys

## Files Created

1. **fix-intelligence-pipeline-tables.sql** - Main fix script to run
2. **verify-intelligence-tables.sql** - Verification queries
3. **test-intelligence-tables.html** - Interactive testing tool
4. **INTELLIGENCE_PIPELINE_FIX.md** - This documentation

Run these in order and your intelligence pipeline should be working!