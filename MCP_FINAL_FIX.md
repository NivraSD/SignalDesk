# Final MCP Fix Instructions

## The Issue
The "unexpected token" error is caused by console.log statements in the MCP servers that break the JSON-RPC protocol. I've already removed these.

## Database Connection Issue
The Supabase connection is failing with "Tenant or user not found". This means the database password in the MCP connection string is incorrect.

## Solution

### Step 1: Get Your Correct Supabase Database Password

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/settings/database
2. Find the **Database Password** (not the API keys)
3. Copy the password

### Step 2: Update MCP Database Connection

Create a file `/Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/.env.local` with:

```env
# Replace YOUR_ACTUAL_DB_PASSWORD with the password from Supabase dashboard
SUPABASE_DB_PASSWORD=YOUR_ACTUAL_DB_PASSWORD
SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8
```

### Step 3: Update MCP Source Files

Run this command to update the password in all MCP files:

```bash
# Replace YOUR_ACTUAL_DB_PASSWORD with your real password
export DB_PASS="YOUR_ACTUAL_DB_PASSWORD"

# Update Memory MCP
sed -i '' "s/MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV/$DB_PASS/g" /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-memory/src/index.ts

# Update other MCPs if needed
for mcp in campaigns media; do
  if grep -q "MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV" /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-$mcp/src/index.ts; then
    sed -i '' "s/MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV/$DB_PASS/g" /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-$mcp/src/index.ts
  fi
done
```

### Step 4: Rebuild MCPs

```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers

for mcp in signaldesk-memory signaldesk-campaigns signaldesk-media; do
  echo "Building $mcp..."
  cd $mcp
  npm run build
  cd ..
done
```

### Step 5: Test Connection

```bash
# Test database connection
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres.zskaxjtyuaqazydouifp:YOUR_ACTUAL_DB_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } }); pool.query('SELECT COUNT(*) FROM memoryvault_items').then(r => console.log('✅ DB Connected! Rows:', r.rows[0].count)).catch(e => console.log('❌ Error:', e.message))"
```

### Step 6: Restart Claude Desktop

1. Completely quit Claude Desktop (Cmd+Q)
2. Reopen Claude Desktop
3. Test the MCPs

## Alternative: Use Supabase Client Instead

If direct database connection doesn't work, we can modify the MCPs to use the Supabase JavaScript client instead:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYnNlIiwicmVmIjoienNrYXhqdHl1YXFhenlkb3VpZnAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
);

// Then use:
const { data, error } = await supabase
  .from('memoryvault_items')
  .select('*')
  .ilike('title', `%${query}%`);
```

This approach doesn't require the database password and uses the public API.

## Summary

The main issues were:
1. ✅ Console.log statements breaking JSON-RPC (fixed)
2. ✅ Missing database columns (fixed with SQL)
3. ❌ Wrong database password in connection string (needs your input)

Once you update the database password, your MCPs should work!