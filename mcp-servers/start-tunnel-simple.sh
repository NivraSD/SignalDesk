#!/bin/bash

# Simple tunnel setup for SignalDesk MCPs
# Runs one tunnel at a time (free ngrok limitation)

echo "🚀 SignalDesk MCP Tunnel Setup (Simple)"
echo "========================================"
echo ""

# Default to opportunities MCP
PORT=${1:-3010}
NAME=${2:-opportunities}

echo "Starting tunnel for $NAME MCP on port $PORT"
echo ""

# First, make sure the MCP servers are running
echo "⚠️  Make sure your MCP servers are running!"
echo "   In another terminal, run: node run-local-mcps.js"
echo ""
echo "Press Enter to continue..."
read

# Check which tunnel service is available
if command -v ngrok &> /dev/null; then
    echo "✅ Using ngrok"
    echo ""
    echo "Starting tunnel..."
    ngrok http $PORT
    
elif command -v lt &> /dev/null; then
    echo "✅ Using localtunnel"
    echo ""
    echo "Starting tunnel..."
    echo "Your URL will be: https://signaldesk-$NAME.loca.lt"
    lt --port $PORT --subdomain "signaldesk-$NAME"
    
else
    echo "❌ No tunnel service found!"
    echo ""
    echo "Please install one of the following:"
    echo ""
    echo "Option 1: Install ngrok (recommended)"
    echo "  brew install ngrok"
    echo "  ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    echo "Option 2: Install localtunnel"
    echo "  npm install -g localtunnel"
    echo ""
    exit 1
fi