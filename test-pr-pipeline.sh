#!/bin/bash

echo "🚀 Testing PR/Positioning Intelligence Pipeline"
echo "=============================================="

# Configuration
SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
ORG_NAME="${1:-OpenAI}"
INDUSTRY="${2:-Artificial Intelligence}"

echo "Organization: $ORG_NAME"
echo "Industry: $INDUSTRY"
echo ""

# Step 1: Discovery (Profile Generation)
echo "📋 Step 1: Generating organization profile..."
DISCOVERY_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/mcp-discovery" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"tool\": \"create_organization_profile\",
    \"arguments\": {
      \"organization_name\": \"$ORG_NAME\",
      \"industry_hint\": \"$INDUSTRY\"
    }
  }")

if [ $? -ne 0 ]; then
  echo "❌ Discovery failed"
  exit 1
fi

echo "✅ Profile generated"
PROFILE=$(echo "$DISCOVERY_RESPONSE" | jq -r '.profile')

# Step 2: Monitor Stage 1 (Article Collection)
echo ""
echo "📰 Step 2: Collecting articles..."
MONITOR_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/monitor-stage-1" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_name\": \"$ORG_NAME\",
    \"profile\": $PROFILE
  }")

if [ $? -ne 0 ]; then
  echo "❌ Monitor stage 1 failed"
  exit 1
fi

ARTICLE_COUNT=$(echo "$MONITOR_RESPONSE" | jq -r '.total_articles // 0')
echo "✅ Collected $ARTICLE_COUNT articles"

# Step 3: Full Orchestration (Relevance, Enrichment, Synthesis, Opportunities)
echo ""
echo "🧠 Step 3: Running full intelligence orchestration..."
echo "  - Relevance scoring"
echo "  - AI enrichment"
echo "  - PR/Positioning synthesis"
echo "  - Opportunity detection"

ORCHESTRATOR_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/intelligence-orchestrator-v2" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$(echo $ORG_NAME | tr '[:upper:]' '[:lower:]' | tr ' ' '-')\",
    \"organization_name\": \"$ORG_NAME\",
    \"profile\": $PROFILE,
    \"monitoring_data\": $MONITOR_RESPONSE
  }")

if [ $? -ne 0 ]; then
  echo "❌ Orchestration failed"
  exit 1
fi

# Check for PR analysis in response
echo ""
echo "📊 Checking PR/Positioning Analysis Structure:"
echo "=============================================="

# Check for the 5 persona analyses
HAS_COMPETITIVE=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.competitive_dynamics // null')
HAS_NARRATIVE=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.narrative_intelligence // null')
HAS_POWER=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.power_dynamics // null')
HAS_CULTURAL=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.cultural_context // null')
HAS_CONTRARIAN=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.contrarian_analysis // null')

if [ "$HAS_COMPETITIVE" != "null" ]; then
  echo "✅ Competitive Dynamics (Sarah Chen) - FOUND"
  COMPETITOR_MOVES=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.competitive_dynamics.key_competitor_moves | length // 0')
  echo "   - Competitor moves: $COMPETITOR_MOVES"
  URGENT_ACTIONS=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.competitive_dynamics.urgent_pr_actions | length // 0')
  echo "   - Urgent PR actions: $URGENT_ACTIONS"
else
  echo "❌ Competitive Dynamics - MISSING"
fi

if [ "$HAS_NARRATIVE" != "null" ]; then
  echo "✅ Narrative Intelligence (James Mitchell) - FOUND"
  NARRATIVES=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.narrative_intelligence.evolving_narratives | length // 0')
  echo "   - Evolving narratives: $NARRATIVES"
  PR_OPPS=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.narrative_intelligence.pr_opportunities | length // 0')
  echo "   - PR opportunities: $PR_OPPS"
else
  echo "❌ Narrative Intelligence - MISSING"
fi

if [ "$HAS_POWER" != "null" ]; then
  echo "✅ Power Dynamics (Catherine Rhodes) - FOUND"
  POWER_MOVES=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.power_dynamics.power_movements | length // 0')
  echo "   - Power movements: $POWER_MOVES"
else
  echo "❌ Power Dynamics - MISSING"
fi

if [ "$HAS_CULTURAL" != "null" ]; then
  echo "✅ Cultural Context (Marcus Park) - FOUND"
else
  echo "❌ Cultural Context - MISSING"
fi

if [ "$HAS_CONTRARIAN" != "null" ]; then
  echo "✅ Contrarian Analysis (David Thornton) - FOUND"
else
  echo "❌ Contrarian Analysis - MISSING"
fi

# Check for opportunities
echo ""
echo "🎯 Opportunities Analysis:"
echo "========================="
IMMEDIATE_OPPS=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.immediate_opportunities | length // 0')
echo "Immediate opportunities: $IMMEDIATE_OPPS"

CRITICAL_THREATS=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.critical_threats | length // 0')
echo "Critical threats: $CRITICAL_THREATS"

DETECTOR_OPPS=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.opportunities | length // 0')
echo "Detector opportunities: $DETECTOR_OPPS"

# Save full response for inspection
echo ""
echo "💾 Saving full response to pr-pipeline-response.json"
echo "$ORCHESTRATOR_RESPONSE" | jq '.' > pr-pipeline-response.json

# Extract executive synthesis
EXEC_SYNTHESIS=$(echo "$ORCHESTRATOR_RESPONSE" | jq -r '.executive_synthesis.executive_synthesis // "No executive synthesis found"')
echo ""
echo "📝 Executive Synthesis:"
echo "======================"
echo "$EXEC_SYNTHESIS" | fold -w 80

echo ""
echo "✅ Pipeline test complete!"
echo "Check pr-pipeline-response.json for full details"