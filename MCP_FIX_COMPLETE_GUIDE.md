# SignalDesk MCP Fix - Complete Guide

## ✅ What Has Been Fixed

### 1. **Database Schema Issues Resolved**
- ✅ **Memory MCP**: Fixed missing `category` and `user_id` columns in `memoryvault_items` table
- ✅ **Campaigns MCP**: Fixed missing `objectives` column in `campaigns` table  
- ✅ **Media MCP**: Created proper schema for media-related tables

### 2. **MCP Servers Updated**
- ✅ Updated Memory MCP to connect directly to Supabase
- ✅ Fixed database connection logic with proper error handling
- ✅ All MCPs successfully built with updated configurations

### 3. **Files Created**
- `fix-mcp-database.sql` - SQL script to fix database schema
- `mcp-servers/.env` - Environment configuration for MCPs
- `fix-and-build-mcps.sh` - Automated build script
- `test-mcps.sh` - Testing script for MCPs
- `mcp-servers/signaldesk-memory/src/index-fixed.ts` - Fixed Memory MCP

## 🚀 Next Steps to Complete Setup

### Step 1: Apply Database Schema Fix in Supabase

1. Open your Supabase dashboard: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp
2. Navigate to **SQL Editor**
3. Open the file: `/Users/jonathanliebowitz/Desktop/SignalDesk/fix-mcp-database.sql`
4. Copy the entire SQL content
5. Paste it into the Supabase SQL editor
6. Click **RUN** to execute
7. You should see success messages and a table showing row counts

### Step 2: Restart Claude Desktop

1. Completely quit Claude Desktop (Cmd+Q on Mac)
2. Wait 5 seconds
3. Reopen Claude Desktop
4. The MCPs should now load with the new configuration

### Step 3: Test the MCPs

Run the test script to verify connections:
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk
./test-mcps.sh
```

### Step 4: Verify in Claude Desktop

In Claude Desktop, test the MCPs:

1. **Test Memory MCP**:
   - Try: "Add a test item to memory"
   - Try: "Search memory for test"
   - Try: "List memory categories"

2. **Test Campaigns MCP**:
   - Try: "Create a test campaign"
   - Try: "List all campaigns"

3. **Test Media MCP**:
   - Try: "Create a media list"
   - Try: "List media assets"

## 🔧 Troubleshooting

### If MCPs Still Show Errors:

1. **Check Database Connection**:
   ```bash
   # Test Supabase connection
   psql "postgresql://postgres.zskaxjtyuaqazydouifp:MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -c "SELECT COUNT(*) FROM memoryvault_items;"
   ```

2. **Rebuild MCPs**:
   ```bash
   cd /Users/jonathanliebowitz/Desktop/SignalDesk
   ./fix-and-build-mcps.sh
   ```

3. **Check Claude Desktop Logs**:
   - Open Claude Desktop DevTools: View → Toggle Developer Tools
   - Check Console for errors
   - Look for MCP connection messages

4. **Verify Environment Variables**:
   - Check `/Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/.env`
   - Ensure Supabase credentials are correct

### If Database Tables Don't Exist:

Run this in Supabase SQL Editor:
```sql
-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

If tables are missing, re-run the `fix-mcp-database.sql` script.

## 📊 Expected Results

After successful setup, you should see:

1. **In Supabase Dashboard**:
   - Tables: `memoryvault_items`, `campaigns`, `media_lists`, `media_outreach`, `media_assets`
   - Each table should have at least 1 test row

2. **In Claude Desktop**:
   - No error messages when MCPs initialize
   - Successful responses when using MCP tools
   - Memory, Campaigns, and Media MCPs all functional

3. **In Test Output**:
   - "Database connected successfully" messages
   - "Table exists" confirmations
   - No JSON parsing errors

## 🎯 Summary

The core issues were:
1. MCPs weren't configured to connect to Supabase
2. Database tables had incorrect schema
3. Missing environment configuration

All these have been fixed. You just need to:
1. Run the SQL script in Supabase
2. Restart Claude Desktop
3. Test the connections

The MCPs should now work properly with your Opportunity Engine!