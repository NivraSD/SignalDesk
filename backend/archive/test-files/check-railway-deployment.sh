#!/bin/bash

# Check Railway deployment status and logs for SignalDesk

echo "=========================================="
echo "Railway Deployment Status Check"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}1. Checking Railway CLI installation...${NC}"
if command -v railway &> /dev/null; then
    echo -e "${GREEN}✓ Railway CLI is installed${NC}"
    railway version
else
    echo -e "${RED}✗ Railway CLI not found${NC}"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

echo -e "\n${BLUE}2. Checking Railway authentication...${NC}"
if railway whoami &> /dev/null; then
    echo -e "${GREEN}✓ Authenticated to Railway${NC}"
    railway whoami
else
    echo -e "${YELLOW}⚠ Not authenticated to Railway${NC}"
    echo "Run: railway login"
    exit 1
fi

echo -e "\n${BLUE}3. Checking project status...${NC}"
railway status

echo -e "\n${BLUE}4. Checking environment variables...${NC}"
echo "Checking for required variables:"

# Check if DATABASE_URL is set
if railway variables | grep -q "DATABASE_URL"; then
    echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
else
    echo -e "${RED}✗ DATABASE_URL not found${NC}"
fi

# Check if ANTHROPIC_API_KEY is set  
if railway variables | grep -q "ANTHROPIC_API_KEY"; then
    echo -e "${GREEN}✓ ANTHROPIC_API_KEY is set${NC}"
else
    echo -e "${YELLOW}⚠ ANTHROPIC_API_KEY not found (Claude AI won't work)${NC}"
fi

# Check if JWT_SECRET is set
if railway variables | grep -q "JWT_SECRET"; then
    echo -e "${GREEN}✓ JWT_SECRET is set${NC}"
else
    echo -e "${YELLOW}⚠ JWT_SECRET not found (using default)${NC}"
fi

echo -e "\n${BLUE}5. Recent deployment logs (last 50 lines)...${NC}"
railway logs --lines 50

echo -e "\n${BLUE}6. Testing live endpoint...${NC}"
RAILWAY_URL="https://signaldesk-production.up.railway.app"

# Test health endpoint
echo "Testing: $RAILWAY_URL/api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/health")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Health endpoint is responding (HTTP $HTTP_CODE)${NC}"
    curl -s "$RAILWAY_URL/api/health" | python3 -m json.tool 2>/dev/null || curl -s "$RAILWAY_URL/api/health"
else
    echo -e "${RED}✗ Health endpoint returned HTTP $HTTP_CODE${NC}"
fi

echo -e "\n${BLUE}7. Testing login endpoint...${NC}"
echo "Testing: $RAILWAY_URL/api/auth/login"

# Test with demo credentials
LOGIN_RESPONSE=$(curl -s -X POST "$RAILWAY_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"Demo123"}' \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Login endpoint working (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
elif [ "$HTTP_CODE" = "500" ]; then
    echo -e "${RED}✗ Login endpoint returned 500 error${NC}"
    echo "Response body:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo -e "\n${YELLOW}This indicates a server error. Check the logs above for details.${NC}"
else
    echo -e "${YELLOW}⚠ Login endpoint returned HTTP $HTTP_CODE${NC}"
    echo "$BODY"
fi

echo -e "\n${BLUE}=========================================="
echo "Summary and Next Steps"
echo "==========================================${NC}"

if [ "$HTTP_CODE" = "500" ]; then
    echo -e "${YELLOW}The 500 error suggests a backend issue. Common causes:${NC}"
    echo "1. Database connection failed - check DATABASE_URL"
    echo "2. Missing dependencies - check package.json"
    echo "3. Code error - check the logs above for stack traces"
    echo ""
    echo "To fix:"
    echo "1. Redeploy with updated auth route: git push"
    echo "2. Add demo user to database: Use add-demo-user.sql"
    echo "3. Check Railway PostgreSQL is running"
    echo "4. View real-time logs: railway logs -f"
fi

echo -e "\n${BLUE}Useful Railway commands:${NC}"
echo "- View live logs: railway logs -f"
echo "- Restart service: railway restart"
echo "- Open in browser: railway open"
echo "- Connect to database: railway connect postgres"