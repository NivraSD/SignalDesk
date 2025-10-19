#!/bin/bash

echo "🔍 SignalDesk Pipeline Diagnostic Tool"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"

echo "1️⃣ Checking Supabase Function Deployments..."
echo "---------------------------------------------"
npx supabase functions list 2>/dev/null | grep -E "(intelligence-orchestrator|opportunity-orchestrator|monitoring-stage-2-enrichment|mcp-executive-synthesis)" | while read -r line; do
    if [[ $line == *"ACTIVE"* ]]; then
        echo -e "${GREEN}✅ $line${NC}"
    else
        echo -e "${RED}❌ $line${NC}"
    fi
done

echo ""
echo "2️⃣ Testing Function Health..."
echo "--------------------------------"

# Test intelligence-orchestrator-v2
echo -n "Testing intelligence-orchestrator-v2: "
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/functions/v1/intelligence-orchestrator-v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"test": true}' 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Healthy (200)${NC}"
else
    echo -e "${RED}❌ Status: $HTTP_CODE${NC}"
fi

# Test opportunity-orchestrator
echo -n "Testing opportunity-orchestrator: "
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/functions/v1/opportunity-orchestrator" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{"test": true}' 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
    echo -e "${GREEN}✅ Reachable${NC}"
else
    echo -e "${RED}❌ Status: $HTTP_CODE${NC}"
fi

echo ""
echo "3️⃣ Checking Database Opportunities..."
echo "---------------------------------------"
echo "Fetching recent opportunities from database..."

# Use psql if available, otherwise use curl to edge function
if command -v psql &> /dev/null; then
    echo "Using psql to query database..."
    # You'll need to set PGPASSWORD and connection details
else
    echo "Checking via edge function..."
    curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-persistence" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ANON_KEY" \
      -d '{
        "action": "list",
        "stage": "opportunity_engine",
        "limit": 5
      }' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        items = data.get('items', [])
        print(f'Found {len(items)} recent opportunities')
        for item in items[:3]:
            print(f'  - {item.get(\"metadata\", {}).get(\"opportunity_id\", \"Unknown\")}')
    else:
        print('Failed to fetch opportunities')
except:
    print('Error parsing response')
"
fi

echo ""
echo "4️⃣ Checking Frontend Build..."
echo "-------------------------------"
if [ -f "package.json" ]; then
    echo -n "Next.js build status: "
    if [ -d ".next" ]; then
        BUILD_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" .next 2>/dev/null || stat -c "%y" .next 2>/dev/null | cut -d' ' -f1-2)
        echo -e "${GREEN}✅ Built at $BUILD_TIME${NC}"
    else
        echo -e "${YELLOW}⚠️ No build found${NC}"
    fi
    
    echo -n "Dev server running: "
    if lsof -i :3000 &>/dev/null; then
        echo -e "${GREEN}✅ Running on port 3000${NC}"
    else
        echo -e "${YELLOW}⚠️ Not running${NC}"
    fi
fi

echo ""
echo "5️⃣ Common Issues & Solutions..."
echo "---------------------------------"
echo ""
echo -e "${YELLOW}Issue 1: Opportunities not refreshing${NC}"
echo "  → Solution: Clear opportunity_id conflicts in database"
echo "  → Run: ./fix-opportunities-refresh.sh"
echo ""
echo -e "${YELLOW}Issue 2: Enrichment sending too little data${NC}"
echo "  → Solution: Increase entity limits in monitoring-stage-2-enrichment"
echo "  → Deploy: npx supabase functions deploy monitoring-stage-2-enrichment --no-verify-jwt"
echo ""
echo -e "${YELLOW}Issue 3: Synthesis changes not showing${NC}"
echo "  → Solution: Clear localStorage and rebuild frontend"
echo "  → Run: npm run build && npm run dev"
echo ""
echo -e "${YELLOW}Issue 4: Functions not updating after deploy${NC}"
echo "  → Solution: Check function versions and force redeploy"
echo "  → Run: npx supabase functions deploy [function-name] --no-verify-jwt"
echo ""

echo "======================================"
echo "Diagnostic complete!"