#!/bin/bash
# Query Supabase remote database via REST API

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM"

echo "=== Checking organizations table ==="
curl -s "${SUPABASE_URL}/rest/v1/organizations?id=eq.d9a93509-77d2-4367-860b-50a5343f2b0b" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'

echo ""
echo "=== Checking KARV by name ==="
curl -s "${SUPABASE_URL}/rest/v1/organizations?name=ilike.*KARV*" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'

echo ""
echo "=== Checking intelligence_targets ==="
curl -s "${SUPABASE_URL}/rest/v1/intelligence_targets?organization_id=eq.d9a93509-77d2-4367-860b-50a5343f2b0b&select=name,type" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'

echo ""
echo "=== Checking executive_synthesis ==="
curl -s "${SUPABASE_URL}/rest/v1/executive_synthesis?id=eq.653c4671-5341-49e6-837c-d4ced3a27b05&select=id,organization_name,created_at" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'

echo ""
echo "=== Checking organization_profiles ==="
curl -s "${SUPABASE_URL}/rest/v1/organization_profiles?id=eq.d9a93509-77d2-4367-860b-50a5343f2b0b&select=id,organization_name" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'
