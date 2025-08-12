#!/bin/bash

# Quick deployment verification script
echo "🔍 SignalDesk Deployment Verification"
echo "====================================="
echo ""

# Get Railway URL
if [ -z "$1" ]; then
  echo "Usage: ./verify-deployment.sh <railway-url>"
  echo "Example: ./verify-deployment.sh https://signaldesk.railway.app"
  exit 1
fi

URL=$1

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Testing URL: $URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s "$URL/api/health/status")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
  echo "Response: $HEALTH"
fi
echo ""

# Test 2: Claude Status
echo "2️⃣  Testing Claude Service..."
CLAUDE_STATUS=$(curl -s "$URL/api/health/detailed" | grep -o '"claude":"[^"]*' | cut -d'"' -f4)
if [ "$CLAUDE_STATUS" = "WORKING" ]; then
  echo -e "${GREEN}✅ Claude is working with real API${NC}"
else
  echo -e "${RED}❌ Claude status: $CLAUDE_STATUS${NC}"
  echo ""
  echo "Getting detailed Claude info..."
  curl -s "$URL/api/health/detailed" | python3 -c "
import sys, json
data = json.load(sys.stdin)
claude = data.get('services', {}).get('claude', {})
print('API Key Present:', claude.get('apiKeys', {}).get('ANTHROPIC_API_KEY', {}).get('exists'))
print('API Key Length:', claude.get('apiKeys', {}).get('ANTHROPIC_API_KEY', {}).get('length'))
print('Is Placeholder:', claude.get('apiKeys', {}).get('ANTHROPIC_API_KEY', {}).get('isPlaceholder'))
print('Client Initialized:', claude.get('clientInitialized'))
if 'testResult' in claude:
    print('Test Success:', claude['testResult'].get('success'))
    print('Is Real Claude:', claude['testResult'].get('isRealClaude'))
    print('Is Mock Response:', claude['testResult'].get('isMockResponse'))
"
fi
echo ""

# Test 3: Crisis Route
echo "3️⃣  Testing Crisis Management..."
CRISIS_TEST=$(curl -s -X POST "$URL/api/crisis/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"situation":"test","severity":"low"}' 2>/dev/null)
  
if echo "$CRISIS_TEST" | grep -q "advice\|response\|success"; then
  echo -e "${GREEN}✅ Crisis route responding${NC}"
else
  echo -e "${RED}❌ Crisis route not working properly${NC}"
fi
echo ""

# Test 4: Content Route
echo "4️⃣  Testing Content Generation..."
CONTENT_TEST=$(curl -s -X POST "$URL/api/content/ai-generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"prompt":"test","type":"general"}' 2>/dev/null)
  
if echo "$CONTENT_TEST" | grep -q "content\|response\|success"; then
  echo -e "${GREEN}✅ Content route responding${NC}"
else
  echo -e "${RED}❌ Content route not working properly${NC}"
fi
echo ""

# Test 5: Media Route
echo "5️⃣  Testing Media List Builder..."
MEDIA_TEST=$(curl -s -X POST "$URL/api/media/search-reporters" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"topic":"technology","limit":5}' 2>/dev/null)
  
if echo "$MEDIA_TEST" | grep -q "journalists\|success"; then
  echo -e "${GREEN}✅ Media route responding${NC}"
else
  echo -e "${RED}❌ Media route not working properly${NC}"
fi
echo ""

# Test 6: Campaign Route
echo "6️⃣  Testing Campaign Intelligence..."
CAMPAIGN_TEST=$(curl -s -X POST "$URL/api/campaigns/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"campaignType":"test","goals":"testing"}' 2>/dev/null)
  
if echo "$CAMPAIGN_TEST" | grep -q "analysis\|success"; then
  echo -e "${GREEN}✅ Campaign route responding${NC}"
else
  echo -e "${RED}❌ Campaign route not working properly${NC}"
fi
echo ""

# Summary
echo "📊 Deployment Summary"
echo "===================="
echo ""

# Get critical issues
ISSUES=$(curl -s "$URL/api/health/detailed" | python3 -c "
import sys, json
data = json.load(sys.stdin)
issues = data.get('status', {}).get('criticalIssues', [])
if issues:
    print('Critical Issues:')
    for issue in issues:
        print('  - ' + issue)
else:
    print('No critical issues detected')
")

echo "$ISSUES"
echo ""

# Recommendations
echo "📝 Recommendations:"
echo ""
if echo "$CLAUDE_STATUS" | grep -q "FAILING"; then
  echo "1. Go to Railway Dashboard > Variables"
  echo "2. Add ANTHROPIC_API_KEY with the value:"
  echo "   _YOUR_API_KEY_HERE"
  echo "3. Click 'Deploy' to redeploy with the new variable"
else
  echo -e "${GREEN}✅ All systems operational!${NC}"
fi