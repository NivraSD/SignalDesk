#!/bin/bash

# DIRECT SUPABASE API TEST
# This tests the authentication directly via HTTP API

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"

echo "========================================"
echo "TESTING SUPABASE AUTH API DIRECTLY"
echo "========================================"
echo ""
echo "URL: $SUPABASE_URL"
echo "Email: admin@signaldesk.com"
echo "Password: admin123"
echo ""
echo "Sending login request..."
echo ""

# Test login
curl -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@signaldesk.com",
    "password": "admin123"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | python3 -m json.tool

echo ""
echo "========================================"
echo "If you see a 200 status and access_token, login is working!"
echo "If you see 400 or 'Invalid login credentials', run the SQL script first."
echo "========================================" 