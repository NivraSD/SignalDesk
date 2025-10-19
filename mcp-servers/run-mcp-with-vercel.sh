#!/bin/bash

# Run MCP servers using Vercel dev with public URL
# This is the simplest approach - uses Vercel's built-in tunneling

echo "🚀 Starting MCP Servers with Vercel Dev"
echo "========================================"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "Please install: npm install -g vercel"
    exit 1
fi

# Function to start MCP with Vercel dev
start_mcp_vercel() {
    local mcp_name=$1
    local port=$2
    
    echo "Starting $mcp_name on port $port..."
    cd "signaldesk-$mcp_name"
    
    # Start vercel dev with public URL
    vercel dev --listen $port --yes &
    
    cd ..
}

# Navigate to MCP servers directory
cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers

# Start priority MCPs
echo "Starting priority MCP servers..."
echo ""

start_mcp_vercel "opportunities" 3010
sleep 2
start_mcp_vercel "orchestrator" 3011
sleep 2
start_mcp_vercel "intelligence" 3012
sleep 2
start_mcp_vercel "media" 3013
sleep 2

echo ""
echo "✅ MCP servers running!"
echo ""
echo "📡 Local URLs:"
echo "  - Opportunities: http://localhost:3010"
echo "  - Orchestrator: http://localhost:3011"
echo "  - Intelligence: http://localhost:3012"
echo "  - Media: http://localhost:3013"
echo ""
echo "To deploy to Vercel for production access:"
echo "  cd signaldesk-opportunities && vercel --prod"
echo ""
echo "Press Ctrl+C to stop all servers"

# Keep running
wait