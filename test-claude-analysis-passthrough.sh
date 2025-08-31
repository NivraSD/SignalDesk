#!/bin/bash

echo "🧠 TESTING CLAUDE ANALYSIS PASSTHROUGH"
echo "======================================"
echo "This test verifies that:"
echo "1. Each stage stores its Claude analysis"
echo "2. Synthesis retrieves all Claude insights"
echo "3. Data size is reduced (no raw data to synthesis)"
echo "4. Rich insights are preserved"
echo ""

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"
REQUEST_ID="test-$(date +%s)-${RANDOM}"

echo "🔑 Test Request ID: $REQUEST_ID"
echo ""

# Test Stage 1 with request_id
echo "📊 Testing Stage 1 (Competitors) with Claude storage..."
response1=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/intelligence-stage-1-competitors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "{
    \"organization\": {
      \"name\": \"TestCompany\",
      \"industry\": \"Technology\"
    },
    \"competitors\": [
      {\"name\": \"CompetitorA\", \"type\": \"direct\"},
      {\"name\": \"CompetitorB\", \"type\": \"indirect\"}
    ],
    \"request_id\": \"${REQUEST_ID}\"
  }")

# Check if request_id was returned
if echo "$response1" | grep -q "$REQUEST_ID"; then
  echo "✅ Stage 1 returned request_id"
else
  echo "⚠️ Stage 1 did not return request_id"
fi

# Extract data from Stage 1
stage1_data=$(echo "$response1" | python3 -c "
import json, sys
try:
  data = json.load(sys.stdin)
  print(json.dumps(data.get('data', {})))
except:
  print('{}')
")

echo ""
echo "📊 Testing Stage 5 (Synthesis) with request_id..."

# Test Stage 5 with request_id
response5=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/intelligence-stage-5-synthesis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  --max-time 58 \
  -d "{
    \"organization\": {
      \"name\": \"TestCompany\",
      \"industry\": \"Technology\"
    },
    \"request_id\": \"${REQUEST_ID}\",
    \"previousResults\": {
      \"competitive\": {
        \"data\": $stage1_data
      }
    }
  }")

echo ""
echo "📊 RESULTS ANALYSIS:"
echo "==================="

# Analyze Stage 5 response
echo "$response5" | python3 -c "
import json, sys

try:
  data = json.load(sys.stdin)
  
  print('✅ Success:', data.get('success', False))
  print('📊 Stage:', data.get('stage', 'unknown'))
  
  # Check if Claude enhanced
  if 'data' in data and 'metadata' in data['data']:
    meta = data['data']['metadata']
    print(f\"🧠 Claude Enhanced: {meta.get('claude_enhanced', False)}\")
    print(f\"⏱️ Duration: {meta.get('duration', 'N/A')}ms\")
    
    # Check data size
    if 'data_size' in meta:
      print(f\"📦 Data processed: {meta['data_size']} bytes\")
  
  # Check for opportunities
  if 'data' in data and 'consolidated_opportunities' in data['data']:
    opps = data['data']['consolidated_opportunities']
    if 'prioritized_list' in opps:
      print(f\"🎯 Opportunities generated: {len(opps['prioritized_list'])}\")
      
      # Check if opportunities are specific or generic
      first_opp = opps['prioritized_list'][0] if opps['prioritized_list'] else {}
      if 'TestCompany' in str(first_opp) or 'Technology' in str(first_opp):
        print('✅ Opportunities are SPECIFIC to TestCompany')
      else:
        print('⚠️ Opportunities appear GENERIC')
  
  # Check for Claude insights retrieval
  if 'debug' in data:
    debug = data['debug']
    if 'claudeInsightsRetrieved' in debug:
      print(f\"🧠 Claude insights retrieved: {debug['claudeInsightsRetrieved']}\")
    if 'dataSizeReduction' in debug:
      print(f\"📦 Data size reduction: {debug['dataSizeReduction']}%\")
      
except Exception as e:
  print(f'❌ Error analyzing response: {e}')
  print('Raw response:', sys.stdin.read()[:500])
" 2>/dev/null || echo "❌ Could not parse response"

echo ""
echo "================================"
echo "🏁 TEST COMPLETE"
echo ""
echo "💡 What to look for:"
echo "1. Claude Enhanced should be TRUE (not fallback)"
echo "2. Duration should be < 50000ms (no timeout)"
echo "3. Opportunities should be SPECIFIC (not generic)"
echo "4. Data size reduction should show"
echo "5. Claude insights should be retrieved"