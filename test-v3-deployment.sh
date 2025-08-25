#!/bin/bash

echo "🔍 Testing SignalDesk V3.4 Deployment"
echo "====================================="
echo ""

# Test URLs
PROD_URL="https://signaldesk-nivra-sd.vercel.app"
LATEST_URL="https://signaldesk-fw46s5jmk-nivra-sd.vercel.app"
API_URL="https://zskaxjtyuaqazydouifp.supabase.co/functions/v1"

echo "1️⃣ Testing Frontend Deployment..."
echo "-----------------------------------"
curl -s "$PROD_URL" | grep -o "cache-version.*v3" | head -1 || echo "Version not found"
echo ""

echo "2️⃣ Testing Discovery Function..."
echo "-----------------------------------"
curl -s -X POST "$API_URL/intelligence-discovery-v3" \
  -H "Content-Type: application/json" \
  -d '{"organization":{"name":"Target"},"stakeholders":{"competitors":["Walmart","Amazon"]}}' \
  | jq '.success' 2>/dev/null || echo "Discovery test failed"
echo ""

echo "3️⃣ Testing Gathering Function..."
echo "-----------------------------------"
curl -s -X POST "$API_URL/intelligence-gathering-v3" \
  -H "Content-Type: application/json" \
  -d '{"organization":{"name":"Target"},"entities":{"competitors":["Walmart"]}}' \
  | jq '.statistics' 2>/dev/null || echo "Gathering test failed"
echo ""

echo "4️⃣ Testing Monitoring Function..."
echo "-----------------------------------"
curl -s -X POST "$API_URL/monitor-intelligence" \
  -H "Content-Type: application/json" \
  -d '{"action":"getStatus","organizationId":"test"}' \
  | jq '.success' 2>/dev/null || echo "Monitoring test failed"
echo ""

echo "5️⃣ Testing Synthesis Function..."
echo "-----------------------------------"
curl -s -X POST "$API_URL/intelligence-synthesis-v3" \
  -H "Content-Type: application/json" \
  -d '{"organization":{"name":"Target"},"intelligence":{"entity_actions":{"all":[]},"topic_trends":{"all":[]}}}' \
  | jq '.success' 2>/dev/null || echo "Synthesis test failed"
echo ""

echo "✅ Deployment Tests Complete"
echo ""
echo "Check the site at: $PROD_URL"
echo "Latest deployment: $LATEST_URL"