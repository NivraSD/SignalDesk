#!/bin/bash

echo "🧪 Testing ALL Intelligence Pipeline Stages..."
echo ""

AUTH="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"

echo "📊 Stage 1: Competitive Intelligence"
echo "-----------------------------------"
curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-1-competitors \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq '.metadata'

echo ""
echo "📰 Stage 2: Media Analysis"
echo "-------------------------"
curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-2-media \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq '.metadata'

echo ""
echo "📋 Stage 3: Regulatory Intelligence"
echo "-----------------------------------"
curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-3-regulatory \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq '.metadata'

echo ""
echo "📈 Stage 4: Trend Analysis"
echo "-------------------------"
curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-4-trends \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq '.metadata'

echo ""
echo "🧩 Stage 5: Synthesis"
echo "--------------------"
curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-5-synthesis \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq '.metadata'

echo ""
echo "✅ Claude 4 Status Summary:"
echo "---------------------------"
echo "Stage 1: $(curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-1-competitors -H "Content-Type: application/json" -H "$AUTH" -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq -r '.metadata.claude_enhanced // false')"
echo "Stage 2: $(curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-2-media -H "Content-Type: application/json" -H "$AUTH" -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq -r '.metadata.claude_enhanced // false')"
echo "Stage 3: $(curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-3-regulatory -H "Content-Type: application/json" -H "$AUTH" -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq -r '.metadata.claude_enhanced // false')"
echo "Stage 4: $(curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-4-trends -H "Content-Type: application/json" -H "$AUTH" -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq -r '.metadata.claude_enhanced // false')"
echo "Stage 5: $(curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-5-synthesis -H "Content-Type: application/json" -H "$AUTH" -d '{"organization": {"name": "TestCorp", "industry": "technology"}}' | jq -r '.metadata.claude_enhanced // false')"
