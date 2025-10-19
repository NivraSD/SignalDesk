#!/bin/bash

# BULLETPROOF NIV DEPLOYMENT TEST
# Run this after deployment to verify Niv routes are working

set -e

echo "🔍 TESTING NIV DEPLOYMENT..."
echo "============================"
echo ""

# Get the Railway app URL (you'll need to set this)
if [ -z "$RAILWAY_URL" ]; then
    echo "Please set RAILWAY_URL environment variable"
    echo "Example: export RAILWAY_URL=https://your-app.railway.app"
    exit 1
fi

echo "Testing deployment at: $RAILWAY_URL"
echo ""

# Test 1: Health check
echo "📍 Test 1: Basic health check..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/health" || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Health check passed"
else
    echo "   ❌ Health check failed (HTTP $HEALTH_RESPONSE)"
fi

# Test 2: Niv route exists
echo ""
echo "📍 Test 2: Testing Niv route existence..."
NIV_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/niv/health" || echo "000")
if [ "$NIV_RESPONSE" = "200" ] || [ "$NIV_RESPONSE" = "401" ]; then
    echo "   ✅ Niv route exists (HTTP $NIV_RESPONSE)"
    if [ "$NIV_RESPONSE" = "401" ]; then
        echo "   ℹ️  Route requires authentication (expected)"
    fi
else
    echo "   ❌ NIV ROUTE NOT FOUND (HTTP $NIV_RESPONSE)"
    echo "   ❌ DEPLOYMENT FAILED - NIV ROUTES MISSING!"
fi

# Test 3: Check all Niv endpoints
echo ""
echo "📍 Test 3: Testing all Niv endpoints..."

NIV_ENDPOINTS=(
    "/api/niv/health"
    "/api/niv/analyze"
    "/api/niv/strategy"
    "/api/niv/campaign"
)

for endpoint in "${NIV_ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL$endpoint" || echo "000")
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "405" ]; then
        echo "   ✅ $endpoint exists (HTTP $RESPONSE)"
    else
        echo "   ❌ $endpoint NOT FOUND (HTTP $RESPONSE)"
    fi
done

# Test 4: Server info endpoint (if available)
echo ""
echo "📍 Test 4: Getting server info..."
curl -s "$RAILWAY_URL/api/health" | head -5 || echo "Could not get server info"

echo ""
echo "============================"
echo "🏁 NIV DEPLOYMENT TEST COMPLETE"
echo ""

if [ "$NIV_RESPONSE" = "200" ] || [ "$NIV_RESPONSE" = "401" ]; then
    echo "✅ SUCCESS: Niv routes are deployed!"
else
    echo "❌ FAILURE: Niv routes are NOT deployed!"
    echo ""
    echo "Railway has failed to deploy the Niv routes despite all our configurations."
    echo "This indicates a serious issue with Railway's deployment system."
    echo ""
    echo "NEXT STEPS:"
    echo "1. Check Railway build logs for errors"
    echo "2. Verify the service is using NIXPACKS builder"
    echo "3. Try deleting and recreating the Railway service"
    echo "4. Contact Railway support with this evidence"
fi