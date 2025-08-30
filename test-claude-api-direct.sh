#!/bin/bash

# Test Claude API directly from Supabase environment
echo "🔍 Testing Claude API with Supabase secrets..."

# Get the API key from Supabase secrets
API_KEY=$(supabase secrets get ANTHROPIC_API_KEY 2>/dev/null | tail -n 1)

if [ -z "$API_KEY" ] || [ "$API_KEY" = "null" ]; then
    echo "❌ Failed to get ANTHROPIC_API_KEY from Supabase secrets"
    exit 1
fi

echo "✅ API Key retrieved (length: ${#API_KEY})"
echo "🔑 Key prefix: ${API_KEY:0:10}..."

# Test Claude API directly
echo ""
echo "📡 Testing Claude API directly..."
curl -X POST https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 100,
    "messages": [{
      "role": "user",
      "content": "Say hello and confirm you are working. This is a test."
    }]
  }' | jq '.'

echo ""
echo "🧪 If you see a response above, the API key is working!"
echo "🧪 If you see an error, check the error message for details"