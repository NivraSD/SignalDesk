#!/bin/bash

# Test if the /ai/chat endpoint exists in production

echo "Testing production endpoints..."
echo "================================"

# Replace with your actual Railway backend URL
BACKEND_URL="https://signaldesk-backend-production.up.railway.app"

echo "Please enter your Railway backend URL (or press Enter to use default):"
read -r USER_URL
if [ ! -z "$USER_URL" ]; then
    BACKEND_URL="$USER_URL"
fi

echo ""
echo "Testing: $BACKEND_URL"
echo ""

# Test health endpoint
echo "1. Testing /api/health..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BACKEND_URL/api/health"

# Test AI chat endpoint (should return 401 without auth)
echo ""
echo "2. Testing /api/ai/chat (should exist, may return 401)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" -X POST "$BACKEND_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Test content generation endpoint
echo ""
echo "3. Testing /api/content/ai-generate (should exist, may return 401)..."
curl -s -o /dev/null -w "Status: %{http_code}\n" -X POST "$BACKEND_URL/api/content/ai-generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'

echo ""
echo "Status codes:"
echo "  200-299 = Endpoint exists and works"
echo "  401 = Endpoint exists but needs authentication"
echo "  404 = Endpoint does NOT exist"
echo "  500-599 = Server error"