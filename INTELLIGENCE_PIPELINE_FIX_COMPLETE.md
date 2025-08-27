# SignalDesk Intelligence Pipeline Fix Guide - Complete Solution

## Problem Summary
The SignalDesk intelligence pipeline is failing with 500 errors because the Supabase database tables don't match what the Edge Functions expect. The tables are either missing or have incorrect column names.

## Quick Fix (3 Steps)

### Step 1: Check Current Tables
Open in browser: `/Users/jonathanliebowitz/Desktop/SignalDesk/check-supabase-tables.html`
- This shows what tables currently exist in your database

### Step 2: Create Missing Tables
1. Go to: https://app.supabase.com
2. Navigate to SQL Editor
3. Copy ALL contents from: `/Users/jonathanliebowitz/Desktop/SignalDesk/create-intelligence-pipeline-tables.sql`
4. Paste and run in SQL Editor
5. You should see success messages for each table created

### Step 3: Test the Fix
Open in browser: `/Users/jonathanliebowitz/Desktop/SignalDesk/test-intelligence-pipeline-complete.html`
1. Click "Test Individual Stages" - All should show ✅
2. Click "Run Full Pipeline" - All stages should turn green
3. Click "Check Monitoring" - Should show configured sources

## Required Tables (Created by SQL Script)

### Core Intelligence Tables
1. **organization_profiles** - Stores org metadata
2. **intelligence_stage_data** - Pipeline stage results
3. **intelligence_targets** - Competitors and stakeholders
4. **intelligence_findings** - Collected signals
5. **monitoring_configs** - Tool configurations
6. **source_registry** - RSS/website sources
7. **organizations** - Main org registry
8. **monitoring_alerts** - System alerts

## Files You'll Use

### 1. Diagnostic Tool
**File:** `check-supabase-tables.html`
- Shows all tables in your database
- Checks if required tables exist
- Displays column information
- Has buttons to create missing tables

### 2. Table Creation Script
**File:** `create-intelligence-pipeline-tables.sql`
- Creates all 8 required tables
- Sets up proper indexes
- Enables Row Level Security
- Creates update triggers
- Inserts test data for Sprout Social

### 3. Pipeline Test Tool
**File:** `test-intelligence-pipeline-complete.html`
- Tests each pipeline stage
- Shows visual progress indicators
- Tests database operations
- Verifies monitoring tools
- Displays collected data

## Expected Results After Fix

### ✅ Successful Pipeline Run
1. **Discovery Stage** - Fetches org details
2. **Collection Stage** - Gathers signals from sources
3. **Competitors Stage** - Analyzes competition
4. **Audience Stage** - Identifies stakeholders
5. **Synthesis Stage** - Combines all insights

### ✅ Working Database Operations
- Organization profiles save correctly
- Stage data persists between runs
- Intelligence targets update
- Monitoring configs active
- Findings accumulate over time

## Troubleshooting

### If SQL Script Fails
**Error:** "relation already exists"
- This is OK - table already created
- Continue with other tables

**Error:** "permission denied"
- Check you're in the right project
- Ensure you have admin access

### If Pipeline Tests Fail
**500 Errors on Edge Functions:**
- Tables not created yet - Run SQL script
- Wrong Supabase project - Check URL
- RLS policies blocking - Check Dashboard

**No Data in Results:**
- No monitoring sources configured
- Add sources to `source_registry` table
- Check Firecrawl API key validity

### If Monitoring Not Working
**No RSS Sources Found:**
```sql
-- Add this in SQL Editor
INSERT INTO source_registry (organization_name, source_type, source_url)
VALUES ('Sprout Social', 'rss', 'https://sproutsocial.com/insights/feed/');
```

**Firecrawl API Failing:**
- Check API key: `fc-3048810124b640eb99293880a4ab25d0`
- Verify credits available
- Test with simple URL first

## Connection Details

```javascript
SUPABASE_URL: https://zskaxjtyuaqazydouifp.supabase.co
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Edge Functions Involved

1. `/intelligence-discovery-v3` - Organization discovery
2. `/intelligence-collection-v1` - Signal collection
3. `/intelligence-stage-1-competitors` - Competitor analysis
4. `/intelligence-stage-2-audience` - Audience insights
5. `/intelligence-stage-5-synthesis` - Final synthesis
6. `/intelligence-persistence` - Data persistence layer

## Success Criteria

You know the fix worked when:
1. ✅ All tables show as "Exists" in diagnostic tool
2. ✅ "Test Individual Stages" shows all green checks
3. ✅ "Run Full Pipeline" completes without errors
4. ✅ Data appears in the Results section
5. ✅ No 500 errors in browser console

## Next Steps After Fix

1. **Add More Organizations:**
```sql
INSERT INTO organizations (name, domain, industry)
VALUES ('Buffer', 'buffer.com', 'Social Media Management');
```

2. **Configure More Sources:**
```sql
INSERT INTO source_registry (organization_name, source_type, source_url)
VALUES ('Buffer', 'website', 'https://buffer.com');
```

3. **Set Up Scheduled Runs:**
- Use Supabase Cron Jobs
- Or external scheduler calling Edge Functions

4. **Monitor Pipeline Health:**
- Check `monitoring_alerts` table
- Review `intelligence_findings` for quality
- Track pipeline completion rates

## Quick Commands

```bash
# Open diagnostic tool
open /Users/jonathanliebowitz/Desktop/SignalDesk/check-supabase-tables.html

# Open test tool
open /Users/jonathanliebowitz/Desktop/SignalDesk/test-intelligence-pipeline-complete.html

# View SQL script
cat /Users/jonathanliebowitz/Desktop/SignalDesk/create-intelligence-pipeline-tables.sql
```

## Support Resources

- Supabase Dashboard: https://app.supabase.com
- Edge Function Logs: Dashboard > Functions > Logs
- Database Tables: Dashboard > Table Editor
- SQL Editor: Dashboard > SQL Editor

---

**Remember:** The main issue is missing tables. Once you run the SQL script, everything should work!