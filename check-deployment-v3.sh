#!/bin/bash

echo "🔍 Checking deployment for Version 3.0 updates..."
echo ""

# Check main domain
echo "Checking signaldesk.vercel.app..."
curl -s https://signaldesk.vercel.app/static/js/main.*.js 2>/dev/null | grep -o "VERSION.*3\.0" | head -1 || echo "❌ Version 3.0 not found in main bundle"

# Check for deployment version log
echo ""
echo "Checking for deployment version console log..."
curl -s https://signaldesk.vercel.app/ | grep -o "DEPLOYMENT VERSION" | head -1 || echo "❌ Deployment version log not found"

# Check direct deployment
echo ""
echo "Checking direct deployment URL..."
curl -s https://frontend-zjqu2002o-nivra-sd.vercel.app/ | grep -o "VERSION.*3\.0" | head -1 || echo "❌ Version 3.0 not found in direct URL"

echo ""
echo "✅ Check complete"