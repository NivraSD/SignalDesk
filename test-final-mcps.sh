#!/bin/bash

echo "Testing MCP Connections to Supabase..."
echo "======================================="

# Test database connection first
echo -e "\n1. Testing Database Connection..."
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:habku2-gotraf-suVhan@db.zskaxjtyuaqazydouifp.supabase.co:5432/postgres', ssl: { rejectUnauthorized: false } }); pool.query('SELECT COUNT(*) FROM memoryvault_items').then(r => console.log('✅ Database OK! memoryvault_items rows:', r.rows[0].count)).catch(e => console.log('❌ Error:', e.message))"

node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:habku2-gotraf-suVhan@db.zskaxjtyuaqazydouifp.supabase.co:5432/postgres', ssl: { rejectUnauthorized: false } }); pool.query('SELECT COUNT(*) FROM campaigns').then(r => console.log('✅ Database OK! campaigns rows:', r.rows[0].count)).catch(e => console.log('❌ Error:', e.message))"

# Test MCP initialization (they should respond with JSON-RPC)
echo -e "\n2. Testing MCP JSON-RPC Protocol..."

echo -e "\nMemory MCP:"
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | timeout 1 node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-memory/dist/index.js 2>/dev/null | grep -q "result" && echo "✅ Memory MCP responds correctly" || echo "❌ Memory MCP not responding"

echo -e "\nCampaigns MCP:"
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | timeout 1 node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-campaigns/dist/index.js 2>/dev/null | grep -q "result" && echo "✅ Campaigns MCP responds correctly" || echo "❌ Campaigns MCP not responding"

echo -e "\nMedia MCP:"
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | timeout 1 node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-media/dist/index.js 2>/dev/null | grep -q "result" && echo "✅ Media MCP responds correctly" || echo "❌ Media MCP not responding"

echo -e "\n======================================="
echo "Test Complete!"
echo ""
echo "If all tests show ✅, your MCPs are ready!"
echo "Please restart Claude Desktop now."