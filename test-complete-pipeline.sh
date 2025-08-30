#!/bin/bash

echo "🚀 Testing COMPLETE Intelligence Pipeline (All 5 Stages)"
echo "========================================================="
echo ""

AUTH="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"
BASE_URL="https://zskaxjtyuaqazydouifp.supabase.co/functions/v1"
ORG='{"organization": {"name": "TestCorp", "industry": "technology"}}'

echo "📊 Stage 1: Competitive Intelligence"
echo "------------------------------------"
STAGE1_RESPONSE=$(curl -s -X POST "$BASE_URL/intelligence-stage-1-competitors" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "$ORG")
echo "$STAGE1_RESPONSE" | jq '.metadata' 2>/dev/null || echo "Stage 1 failed"
STAGE1_DATA=$(echo "$STAGE1_RESPONSE" | jq -c '.data' 2>/dev/null || echo '{}')

echo ""
echo "📰 Stage 2: Media & Stakeholder Analysis"
echo "----------------------------------------"
STAGE2_RESPONSE=$(curl -s -X POST "$BASE_URL/intelligence-stage-2-media" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "$ORG")
echo "$STAGE2_RESPONSE" | jq '.metadata' 2>/dev/null || echo "Stage 2 failed"
STAGE2_DATA=$(echo "$STAGE2_RESPONSE" | jq -c '.data' 2>/dev/null || echo '{}')

echo ""
echo "⚖️ Stage 3: Regulatory Intelligence"
echo "-----------------------------------"
STAGE3_RESPONSE=$(curl -s -X POST "$BASE_URL/intelligence-stage-3-regulatory" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "$ORG")
echo "$STAGE3_RESPONSE" | jq '.metadata' 2>/dev/null || echo "Stage 3 failed"
STAGE3_DATA=$(echo "$STAGE3_RESPONSE" | jq -c '.data' 2>/dev/null || echo '{}')

echo ""
echo "📈 Stage 4: Trend Analysis"
echo "--------------------------"
STAGE4_RESPONSE=$(curl -s -X POST "$BASE_URL/intelligence-stage-4-trends" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "$ORG")
echo "$STAGE4_RESPONSE" | jq '.metadata' 2>/dev/null || echo "Stage 4 failed"
STAGE4_DATA=$(echo "$STAGE4_RESPONSE" | jq -c '.data' 2>/dev/null || echo '{}')

echo ""
echo "🧩 Stage 5: Synthesis & Strategic Analysis"
echo "------------------------------------------"
# Pass previous stage data to synthesis
SYNTHESIS_PAYLOAD=$(cat <<JSON
{
  "organization": {"name": "TestCorp", "industry": "technology"},
  "previousResults": {
    "competitive": $STAGE1_DATA,
    "media": $STAGE2_DATA,
    "regulatory": $STAGE3_DATA,
    "trends": $STAGE4_DATA
  }
}
JSON
)

STAGE5_RESPONSE=$(curl -s -X POST "$BASE_URL/intelligence-stage-5-synthesis" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "$SYNTHESIS_PAYLOAD")

echo "$STAGE5_RESPONSE" | jq '.metadata' 2>/dev/null || echo "Stage 5 failed"

echo ""
echo "📊 Final Synthesis Results:"
echo "---------------------------"
echo "$STAGE5_RESPONSE" | jq '{
  success: .success,
  opportunities_count: .opportunities | length,
  has_tabs: (.tabs != null),
  tab_keys: (.tabs | keys),
  patterns: .data.patterns | length,
  recommendations: .data.strategic_recommendations
}' 2>/dev/null || echo "Could not parse synthesis results"

echo ""
echo "🎯 Claude 4 Usage Summary:"
echo "--------------------------"
echo "Stage 1: $(echo "$STAGE1_RESPONSE" | jq -r '.metadata.claude_enhanced // false')"
echo "Stage 2: $(echo "$STAGE2_RESPONSE" | jq -r '.metadata.claude_enhanced // false')"
echo "Stage 3: $(echo "$STAGE3_RESPONSE" | jq -r '.metadata.claude_enhanced // false')"
echo "Stage 4: $(echo "$STAGE4_RESPONSE" | jq -r '.metadata.claude_enhanced // false')"
echo "Stage 5: $(echo "$STAGE5_RESPONSE" | jq -r '.metadata.claude_enhanced // false')"
