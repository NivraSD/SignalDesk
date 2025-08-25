#!/bin/bash

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"

echo "🚀 Testing Full V7 Intelligence Pipeline"
echo "========================================="

# Step 1: Collection
echo -e "\n📡 Step 1: Collection (intelligence-collection-v1)..."
COLLECTION_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-collection-v1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "organization": {
      "name": "Nike",
      "industry": "sportswear",
      "description": "Global athletic footwear and apparel company"
    },
    "entities": {
      "competitors": ["Adidas", "Under Armour", "Puma"],
      "media_outlets": ["ESPN", "Sports Illustrated", "The Athletic"],
      "regulators": ["FTC"],
      "investors": [],
      "analysts": ["Morgan Stanley"],
      "activists": []
    }
  }' \
  --max-time 35)

echo "$COLLECTION_RESULT" | jq '{
  success: .success,
  total_signals: .statistics.total_signals,
  sources: .statistics.sources
}'

# Extract intelligence for synthesis
INTELLIGENCE=$(echo "$COLLECTION_RESULT" | jq '.intelligence')

# Step 2: Synthesis
echo -e "\n🧠 Step 2: Synthesis (intelligence-synthesis-v4)..."
SYNTHESIS_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-synthesis-v4" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d "{
    \"intelligence\": $INTELLIGENCE,
    \"organization\": {
      \"name\": \"Nike\",
      \"industry\": \"sportswear\"
    }
  }" \
  --max-time 35)

echo "$SYNTHESIS_RESULT" | jq '{
  success: .success,
  has_tabs: (.tabs != null),
  has_opportunities: (.opportunities != null),
  error: .error
}'

echo -e "\n========================================="
echo "✅ Pipeline Test Complete"
