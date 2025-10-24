#!/bin/bash

echo "🧪 Testing V2 Opportunity Execution & Saving"
echo "=============================================="
echo ""

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"

# 1. Get latest V2 opportunity
echo "1️⃣ Fetching latest V2 opportunity..."
OPP_DATA=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/opportunities?select=id,title,status,executed,version&version=eq.2&order=created_at.desc&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

if [ -z "$OPP_DATA" ] || [ "$OPP_DATA" == "[]" ]; then
  echo "❌ No V2 opportunities found. Run intelligence pipeline first."
  exit 1
fi

OPP_ID=$(echo "$OPP_DATA" | jq -r '.[0].id')
OPP_TITLE=$(echo "$OPP_DATA" | jq -r '.[0].title')
OPP_STATUS=$(echo "$OPP_DATA" | jq -r '.[0].status')
OPP_EXECUTED=$(echo "$OPP_DATA" | jq -r '.[0].executed')

echo "✅ Found: $OPP_TITLE"
echo "   ID: $OPP_ID"
echo "   Status: $OPP_STATUS"
echo "   Executed: $OPP_EXECUTED"
echo ""

# 2. Check database schema
echo "2️⃣ Checking database structure..."
SCHEMA=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/opportunities?select=*&id=eq.${OPP_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq '.[0] | keys')

echo "   Available fields: $(echo $SCHEMA | jq -r '. | join(", ")')"
echo ""

# 3. Check if content exists in data.generated_content
echo "3️⃣ Checking generated content..."
CONTENT_DATA=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/opportunities?select=data&id=eq.${OPP_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}")

CONTENT_COUNT=$(echo "$CONTENT_DATA" | jq -r '.[0].data.generated_content | length // 0')
echo "   Generated content items: $CONTENT_COUNT"

if [ "$CONTENT_COUNT" -gt 0 ]; then
  echo "   ✅ Content types:"
  echo "$CONTENT_DATA" | jq -r '.[0].data.generated_content[] | "     - \(.type // "unknown")"' | head -5
fi
echo ""

# 4. Check Memory Vault
echo "4️⃣ Checking Memory Vault (content_library)..."
VAULT_DATA=$(curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/search_content" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"opportunity-${OPP_ID}\"}")

# Fallback: Direct query if RPC doesn't exist
if echo "$VAULT_DATA" | grep -q "error"; then
  echo "   (Using direct query)"
  VAULT_DATA=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/content_library?select=id,content_type,title,folder&folder=ilike.*opportunity-${OPP_ID}*" \
    -H "apikey: ${ANON_KEY}" \
    -H "Authorization: Bearer ${ANON_KEY}")
fi

VAULT_COUNT=$(echo "$VAULT_DATA" | jq -r 'length // 0')
echo "   Memory Vault items: $VAULT_COUNT"

if [ "$VAULT_COUNT" -gt 0 ]; then
  echo "   ✅ Saved content:"
  echo "$VAULT_DATA" | jq -r '.[] | "     - \(.content_type): \(.title)"' | head -5
fi
echo ""

# 5. Check Gamma presentation
echo "5️⃣ Checking Gamma presentation..."
PRES_URL=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/opportunities?select=presentation_url&id=eq.${OPP_ID}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq -r '.[0].presentation_url // "null"')

if [ "$PRES_URL" == "null" ] || [ -z "$PRES_URL" ]; then
  echo "   ⚠️ No presentation URL"
else
  echo "   ✅ Presentation: $PRES_URL"
fi
echo ""

# Summary
echo "📊 Summary"
echo "=========="
echo "Opportunity: $OPP_TITLE"
echo "Status: $OPP_STATUS | Executed: $OPP_EXECUTED"
echo "Database Content: $CONTENT_COUNT items in data.generated_content"
echo "Memory Vault: $VAULT_COUNT items in content_library"
echo "Gamma Presentation: $([ "$PRES_URL" == "null" ] && echo "Not generated" || echo "Generated")"
echo ""

# Final verdict
if [ "$CONTENT_COUNT" -gt 0 ] && [ "$VAULT_COUNT" -gt 0 ]; then
  echo "✅ PASS - Execution pipeline working correctly!"
  exit 0
elif [ "$CONTENT_COUNT" -gt 0 ]; then
  echo "⚠️  PARTIAL - Content in database but not in Memory Vault"
  exit 1
elif [ "$VAULT_COUNT" -gt 0 ]; then
  echo "⚠️  PARTIAL - Content in Memory Vault but not in database"
  exit 1
else
  echo "❌ FAIL - No content found anywhere"
  exit 1
fi
