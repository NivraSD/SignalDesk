#!/bin/bash

echo "🚀 Forcing Vercel to rebuild with Media Intelligence Platform"
echo "=============================================="

# Add a timestamp to package.json to force cache invalidation
cd frontend
TIMESTAMP=$(date +%s)
npm version patch --no-git-tag-version

# Commit the change
cd ..
git add frontend/package.json frontend/package-lock.json
git commit -m "Force Vercel rebuild with Media Intelligence - v$TIMESTAMP

This forces a clean build to ensure the new Media Intelligence Platform is deployed.
Includes all new features:
- Smart search interface
- Media landscape analysis  
- Opportunity scoring
- Competitive intelligence
- AI-generated pitch angles
- Conversation starters

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger deployment
git push origin main

echo ""
echo "✅ Pushed to GitHub. Vercel should now rebuild with the new Media Intelligence Platform."
echo "🔍 Check deployment at: https://vercel.com/nivra-sd/signaldesk-frontend"
echo "📱 Once deployed, visit: https://signaldesk-frontend-23tc8mlwq-nivra-sd.vercel.app"
echo ""
echo "Test the new features:"
echo "1. Login with demo@signaldesk.com / demo123"
echo "2. Go to any project"
echo "3. Click 'Media List' in the sidebar"
echo "4. You should see the new Media Intelligence Platform!"