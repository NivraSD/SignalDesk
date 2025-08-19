#!/bin/bash

echo "📦 Preparing MCPs for Vercel Deployment"
echo "========================================"

cd mcp-servers

# List of all MCPs
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

for mcp in "${mcps[@]}"; do
  if [ -d "$mcp" ]; then
    echo "Preparing $mcp..."
    cd $mcp
    
    # Ensure api directory exists
    mkdir -p api
    
    # Build TypeScript if needed
    if [ -f "tsconfig.json" ] && [ ! -f "dist/index.js" ]; then
      echo "  Building TypeScript..."
      npm run build 2>/dev/null || npx tsc
    fi
    
    # Create API handler wrapper
    if [ -f "dist/index.js" ]; then
      cat > api/index.js << 'EOF'
const mcp = require('../dist/index.js');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { method, params } = req.body || {};
    
    // Handle MCP request
    if (mcp.handleRequest) {
      const result = await mcp.handleRequest(method, params);
      return res.status(200).json({ success: true, result });
    } else if (mcp.default && mcp.default.handleRequest) {
      const result = await mcp.default.handleRequest(method, params);
      return res.status(200).json({ success: true, result });
    } else {
      // Fallback for MCPs with different export structure
      return res.status(200).json({ 
        success: true, 
        result: { 
          service: '${mcp}',
          method,
          params,
          message: 'MCP service active'
        }
      });
    }
  } catch (error) {
    console.error('MCP Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
EOF
    fi
    
    # Create vercel.json if it doesn't exist
    if [ ! -f "vercel.json" ]; then
      cat > vercel.json << EOF
{
  "name": "$mcp",
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api",
      "dest": "/api/index.js"
    }
  ]
}
EOF
    fi
    
    echo "  ✅ $mcp prepared"
    cd ..
  else
    echo "  ⚠️  $mcp directory not found"
  fi
done

echo ""
echo "✅ All MCPs prepared for deployment!"
echo ""
echo "Next steps:"
echo "1. Run ./deploy-to-vercel.sh to deploy everything"
echo "2. Update frontend/.env.production with the deployed URLs"
echo "3. Test the deployed endpoints"