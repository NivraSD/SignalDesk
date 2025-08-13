#!/bin/bash

# Railway Deployment Verification Script
# This script verifies that new code has been deployed to Railway

echo "========================================="
echo "  RAILWAY DEPLOYMENT VERIFICATION"
echo "  $(date)"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="https://signaldesk-production.up.railway.app"
LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

echo ""
echo "🔍 Checking deployment status..."
echo "Local commit: $LOCAL_COMMIT"
echo ""

# Test 1: Version Endpoint
echo "1️⃣  Testing version endpoint..."
VERSION_RESPONSE=$(curl -s "$BACKEND_URL/api/version")
if [ $? -eq 0 ]; then
  echo "Version response: $VERSION_RESPONSE"
  DEPLOYED_COMMIT=$(echo "$VERSION_RESPONSE" | grep -o '"commit":"[^"]*' | cut -d'"' -f4)
  DEPLOYMENT_ID=$(echo "$VERSION_RESPONSE" | grep -o '"version":"[^"]*' | cut -d'"' -f4)
  
  echo "Deployed commit: $DEPLOYED_COMMIT"
  echo "Deployment ID: $DEPLOYMENT_ID"
  
  if [ "$LOCAL_COMMIT" = "$DEPLOYED_COMMIT" ]; then
    echo -e "${GREEN}✅ Deployment is up to date!${NC}"
  else
    echo -e "${YELLOW}⚠️  Deployment appears to be using different commit${NC}"
    echo "   Local:    $LOCAL_COMMIT"
    echo "   Deployed: $DEPLOYED_COMMIT"
  fi
else
  echo -e "${RED}❌ Failed to reach version endpoint${NC}"
fi

echo ""

# Test 2: Health Check
echo "2️⃣  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed${NC}"
  echo "Response: $HEALTH_RESPONSE"
fi

echo ""

# Test 3: AI Conversation Flow
echo "3️⃣  Testing AI conversation flow..."
echo "   Sending: 'I want to create a press release'"
AI_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/ai/unified-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to create a press release",
    "sessionId": "test-'$(date +%s)'",
    "mode": "content"
  }')

if [ $? -eq 0 ]; then
  WORD_COUNT=$(echo "$AI_RESPONSE" | jq -r '.response' 2>/dev/null | wc -w)
  echo "   Response word count: $WORD_COUNT"
  
  if [ "$WORD_COUNT" -lt 100 ]; then
    echo -e "${GREEN}✅ AI is asking questions (not dumping info)${NC}"
  else
    echo -e "${RED}❌ AI is still dumping information (${WORD_COUNT} words)${NC}"
    echo "   Expected: < 100 words (a question)"
    echo "   Actual: $WORD_COUNT words"
  fi
else
  echo -e "${RED}❌ Failed to reach AI endpoint${NC}"
fi

echo ""

# Test 4: Content Generation Flag
echo "4️⃣  Testing content generation flag..."
GENERATION_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/ai/unified-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Generate the content now",
    "sessionId": "test-gen-'$(date +%s)'",
    "context": {
      "contentTypeId": "press-release",
      "ready": true,
      "collectedInfo": {
        "topic": "Product launch",
        "audience": "Tech journalists"
      }
    }
  }')

if [ $? -eq 0 ]; then
  IS_GENERATED=$(echo "$GENERATION_RESPONSE" | jq -r '.isGeneratedContent' 2>/dev/null)
  
  if [ "$IS_GENERATED" = "true" ]; then
    echo -e "${GREEN}✅ Content generation flag is working${NC}"
  else
    echo -e "${RED}❌ Content generation flag not set${NC}"
    echo "   Expected: isGeneratedContent: true"
    echo "   Actual: isGeneratedContent: $IS_GENERATED"
  fi
else
  echo -e "${RED}❌ Failed to test content generation${NC}"
fi

echo ""
echo "========================================="
echo "  DEPLOYMENT VERIFICATION SUMMARY"
echo "========================================="

# Summary
if [ "$DEPLOYED_COMMIT" = "$LOCAL_COMMIT" ] && [ "$WORD_COUNT" -lt 100 ] && [ "$IS_GENERATED" = "true" ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED! Deployment is working correctly.${NC}"
  echo ""
  echo "✅ Version matches local commit"
  echo "✅ AI asks questions instead of dumping info"
  echo "✅ Content generation flag is working"
  exit 0
else
  echo -e "${RED}⚠️  DEPLOYMENT ISSUES DETECTED${NC}"
  echo ""
  
  if [ "$DEPLOYED_COMMIT" != "$LOCAL_COMMIT" ]; then
    echo "❌ Version mismatch - Railway may be using cached build"
    echo "   Fix: Run ./deploy-emergency.sh to force rebuild"
  fi
  
  if [ "$WORD_COUNT" -ge 100 ]; then
    echo "❌ AI still dumping information instead of asking questions"
    echo "   Fix: Check conversation state management in aiRoutes.js"
  fi
  
  if [ "$IS_GENERATED" != "true" ]; then
    echo "❌ Content generation flag not working"
    echo "   Fix: Check isGeneratedContent logic in aiRoutes.js"
  fi
  
  echo ""
  echo "Next steps:"
  echo "1. Commit all changes: git add -A && git commit -m 'Fix deployment issues'"
  echo "2. Push to GitHub: git push origin main"
  echo "3. Force Railway rebuild: railway up --detach"
  echo "4. Wait 2-3 minutes for deployment"
  echo "5. Run this script again: ./verify-railway-deployment.sh"
  
  exit 1
fi