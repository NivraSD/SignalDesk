#!/bin/bash

echo "🧪 Testing Stage 4 (Trends) fix..."
echo ""

# Get JWT from .env
JWT=$(grep REACT_APP_SUPABASE_ANON_KEY .env | cut -d '=' -f2 | sed 's/"//g')

# Test Stage 4 directly
echo "📊 Testing Stage 4 (Trends Analysis)..."
curl -X POST \
  https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-4-trends \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "organization": {
      "name": "Toyota",
      "industry": "Automotive",
      "description": "Global automotive manufacturer"
    },
    "previousResults": {
      "extraction": {
        "key_products": ["Camry", "Corolla", "RAV4"],
        "business_model": "Manufacturing and selling vehicles"
      }
    },
    "intelligence": {
      "findings": [
        {
          "topic": "Electric vehicles",
          "mentions": 45,
          "sentiment": "positive"
        },
        {
          "topic": "Autonomous driving",
          "mentions": 28,
          "sentiment": "neutral"
        }
      ],
      "raw_count": 73
    }
  }' \
  -s | jq '.'

echo ""
echo "✅ Test complete!"