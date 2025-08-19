#!/bin/bash

echo "🚀 Deploying SignalDesk to Vercel"
echo "================================"

# Deploy Frontend
echo "📦 Deploying Frontend..."
cd frontend
vercel --prod

# Deploy each MCP as a serverless function
echo "⚡ Deploying MCP Services..."

# List of MCPs to deploy
mcps=(
  "signaldesk-opportunities"
  "signaldesk-orchestrator"
  "signaldesk-intelligence"
  "signaldesk-media"
  "signaldesk-monitor"
  "signaldesk-entities"
  "signaldesk-crisis"
  "signaldesk-regulatory"
  "signaldesk-relationships"
  "signaldesk-social"
  "signaldesk-narratives"
  "signaldesk-stakeholder-groups"
  "signaldesk-content"
  "signaldesk-campaigns"
  "signaldesk-analytics"
  "signaldesk-memory"
  "signaldesk-scraper"
)

cd ../mcp-servers

for mcp in "${mcps[@]}"; do
  if [ -d "$mcp" ]; then
    echo "Deploying $mcp..."
    cd $mcp
    
    # Ensure api directory exists
    mkdir -p api
    
    # Copy index.js to api/index.js if not already there
    if [ ! -f "api/index.js" ] && [ -f "dist/index.js" ]; then
      cp dist/index.js api/index.js
    fi
    
    # Deploy to Vercel
    vercel --prod
    cd ..
  else
    echo "⚠️  $mcp directory not found, skipping..."
  fi
done

echo "✅ Deployment Complete!"
echo ""
echo "Your deployed URLs:"
echo "Frontend: https://signaldesk.vercel.app"
echo "MCPs: https://signaldesk-[service].vercel.app/api"
echo ""
echo "Update your frontend .env with:"
echo "REACT_APP_MCP_BASE_URL=https://signaldesk-"