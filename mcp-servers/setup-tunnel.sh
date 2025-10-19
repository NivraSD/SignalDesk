#!/bin/bash

# SignalDesk MCP Tunnel Setup Script
# This script sets up tunnels to expose local MCP servers to the internet

echo "🚀 SignalDesk MCP Tunnel Setup"
echo "================================"
echo ""

# Check which tunnel service to use
if command -v ngrok &> /dev/null; then
    TUNNEL_SERVICE="ngrok"
elif command -v lt &> /dev/null; then
    TUNNEL_SERVICE="localtunnel"
elif command -v cloudflared &> /dev/null; then
    TUNNEL_SERVICE="cloudflare"
else
    echo "❌ No tunnel service found!"
    echo ""
    echo "Please install one of the following:"
    echo "  1. ngrok: brew install ngrok"
    echo "  2. localtunnel: npm install -g localtunnel"
    echo "  3. cloudflared: brew install cloudflare/cloudflare/cloudflared"
    exit 1
fi

echo "✅ Using tunnel service: $TUNNEL_SERVICE"
echo ""

# Function to start ngrok tunnel
start_ngrok() {
    local port=$1
    local name=$2
    
    echo "Starting ngrok tunnel for $name on port $port..."
    
    # For ngrok, we'll start a single tunnel (free tier limitation)
    # You can upgrade to paid ngrok for multiple tunnels
    echo "Starting ngrok tunnel for port $port..."
    ngrok http $port &
    NGROK_PID=$!
    
    echo "⏳ Waiting for ngrok to start..."
    sleep 5
    
    # Get tunnel URLs from ngrok API
    echo ""
    echo "📡 Tunnel URLs:"
    curl -s http://localhost:4040/api/tunnels | python3 -m json.tool | grep public_url
}

# Function to start localtunnel
start_localtunnel() {
    local port=$1
    local name=$2
    local subdomain=$(echo $name | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    
    echo "Starting localtunnel for $name on port $port..."
    lt --port $port --subdomain "signaldesk-$subdomain" &
    
    echo "📡 Tunnel URL: https://signaldesk-$subdomain.loca.lt"
}

# Function to start cloudflare tunnel
start_cloudflare() {
    local port=$1
    local name=$2
    
    echo "Starting Cloudflare tunnel for $name on port $port..."
    cloudflared tunnel --url http://localhost:$port &
}

# Start tunnels based on service
case $TUNNEL_SERVICE in
    ngrok)
        start_ngrok 3010 "Opportunities"
        ;;
    localtunnel)
        # Start multiple localtunnel instances
        start_localtunnel 3010 "opportunities" &
        start_localtunnel 3011 "orchestrator" &
        start_localtunnel 3012 "intelligence" &
        start_localtunnel 3013 "media" &
        ;;
    cloudflare)
        # Start multiple cloudflare tunnels
        start_cloudflare 3010 "opportunities" &
        start_cloudflare 3011 "orchestrator" &
        start_cloudflare 3012 "intelligence" &
        ;;
esac

echo ""
echo "✅ Tunnels started!"
echo ""
echo "Next steps:"
echo "1. Copy the tunnel URLs above"
echo "2. Update Supabase Edge Function environment variables:"
echo "   - Go to https://supabase.com/dashboard"
echo "   - Select your project"
echo "   - Go to Edge Functions > mcp-bridge"
echo "   - Add environment variables:"
echo "     MCP_OPPORTUNITIES_URL=<your-tunnel-url>"
echo "     MCP_ORCHESTRATOR_URL=<your-tunnel-url>"
echo "     etc."
echo ""
echo "Or update locally with:"
echo "supabase secrets set MCP_OPPORTUNITIES_URL=<url>"
echo ""
echo "Press Ctrl+C to stop tunnels"

# Keep script running
wait