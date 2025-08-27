#!/bin/bash

echo "🚀 Forcing fresh Vercel deployment..."

# Add a timestamp to force a new deployment
echo "// Force deployment: $(date)" >> frontend/src/App.js

# Commit and push
git add frontend/src/App.js
git commit -m "Force fresh Vercel deployment - $(date)"
git push origin main

echo "✅ Pushed changes to trigger fresh deployment"
echo "⏳ Wait 1-2 minutes for Vercel to deploy"
echo ""
echo "To check deployment status:"
echo "  vercel list --yes | head -5"