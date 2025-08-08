#!/bin/bash

# Verify Railway deployment is using server.js

echo "🔍 Checking SignalDesk API deployment..."
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check root endpoint
echo "1. Checking server type..."
response=$(curl -s https://signaldesk-api-production.up.railway.app/)

if echo "$response" | grep -q "endpoints"; then
    echo -e "${GREEN}✅ NEW server.js is running!${NC}"
    echo "$response" | python3 -m json.tool | head -20
else
    echo -e "${RED}❌ OLD index.js still running${NC}"
    echo "$response"
fi

echo ""
echo "2. Checking Claude diagnostics endpoint..."
diag_response=$(curl -s -o /dev/null -w "%{http_code}" https://signaldesk-api-production.up.railway.app/api/claude-diagnostics/config)

if [ "$diag_response" = "200" ]; then
    echo -e "${GREEN}✅ Diagnostics endpoint available!${NC}"
    curl -s https://signaldesk-api-production.up.railway.app/api/claude-diagnostics/config | python3 -m json.tool
elif [ "$diag_response" = "404" ]; then
    echo -e "${RED}❌ Diagnostics endpoint not found (404)${NC}"
else
    echo -e "${YELLOW}⚠️  Unexpected response: $diag_response${NC}"
fi

echo ""
echo "3. Testing authenticated endpoints..."

# Login first
token=$(curl -s -X POST https://signaldesk-api-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"demo123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))")

if [ -z "$token" ]; then
    echo -e "${RED}❌ Login failed${NC}"
else
    echo -e "${GREEN}✅ Login successful${NC}"
    
    # Test Campaign endpoint
    echo ""
    echo "4. Testing Campaign Intelligence endpoint..."
    campaign_response=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST https://signaldesk-api-production.up.railway.app/api/campaigns/generate-market-analysis \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d '{"brief":"test","campaignType":"test"}')
    
    if [ "$campaign_response" = "200" ] || [ "$campaign_response" = "500" ]; then
        echo -e "${GREEN}✅ Campaign endpoint accessible (status: $campaign_response)${NC}"
    elif [ "$campaign_response" = "404" ]; then
        echo -e "${RED}❌ Campaign endpoint not found (404)${NC}"
    else
        echo -e "${YELLOW}⚠️  Campaign endpoint status: $campaign_response${NC}"
    fi
    
    # Test Opportunity endpoint
    echo ""
    echo "5. Testing Opportunity Engine endpoint..."
    opp_response=$(curl -s -o /dev/null -w "%{http_code}" \
      -X POST https://signaldesk-api-production.up.railway.app/api/opportunity/analyze-position \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json" \
      -d '{"company":"test","industry":"test"}')
    
    if [ "$opp_response" = "200" ] || [ "$opp_response" = "500" ]; then
        echo -e "${GREEN}✅ Opportunity endpoint accessible (status: $opp_response)${NC}"
    elif [ "$opp_response" = "404" ]; then
        echo -e "${RED}❌ Opportunity endpoint not found (404)${NC}"
    else
        echo -e "${YELLOW}⚠️  Opportunity endpoint status: $opp_response${NC}"
    fi
fi

echo ""
echo "========================================="
echo "Deployment check complete!"