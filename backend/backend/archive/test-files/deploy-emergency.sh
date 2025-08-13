#!/bin/bash

# Emergency Railway Deployment Script
# Forces a complete rebuild and deployment to Railway

echo "🚨 EMERGENCY RAILWAY DEPLOYMENT 🚨"
echo "=================================="
echo "Time: $(date)"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Generate unique deployment marker
DEPLOYMENT_MARKER="DEPLOYMENT_$(date +%s)_$(openssl rand -hex 4)"

echo "📝 Creating deployment marker: $DEPLOYMENT_MARKER"
echo ""

# Step 1: Stage all changes
echo "1️⃣  Staging all changes..."
git add -A

# Step 2: Create commit with deployment marker
echo "2️⃣  Creating commit with cache-busting marker..."
git commit -m "🚀 EMERGENCY DEPLOYMENT: $DEPLOYMENT_MARKER

- Force Railway cache invalidation
- Deploy version endpoint for verification
- Fix conversation state and content generation
- Cache buster: $(date +%s)"

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠️  No changes to commit (already committed)${NC}"
fi

# Step 3: Push to GitHub
echo "3️⃣  Pushing to GitHub..."
git push origin main --force-with-lease

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to push to GitHub${NC}"
  echo "Try: git push origin main --force"
  exit 1
fi

# Step 4: Deploy to Railway
echo "4️⃣  Deploying to Railway..."
echo "   Using 'railway up --detach' for clean deployment"

# Check if railway CLI is available
if command -v railway &> /dev/null; then
  railway up --detach
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Railway deployment initiated${NC}"
  else
    echo -e "${RED}❌ Railway deployment failed${NC}"
    echo "Try running: railway up"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  Railway CLI not found${NC}"
  echo "The code has been pushed to GitHub."
  echo "Railway should auto-deploy from the GitHub webhook."
fi

# Step 5: Monitor deployment
echo ""
echo "5️⃣  Monitoring deployment..."
echo "   Waiting 30 seconds for Railway to start building..."
sleep 30

# Check Railway logs if CLI is available
if command -v railway &> /dev/null; then
  echo ""
  echo "📋 Recent Railway logs:"
  railway logs --tail 20
fi

echo ""
echo "========================================="
echo "  DEPLOYMENT INITIATED"
echo "========================================="
echo ""
echo "✅ Code pushed to GitHub"
echo "✅ Railway deployment triggered"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for Railway to complete deployment"
echo "2. Monitor deployment at: https://railway.app/dashboard"
echo "3. Run verification: ./verify-railway-deployment.sh"
echo "4. Check version endpoint: curl https://signaldesk-production.up.railway.app/api/version"
echo ""
echo "Deployment marker: $DEPLOYMENT_MARKER"
echo "Look for this marker in the deployment logs to confirm new build."
echo ""

# Optional: Auto-run verification after delay
echo "Do you want to automatically verify deployment in 3 minutes? (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
  echo "⏱️  Will verify deployment in 3 minutes..."
  sleep 180
  echo ""
  echo "Running verification..."
  ./verify-railway-deployment.sh
fi