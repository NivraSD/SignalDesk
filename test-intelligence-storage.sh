#!/bin/bash

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"

echo "🔍 Testing Intelligence Data Storage"
echo "====================================="

# Test 1: Save monitoring data directly
echo -e "\n📊 Test 1: Saving monitoring data..."
SAVE_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-persistence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "action": "saveStageData",
    "organization_name": "TestOrg",
    "stage": "monitoring_test",
    "stage_data": {
      "test_data": "Testing monitoring storage",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
      "findings": [
        {
          "title": "Test Finding 1",
          "content": "This is test content for monitoring",
          "relevance": 0.8
        }
      ]
    },
    "metadata": {
      "source": "test_script",
      "version": "1.0"
    }
  }')

echo "Save Result: $SAVE_RESULT" | jq '.'

# Test 2: Retrieve the saved data
echo -e "\n📖 Test 2: Retrieving saved data..."
RETRIEVE_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-persistence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "action": "getStageData",
    "organization_name": "TestOrg",
    "stage": "monitoring_test",
    "limit": 5
  }')

echo "Retrieve Result: $RETRIEVE_RESULT" | jq '.'

# Test 3: Save profile data
echo -e "\n👤 Test 3: Saving organization profile..."
PROFILE_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-persistence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "action": "saveProfile",
    "organization_name": "TestOrg",
    "profile": {
      "organization": {
        "name": "TestOrg",
        "industry": "technology",
        "description": "Test organization for storage verification"
      },
      "competitors": {
        "direct": ["Competitor1", "Competitor2"],
        "indirect": ["Competitor3"],
        "emerging": []
      },
      "stakeholders": {
        "media": ["TechCrunch", "Wired"],
        "regulators": ["FTC"]
      }
    }
  }')

echo "Profile Result: $PROFILE_RESULT" | jq '.'

# Test 4: Run a stage and check if data is saved
echo -e "\n🎯 Test 4: Running Stage 1 (Competitor Analysis)..."
STAGE1_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-1-competitors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "organization": {
      "name": "Nike",
      "industry": "sportswear"
    },
    "competitors": ["Adidas", "Under Armour", "Puma"]
  }' \
  --max-time 30)

echo "Stage 1 Result:" 
echo "$STAGE1_RESULT" | jq '{
  success: (if .error then false else true end),
  has_data: (.competitors != null),
  metadata: .metadata
}'

# Test 5: Check if stage data was persisted
echo -e "\n✅ Test 5: Verifying stage data persistence..."
VERIFY_RESULT=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-persistence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "action": "getStageData",
    "organization_name": "Nike",
    "stage": "competitor_analysis",
    "limit": 1
  }')

echo "Persistence Verification:" 
echo "$VERIFY_RESULT" | jq '{
  data_saved: (.count > 0),
  record_count: .count,
  latest_record: .data[0].created_at
}'

echo -e "\n====================================="
echo "✅ Storage Test Complete"
echo ""
echo "Next Steps:"
echo "1. Run the SQL script in Supabase SQL Editor:"
echo "   FIX_INTELLIGENCE_STORAGE.sql"
echo "2. Check the Supabase dashboard for the tables"
echo "3. Verify data is being stored in:"
echo "   - intelligence_stage_data"
echo "   - organization_profiles"
echo "   - intelligence_findings"
echo "4. Run the full pipeline test to verify synthesis"