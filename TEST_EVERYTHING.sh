#!/bin/bash

echo "🧪 COMPREHENSIVE SYSTEM TEST - INTELLIGENCE HUB + OPPORTUNITY ENGINE"
echo "===================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# JWT Token
JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"
BASE_URL="https://zskaxjtyuaqazydouifp.supabase.co/functions/v1"

echo "1️⃣  TESTING API KEY ACCESS"
echo "----------------------------"
echo "Testing if Edge Functions can access ANTHROPIC_API_KEY..."

RESULT=$(curl -s -X POST $BASE_URL/test-secrets \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.test_claude_call')

if [ "$RESULT" = "true" ]; then
    echo -e "${GREEN}✅ API Key Working - Claude responded successfully${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ API Key NOT Working - Claude call failed${NC}"
    echo "Response: $RESULT"
    ((TESTS_FAILED++))
fi

echo ""
echo "2️⃣  TESTING INTELLIGENCE DISCOVERY V3"
echo "--------------------------------------"
echo "Testing if discovery returns real stakeholders (not templates)..."

DISCOVERY=$(curl -s -X POST $BASE_URL/intelligence-discovery-v3 \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "TestCorp",
    "industry": "technology",
    "test": true
  }')

# Check if we got real competitors (not just Microsoft/Google/Meta templates)
HAS_COMPETITORS=$(echo "$DISCOVERY" | jq -r '.entities.competitors | length')
FIRST_COMPETITOR=$(echo "$DISCOVERY" | jq -r '.entities.competitors[0].name // "NONE"')

if [ "$HAS_COMPETITORS" -gt 0 ] && [ "$FIRST_COMPETITOR" != "Microsoft" ]; then
    echo -e "${GREEN}✅ Discovery returning REAL competitors: $FIRST_COMPETITOR${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Discovery returning TEMPLATE data (Microsoft/Google/Meta)${NC}"
    echo "Competitors found: $(echo "$DISCOVERY" | jq -r '.entities.competitors[].name' | head -3 | tr '\n' ', ')"
    ((TESTS_FAILED++))
fi

echo ""
echo "3️⃣  TESTING INTELLIGENCE GATHERING V3"
echo "--------------------------------------"
echo "Testing if gathering returns real news/actions (not templates)..."

GATHERING=$(curl -s -X POST $BASE_URL/intelligence-gathering-v3 \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "entities": {
      "competitors": [{"name": "Apple", "domain": "apple.com"}]
    },
    "test": true
  }')

# Check if we got real entity actions
ACTIONS_COUNT=$(echo "$GATHERING" | jq -r '.entity_actions.all | length')
FIRST_ACTION=$(echo "$GATHERING" | jq -r '.entity_actions.all[0].action // "NONE"')
HAS_SOURCE=$(echo "$GATHERING" | jq -r '.entity_actions.all[0].source // "NONE"')

if [ "$ACTIONS_COUNT" -gt 0 ] && [ "$HAS_SOURCE" != "NONE" ] && [ "$HAS_SOURCE" != "null" ]; then
    echo -e "${GREEN}✅ Gathering returning REAL actions with sources${NC}"
    echo "   Found $ACTIONS_COUNT actions, first source: $HAS_SOURCE"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Gathering returning TEMPLATE data (no real sources)${NC}"
    echo "   Actions: $ACTIONS_COUNT, Source: $HAS_SOURCE"
    ((TESTS_FAILED++))
fi

echo ""
echo "4️⃣  TESTING INTELLIGENCE SYNTHESIS V3"
echo "--------------------------------------"
echo "Testing if synthesis returns rich content (not thin templates)..."

SYNTHESIS=$(curl -s -X POST $BASE_URL/intelligence-synthesis-v3 \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "TestCorp",
    "intelligence": {
      "entity_actions": {
        "all": [
          {"entity": "Apple", "action": "launched new product", "source": "TechCrunch"}
        ]
      },
      "topic_trends": {
        "all": [
          {"topic": "AI regulation", "trend": "increasing", "mentions": 50}
        ]
      }
    }
  }')

# Check if synthesis worked
SYNTHESIS_SUCCESS=$(echo "$SYNTHESIS" | jq -r '.success // false')
EXECUTIVE_TAB=$(echo "$SYNTHESIS" | jq -r '.tabs.executive.content // "NONE"')
EXECUTIVE_LENGTH=$(echo "$EXECUTIVE_TAB" | wc -c)

if [ "$SYNTHESIS_SUCCESS" = "true" ] && [ "$EXECUTIVE_LENGTH" -gt 500 ]; then
    echo -e "${GREEN}✅ Synthesis returning RICH content ($EXECUTIVE_LENGTH chars)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Synthesis FAILED or returning thin content${NC}"
    echo "   Success: $SYNTHESIS_SUCCESS, Content length: $EXECUTIVE_LENGTH"
    echo "   Error: $(echo "$SYNTHESIS" | jq -r '.error // "none"')"
    ((TESTS_FAILED++))
fi

echo ""
echo "5️⃣  TESTING OPPORTUNITY ORCHESTRATOR"
echo "-------------------------------------"
echo "Testing if opportunities have real actions and sources..."

OPPORTUNITIES=$(curl -s -X POST $BASE_URL/opportunity-orchestrator \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "organization": {
      "name": "TestCorp",
      "industry": "technology"
    },
    "config": {
      "opportunity_types": {
        "competitor_weakness": true
      }
    }
  }')

# Check opportunities
OPP_COUNT=$(echo "$OPPORTUNITIES" | jq -r '.opportunities | length')
FIRST_OPP_ACTION=$(echo "$OPPORTUNITIES" | jq -r '.opportunities[0].action // "NONE"')
FIRST_OPP_IMPACT=$(echo "$OPPORTUNITIES" | jq -r '.opportunities[0].expected_impact // "NONE"')
HAS_REAL_CONTENT=false

if [ "$FIRST_OPP_ACTION" != "NONE" ] && [ "$FIRST_OPP_ACTION" != "null" ] && [ "$FIRST_OPP_IMPACT" != "NONE" ]; then
    # Check if it's not a template
    if [[ "$FIRST_OPP_ACTION" != *"Microsoft"* ]] || [[ "$FIRST_OPP_ACTION" == *"specific"* ]]; then
        HAS_REAL_CONTENT=true
    fi
fi

if [ "$OPP_COUNT" -gt 0 ] && [ "$HAS_REAL_CONTENT" = true ]; then
    echo -e "${GREEN}✅ Opportunities have REAL actions and impact${NC}"
    echo "   Found $OPP_COUNT opportunities with actionable content"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Opportunities are TEMPLATES (Microsoft/Google generic)${NC}"
    echo "   Count: $OPP_COUNT, Has real content: $HAS_REAL_CONTENT"
    ((TESTS_FAILED++))
fi

echo ""
echo "6️⃣  TESTING COMPLETE FLOW"
echo "--------------------------"
echo "Testing full orchestration flow (discovery → gathering → synthesis)..."

# Simulate what the frontend does
FULL_FLOW=$(curl -s -X POST $BASE_URL/intelligence-discovery-v3 \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "organization": "Samsung",
    "industry": "technology"
  }')

# Check if discovery worked
DISCOVERY_ENTITIES=$(echo "$FULL_FLOW" | jq -r '.entities.competitors | length')

if [ "$DISCOVERY_ENTITIES" -gt 0 ]; then
    echo -e "${GREEN}✅ Full flow discovery phase working${NC}"
    
    # Now test gathering with discovered entities
    ENTITIES=$(echo "$FULL_FLOW" | jq -c '.entities')
    
    GATHERING_RESULT=$(curl -s -X POST $BASE_URL/intelligence-gathering-v3 \
      -H "Authorization: Bearer $JWT" \
      -H "Content-Type: application/json" \
      -d "{\"entities\": $ENTITIES}")
    
    GATHERING_ACTIONS=$(echo "$GATHERING_RESULT" | jq -r '.entity_actions.all | length')
    
    if [ "$GATHERING_ACTIONS" -gt 0 ]; then
        echo -e "${GREEN}✅ Full flow gathering phase working${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Full flow gathering phase failed${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ Full flow discovery phase failed${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "======================================"
echo "📊 TEST RESULTS"
echo "======================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Safe to deploy.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  TESTS FAILED! DO NOT DEPLOY YET.${NC}"
    echo ""
    echo "Issues to fix:"
    echo "1. Edge Functions may not be getting API key at runtime"
    echo "2. Check that ANTHROPIC_API_KEY is set in Supabase secrets"
    echo "3. Verify Edge Functions are using Deno.env.get() inside functions, not at module level"
    exit 1
fi