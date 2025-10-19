#!/bin/bash

echo "🔍 Checking Vercel deployment status..."
echo ""

# Wait a bit for deployment to start
echo "⏳ Waiting 30 seconds for deployment to process..."
sleep 30

# Check if new services are in the deployed bundle
echo "Checking for profile services in deployed bundle..."
PROFILE_COUNT=$(curl -s https://signaldesk-nivra-sd.vercel.app/static/js/main.*.js | grep -c "organizationProfileService" 2>/dev/null)
TAB_COUNT=$(curl -s https://signaldesk-nivra-sd.vercel.app/static/js/main.*.js | grep -c "tabIntelligenceService" 2>/dev/null)

if [ "$PROFILE_COUNT" -gt 0 ] && [ "$TAB_COUNT" -gt 0 ]; then
    echo "✅ Deployment successful! Profile system is live."
    echo "   - organizationProfileService: Found"
    echo "   - tabIntelligenceService: Found"
else
    echo "⚠️  Services not found in bundle yet."
    echo "   - organizationProfileService: $PROFILE_COUNT occurrences"
    echo "   - tabIntelligenceService: $TAB_COUNT occurrences"
    echo ""
    echo "Try running this script again in 1-2 minutes."
    echo "Or check: https://vercel.com/nivra-sd/signaldesk"
fi

echo ""
echo "📱 Live site: https://signaldesk-nivra-sd.vercel.app"