#!/bin/bash

# SignalDesk Quick Deploy Script
echo "🚀 SignalDesk Quick Deploy to Railway"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}This script will deploy SignalDesk with all fixes to Railway${NC}"
echo ""
echo "Before running this script, ensure you have:"
echo "1. Railway CLI installed (brew install railway)"
echo "2. Logged into Railway (railway login)"
echo "3. Linked to your project (railway link)"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Step 1: Commit all fixes
echo "📝 Committing all fixes..."
git add -A
git commit -m "Deploy: Critical fixes for Claude functionality on Railway

- Fixed route conflicts by disabling enhancedClaudeRoutes
- Added Claude initialization validation
- Added comprehensive health monitoring
- Added deployment verification endpoints
- Configured proper environment variables
- Added Claude test endpoint at /api/claude-test" || echo "No changes to commit"

echo -e "${GREEN}✅ Changes committed${NC}"
echo ""

# Step 2: Deploy to Railway
echo "🚂 Deploying to Railway..."
railway up

echo ""
echo -e "${GREEN}✅ Deployment started${NC}"
echo ""

# Step 3: Show next steps
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Go to Railway Dashboard and set these environment variables:"
echo ""
echo -e "${YELLOW}ANTHROPIC_API_KEY${NC}"
echo "Check .env.local file for your actual API key"
echo ""
echo -e "${YELLOW}NODE_ENV${NC}"
echo "production"
echo ""
echo -e "${YELLOW}CLAUDE_MODEL${NC}"
echo "claude-3-5-sonnet-20241022"
echo ""
echo "2. After setting variables, redeploy from Railway dashboard"
echo ""
echo "3. Test your deployment:"
echo "   - Health check: https://your-app.railway.app/api/health/detailed"
echo "   - Claude test: https://your-app.railway.app/api/claude-test"
echo "   - Monitor: https://your-app.railway.app/api/monitor/live"
echo ""
echo "4. Verify all features work:"
echo "   - Crisis Management (/crisis)"
echo "   - Content Generator (/content)"
echo "   - Media List Builder (/media)"
echo "   - Campaign Intelligence (/campaigns)"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"