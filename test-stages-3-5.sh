#!/bin/bash

# Test stages 3-5 with the deployed functions
echo "🧪 Testing Intelligence Pipeline Stages 3-5..."
echo ""

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"

ORG_DATA='{"organization": {"name": "Acme Corp", "industry": "Technology"}, "previousResults": {}}'

echo "📋 Stage 3: Regulatory Intelligence"
echo "-----------------------------------"
curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-3-regulatory" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$ORG_DATA" | jq '.data.metadata // .error // "No response"'

echo ""
echo "📈 Stage 4: Trend Analysis"
echo "-------------------------"
curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-4-trends" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$ORG_DATA" | jq '.data.metadata // .error // "No response"'

echo ""
echo "🧩 Stage 5: Synthesis"
echo "--------------------"
curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-5-synthesis" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$ORG_DATA" | jq '.data.metadata // .error // "No response"'

echo ""
echo "✅ Test complete! Check if 'claude_enhanced: true' appears above"