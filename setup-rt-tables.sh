#!/bin/bash
# Create real-time intelligence tables using Supabase CLI

echo "Creating real-time intelligence tables..."
echo ""

npx supabase db execute --file create-real-time-intelligence-tables.sql --project-ref zskaxjtyuaqazydouifp

echo ""
echo "✅ Tables creation complete"
echo ""
echo "Verifying tables..."
node setup-rt-tables.js
