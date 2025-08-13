#!/bin/bash

# SignalDesk Claude API Endpoints Test Script
# Tests all critical endpoints with the comprehensive fixes

BASE_URL="https://signaldesk-production.up.railway.app"
AUTH_TOKEN="test-token-123"

echo "🧪 Testing SignalDesk Claude API Endpoints"
echo "========================================="
echo ""

# Test 1: Media Search Reporters
echo "1️⃣ Testing Media Search Reporters..."
curl -s -X POST "$BASE_URL/api/media/search-reporters" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"topic": "technology", "limit": 2}' | python3 -m json.tool | head -20
echo ""

# Test 2: Content Generation
echo "2️⃣ Testing Content Generation..."
curl -s -X POST "$BASE_URL/api/content/ai-generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"prompt": "Write a brief press release intro", "type": "press_release"}' | python3 -m json.tool | head -15
echo ""

# Test 3: Crisis Advisor
echo "3️⃣ Testing Crisis Advisor..."
curl -s -X POST "$BASE_URL/api/crisis/advisor" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"situation": "Data breach discovered", "severity": "high"}' | python3 -m json.tool | head -15
echo ""

# Test 4: Campaign Analysis
echo "4️⃣ Testing Campaign Analysis..."
curl -s -X POST "$BASE_URL/api/campaigns/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"campaignType": "product_launch", "goals": "awareness", "target": "B2B"}' | python3 -m json.tool | head -15
echo ""

# Test 5: MemoryVault AI Context
echo "5️⃣ Testing MemoryVault AI Context..."
curl -s -X POST "$BASE_URL/api/memoryvault/ai-context" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"query": "What was our best performing campaign?", "projectId": "test123"}' | python3 -m json.tool | head -15
echo ""

echo "========================================="
echo "✅ All endpoint tests complete!"
echo ""
echo "Check above for any errors or unexpected responses."
echo "All endpoints should return success:true with appropriate data."