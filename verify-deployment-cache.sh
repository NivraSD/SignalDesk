#!/bin/bash

echo "🔍 Verifying SignalDesk V3.2 Cache Fix Deployment..."
echo "=================================================="

# Test URLs
URLS=(
  "https://signaldesk-nivra-sd.vercel.app"
  "https://signaldesk-git-main-nivra-sd.vercel.app"
  "https://signaldesk-6w94ueab6-nivra-sd.vercel.app"
)

for URL in "${URLS[@]}"; do
  echo ""
  echo "Testing: $URL"
  echo "-------------------"
  
  # Check for cache headers
  echo "Cache Headers:"
  curl -s -I "$URL" | grep -i "cache-control" || echo "No cache headers found"
  
  # Check for version in HTML
  echo ""
  echo "Version Check:"
  curl -s "$URL" | grep -E "V3\.2|CACHE FIX|cache-version" | head -5 || echo "Version not found in HTML"
  
  # Check for deployment marker
  echo ""
  echo "Build Version Header:"
  curl -s -I "$URL" | grep -i "x-build-version" || echo "No build version header"
done

echo ""
echo "=================================================="
echo "✅ Deployment verification complete"