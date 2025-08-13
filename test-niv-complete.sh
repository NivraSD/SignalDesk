#!/bin/bash

echo "🤖 Testing Niv PR Strategist Deployment"
echo "========================================"

echo ""
echo "1. Testing Railway backend health..."
health_response=$(curl -s "https://signaldesk-production.up.railway.app/api/health")
echo "✅ Backend health: $health_response"

echo ""
echo "2. Testing Niv health endpoint..."
niv_response=$(curl -s "https://signaldesk-production.up.railway.app/api/niv/health")
echo "✅ Niv endpoint: $niv_response"

echo ""
echo "3. Opening latest frontend deployment..."
echo "🔗 https://signaldesk-frontend-2quvlz7op-nivra-sd.vercel.app"
open "https://signaldesk-frontend-2quvlz7op-nivra-sd.vercel.app"

echo ""
echo "4. Opening test page..."
open "/Users/jonathanliebowitz/Desktop/SignalDesk/test-niv-deployment.html"

echo ""
echo "✨ Niv should now be visible in your SignalDesk activities panel!"
echo "📝 Login to see Niv as the first item in the activities list"
echo ""
echo "If Niv is still not showing:"
echo "- Clear browser cache and refresh"
echo "- Check browser console for errors"
echo "- Make sure you're logged in"