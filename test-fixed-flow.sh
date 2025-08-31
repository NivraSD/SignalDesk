#!/bin/bash

echo "Testing fixed initialization flow..."
echo ""
echo "1. Saving TestCorp to edge function with correct structure..."

curl -X POST \
  'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0' \
  -d '{
    "action": "saveProfile",
    "organization_name": "TestCorp",
    "profile": {
      "organization": {
        "name": "TestCorp",
        "id": "testcorp",
        "industry": "Technology",
        "description": "Test Corporation for pipeline testing",
        "competitors": [],
        "keywords": ["TestCorp", "test"]
      }
    }
  }' 2>/dev/null | jq '.success'

echo ""
echo "2. Reading back TestCorp specifically..."

curl -X POST \
  'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0' \
  -d '{
    "action": "getLatestProfile",
    "organization_name": "TestCorp"
  }' 2>/dev/null | jq '.profile.organization.name'

echo ""
echo "3. Testing without organization_name (should get latest)..."

curl -X POST \
  'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0' \
  -d '{
    "action": "getLatestProfile"
  }' 2>/dev/null | jq '.profile.organization.name'

echo ""
echo "✅ If you see \"TestCorp\" above, the fix is working!"