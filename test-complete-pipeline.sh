#!/bin/bash

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"

echo "🚀 Testing Complete Intelligence Pipeline with Data Storage"
echo "==========================================================="

# Step 1: Run Stage 1 - Competitors
echo -e "\n🎯 Stage 1: Competitor Analysis..."
STAGE1_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-1-competitors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "organization": {
      "name": "Nike",
      "industry": "sportswear",
      "description": "Global athletic footwear and apparel company"
    },
    "competitors": ["Adidas", "Under Armour", "Puma"]
  }' \
  --max-time 30)

echo "Stage 1 Status:"
echo "$STAGE1_RESULT" | jq -r 'if .competitors then "✅ Competitors analyzed" else "❌ No competitor data" end' 2>/dev/null || echo "⚠️ HTML response received"

# Save the results for next stages
COMPETITORS=$(echo "$STAGE1_RESULT" | jq '.competitors' 2>/dev/null || echo '{}')

# Step 2: Run Stage 2 - Media
echo -e "\n📰 Stage 2: Media Analysis..."
STAGE2_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-2-media" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d "{
    \"organization\": {
      \"name\": \"Nike\",
      \"industry\": \"sportswear\"
    },
    \"previousResults\": {
      \"competitors\": $COMPETITORS
    }
  }" \
  --max-time 30)

echo "Stage 2 Status:"
echo "$STAGE2_RESULT" | jq -r 'if .media_coverage then "✅ Media analyzed" else "❌ No media data" end' 2>/dev/null || echo "⚠️ HTML response received"

# Step 3: Run Stage 5 - Synthesis
echo -e "\n🧠 Stage 5: Intelligence Synthesis..."
SYNTHESIS_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-5-synthesis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "organization": {
      "name": "Nike",
      "industry": "sportswear"
    },
    "previousResults": {
      "competitors": '"$COMPETITORS"',
      "media": {}
    },
    "dataVersion": "2.0"
  }' \
  --max-time 30)

echo "Synthesis Status:"
echo "$SYNTHESIS_RESULT" | jq -r 'if .patterns then "✅ Synthesis complete" else "❌ No synthesis generated" end' 2>/dev/null || echo "⚠️ HTML response received"

# Step 4: Check if data was persisted
echo -e "\n💾 Checking data persistence..."
PERSISTENCE_CHECK=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-persistence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "action": "getStageData",
    "organization_name": "Nike",
    "limit": 10
  }')

echo "Persistence Check:"
echo "$PERSISTENCE_CHECK" | jq -r '
  if .data then 
    "✅ Found " + (.count | tostring) + " stored records"
  else 
    "❌ No data found in storage"
  end' 2>/dev/null || echo "⚠️ Cannot access persistence data"

# Step 5: Test direct database query via REST API
echo -e "\n🔍 Checking database directly via REST API..."
DB_CHECK=$(curl -s -X GET "$SUPABASE_URL/rest/v1/intelligence_stage_data?organization_name=eq.Nike&limit=5" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

echo "Database Check:"
echo "$DB_CHECK" | jq -r 'if length > 0 then "✅ Found " + (length | tostring) + " records in database" else "❌ No records in database" end' 2>/dev/null || echo "⚠️ Database not accessible"

echo -e "\n==========================================================="
echo "✅ Pipeline Test Complete"
echo ""
echo "Summary:"
echo "--------"
echo "1. Check Supabase dashboard for stored data in:"
echo "   - intelligence_stage_data table"
echo "   - organization_profiles table"
echo "   - intelligence_findings table"
echo ""
echo "2. If seeing HTML responses, check:"
echo "   - Edge functions are deployed correctly"
echo "   - CORS settings in Supabase"
echo "   - Function logs in Supabase dashboard"
echo ""
echo "3. Next steps:"
echo "   - Open frontend and test the Intelligence Hub"
echo "   - Check browser console for any errors"
echo "   - Verify data appears in the UI tabs"