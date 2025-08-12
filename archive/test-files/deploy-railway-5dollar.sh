#!/bin/bash

# Railway Deployment for $5 Plan (Optimized)
echo "🚂 Railway $5 Plan Deployment (Optimized)"
echo "========================================="

cd backend

# Create minimal package.json for Railway
echo "📦 Creating optimized package.json..."
cat > railway-package.json << 'EOF'
{
  "name": "signaldesk-backend",
  "version": "1.0.0",
  "main": "railway-optimized.js",
  "scripts": {
    "start": "NODE_ENV=production node --max-old-space-size=400 railway-optimized.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.56.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "pg": "^8.16.3",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": "18.x"
  }
}
EOF

# Create Procfile for Railway
echo "📝 Creating Procfile..."
cat > Procfile << 'EOF'
web: node --max-old-space-size=400 railway-optimized.js
EOF

# Create railway.toml for configuration
echo "⚙️ Creating railway.toml..."
cat > railway.toml << 'EOF'
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node --max-old-space-size=400 railway-optimized.js"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
EOF

echo "🚀 Ready to deploy!"
echo ""
echo "Steps:"
echo "1. Run: railway login"
echo "2. Run: railway link (select your project)"
echo "3. Set environment variables:"
echo "   railway variables set NODE_ENV=production"
echo "   railway variables set ANTHROPIC_API_KEY=<your-key>"
echo "   railway variables set JWT_SECRET=<your-secret>"
echo "4. Deploy: railway up"
echo ""
echo "💡 If it still crashes on $5 plan:"
echo "   - Check logs: railway logs"
echo "   - Upgrade to $20 for 8GB RAM"
echo "   - Or use Render.com (better free tier)"