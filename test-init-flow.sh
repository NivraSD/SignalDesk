#!/bin/bash

echo "Testing initialization flow fix..."
echo ""
echo "1. Saving organization to edge function with correct structure..."

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
  }' | jq '.'

echo ""
echo "2. Reading back the saved organization..."

curl -X POST \
  'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0' \
  -d '{
    "action": "getLatestProfile"
  }' | jq '.profile.organization.name'

echo ""
echo "3. Check if organization name is returned correctly above ☝️"
echo "   It should show: \"TestCorp\""