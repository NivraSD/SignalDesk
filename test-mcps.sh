#!/bin/bash

echo "Testing MCP Servers..."
echo "======================"

# Test Memory MCP
echo -e "\nTesting Memory MCP..."
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-memory/dist/index.js 2>&1 | head -20

# Test Campaigns MCP
echo -e "\nTesting Campaigns MCP..."
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-campaigns/dist/index.js 2>&1 | head -20

# Test Media MCP
echo -e "\nTesting Media MCP..."
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{}},"id":1}' | node /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-media/dist/index.js 2>&1 | head -20

echo -e "\nTest complete!"
