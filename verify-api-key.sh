#!/bin/bash

echo "🔍 Verifying API Key Configuration"
echo "==================================="
echo ""

# Check local .env.local
echo "1. Checking local .env.local file..."
if [ -f .env.local ]; then
    API_KEY=$(grep "^ANTHROPIC_API_KEY=" .env.local | cut -d'=' -f2)
    if [[ "$API_KEY" == "your_anthropic_key_here" ]] || [[ -z "$API_KEY" ]]; then
        echo "   ❌ Local API key is placeholder or empty"
        echo "      Fix: Edit .env.local and add real key"
    elif [[ "$API_KEY" == sk-ant-* ]]; then
        echo "   ✅ Local API key looks valid (starts with sk-ant-)"
    else
        echo "   ⚠️  Local API key format unclear: ${API_KEY:0:10}..."
    fi
else
    echo "   ⚠️  No .env.local file found"
fi

echo ""
echo "2. Checking Supabase secrets..."
SECRETS=$(npx supabase secrets list 2>/dev/null | grep ANTHROPIC_API_KEY)
if [[ -n "$SECRETS" ]]; then
    echo "   ✅ ANTHROPIC_API_KEY is set in Supabase"
    echo "      Digest: $(echo $SECRETS | awk '{print $3}')"
else
    echo "   ❌ ANTHROPIC_API_KEY not found in Supabase secrets"
fi

echo ""
echo "3. Quick API test (using local key if available)..."
if [[ "$API_KEY" == sk-ant-* ]]; then
    echo "   Testing with local key..."
    RESPONSE=$(curl -s -X POST https://api.anthropic.com/v1/messages \
      -H "x-api-key: $API_KEY" \
      -H "anthropic-version: 2023-06-01" \
      -H "content-type: application/json" \
      -d '{
        "model": "claude-instant-latest", 
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "Say hi"}]
      }' 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q "\"content\""; then
        echo "   ✅ API key is WORKING! Claude responded"
    elif echo "$RESPONSE" | grep -q "invalid_api_key"; then
        echo "   ❌ API key is INVALID"
    elif echo "$RESPONSE" | grep -q "authentication_error"; then
        echo "   ❌ API key authentication failed"
    else
        echo "   ❓ Unexpected response: ${RESPONSE:0:100}..."
    fi
else
    echo "   ⚠️  Skipping API test (no valid local key)"
fi

echo ""
echo "==================================="
echo "NEXT STEPS:"
echo ""
if [[ "$API_KEY" != sk-ant-* ]]; then
    echo "1. Get your Anthropic API key from: https://console.anthropic.com/account/keys"
    echo "2. Set it in Supabase: npx supabase secrets set ANTHROPIC_API_KEY='sk-ant-api03-...'"
    echo "3. Update .env.local: ANTHROPIC_API_KEY=sk-ant-api03-..."
    echo "4. Redeploy functions: npx supabase functions deploy mcp-executive-synthesis --no-verify-jwt"
else
    echo "✅ Your API key appears to be configured correctly"
    echo "   If synthesis still isn't working, check:"
    echo "   - Function deployment status"
    echo "   - Data being passed to synthesis"
    echo "   - Claude API rate limits"
fi