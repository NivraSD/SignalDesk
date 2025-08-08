#\!/bin/bash

echo "========================================="
echo "🚀 Railway Deployment Script for SignalDesk"
echo "========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ \! -f "backend/server.js" ]; then
    echo -e "${RED}❌ Error: backend/server.js not found${NC}"
    echo "Please run this script from the SignalDesk root directory"
    exit 1
fi

echo -e "${GREEN}✅ Step 1: Directory structure verified${NC}"

# Step 2: Use Railway-optimized server
cp backend/server-railway.js backend/server.js
echo -e "${GREEN}✅ Step 2: Railway-optimized server.js in place${NC}"

# Step 3: Test the build
echo -e "${YELLOW}Step 3: Testing Docker build...${NC}"
docker build -f Dockerfile.railway -t signaldesk-test . 
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker build successful\!${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Railway deployment prepared successfully\!${NC}"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git add -A && git commit -m 'Railway deployment' && git push"
echo "2. Check Railway dashboard for deployment status"
echo "3. Verify environment variables are set in Railway"
