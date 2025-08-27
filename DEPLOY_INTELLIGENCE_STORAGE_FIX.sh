#!/bin/bash

echo "🚀 Deploying Intelligence Storage Fix"
echo "====================================="

# Deploy the persistence function
echo -e "\n📦 Deploying intelligence-persistence function..."
cd /Users/jonathanliebowitz/Desktop/SignalDesk
supabase functions deploy intelligence-persistence --no-verify-jwt

# Deploy the stage functions
echo -e "\n📦 Deploying stage functions..."
supabase functions deploy intelligence-stage-1-competitors --no-verify-jwt
supabase functions deploy intelligence-stage-2-media --no-verify-jwt
supabase functions deploy intelligence-stage-3-regulatory --no-verify-jwt
supabase functions deploy intelligence-stage-4-trends --no-verify-jwt
supabase functions deploy intelligence-stage-5-synthesis --no-verify-jwt

echo -e "\n✅ Functions deployed!"
echo ""
echo "====================================="
echo "📝 IMPORTANT: Next Steps"
echo "====================================="
echo ""
echo "1. Go to Supabase SQL Editor and run:"
echo "   FIX_INTELLIGENCE_STORAGE.sql"
echo ""
echo "2. Verify tables are created:"
echo "   - intelligence_stage_data"
echo "   - organization_profiles"
echo "   - intelligence_targets"
echo "   - intelligence_findings"
echo "   - opportunities"
echo "   - monitoring_metrics"
echo ""
echo "3. Run the test script to verify storage:"
echo "   ./test-intelligence-storage.sh"
echo ""
echo "4. Check the Supabase dashboard for data"
echo ""
echo "====================================="