#!/bin/bash
SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM"

echo "=== Checking intelligence_targets count ==="
curl -s "${SUPABASE_URL}/rest/v1/intelligence_targets?organization_id=eq.d9a93509-77d2-4367-860b-50a5343f2b0b&select=name,type,priority" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq 'length'

echo ""
echo "=== Competitors in intelligence_targets ==="
curl -s "${SUPABASE_URL}/rest/v1/intelligence_targets?organization_id=eq.d9a93509-77d2-4367-860b-50a5343f2b0b&type=eq.competitor&select=name,priority" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'

echo ""
echo "=== Stakeholders in intelligence_targets ==="
curl -s "${SUPABASE_URL}/rest/v1/intelligence_targets?organization_id=eq.d9a93509-77d2-4367-860b-50a5343f2b0b&type=eq.stakeholder&select=name,priority" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" | jq '.'
