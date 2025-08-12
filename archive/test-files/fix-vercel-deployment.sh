#!/bin/bash

# Vercel Deployment Fix Script
# This script forces a complete cache refresh on Vercel

echo "========================================="
echo "VERCEL DEPLOYMENT FIX - FORCE REFRESH"
echo "========================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "Error: vercel.json not found. Please run this from the project root."
    exit 1
fi

echo ""
echo "Step 1: Installing Vercel CLI if not present..."
if ! command -v vercel &> /dev/null; then
    npm i -g vercel@latest
else
    echo "Vercel CLI already installed"
fi

echo ""
echo "Step 2: Backing up current vercel.json..."
cp vercel.json vercel.json.backup

echo ""
echo "Step 3: Applying aggressive cache-busting configuration..."
cp vercel-fix.json vercel.json

echo ""
echo "Step 4: Creating deployment verification file..."
cat > frontend/src/components/DeploymentVerification.js << 'EOF'
import React from 'react';

const DeploymentVerification = () => {
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Build: 2025-08-09-FORCE-UPDATE</div>
      <div>Component: MediaIntelligence Active</div>
      <div>Cache: Bypassed</div>
    </div>
  );
};

export default DeploymentVerification;
EOF

echo ""
echo "Step 5: Adding version endpoint to App.js..."
# This adds a version check that will be visible in the browser console
cat > frontend/src/utils/versionCheck.js << 'EOF'
// Version check utility
export const checkDeploymentVersion = async () => {
  try {
    const response = await fetch('/version.json?t=' + Date.now());
    const data = await response.json();
    console.log('%c🚀 SignalDesk Deployment Version', 'color: #4CAF50; font-size: 16px; font-weight: bold');
    console.log('%cVersion:', 'color: #2196F3; font-weight: bold', data.version);
    console.log('%cTimestamp:', 'color: #2196F3; font-weight: bold', data.timestamp);
    console.log('%cComponent:', 'color: #2196F3; font-weight: bold', data.component);
    console.log('%cBuild:', 'color: #2196F3; font-weight: bold', data.build);
    
    // Store in window for easy access
    window.__SIGNALDESK_VERSION__ = data;
    
    return data;
  } catch (error) {
    console.error('Failed to fetch version info:', error);
    return null;
  }
};

// Auto-check on load
if (typeof window !== 'undefined') {
  checkDeploymentVersion();
}
EOF

echo ""
echo "Step 6: Committing changes..."
git add .
git commit -m "FORCE: Bypass Vercel cache with aggressive headers and version tracking"

echo ""
echo "Step 7: Pushing to GitHub..."
git push origin main --force-with-lease

echo ""
echo "========================================="
echo "MANUAL STEPS REQUIRED:"
echo "========================================="
echo ""
echo "1. Go to: https://vercel.com/nivra-sd/signaldesk-frontend/settings"
echo ""
echo "2. Environment Variables Section:"
echo "   - Add: VERCEL_FORCE_NO_BUILD_CACHE = 1"
echo "   - Add: BUILD_TIMESTAMP = $(date +%s)"
echo ""
echo "3. Functions Section:"
echo "   - Set 'Purge Cache' to 'Always'"
echo ""
echo "4. Redeploy with these commands:"
echo "   vercel --prod --force"
echo "   OR"
echo "   vercel --prod --no-cache"
echo ""
echo "5. Alternative manual deployment:"
echo "   a) Delete the project in Vercel dashboard"
echo "   b) Re-import from GitHub"
echo "   c) Use the new vercel.json settings"
echo ""
echo "========================================="
echo "VERIFICATION STEPS:"
echo "========================================="
echo ""
echo "After deployment, verify at:"
echo "https://signaldesk-frontend-23tc8mlwq-nivra-sd.vercel.app/version.json"
echo ""
echo "In browser console, run:"
echo "fetch('/version.json?t=' + Date.now()).then(r => r.json()).then(console.log)"
echo ""
echo "Check for MediaIntelligence component at:"
echo "https://signaldesk-frontend-23tc8mlwq-nivra-sd.vercel.app/projects/[projectId]/media-list"
echo ""
echo "========================================="

# Create a direct Vercel CLI deployment command
echo ""
echo "Creating direct deployment script..."
cat > deploy-direct.sh << 'DEPLOY'
#!/bin/bash
echo "Direct Vercel Deployment with Cache Bypass"
echo "==========================================="

# Build locally first
cd frontend
npm install
npm run build
cd ..

# Deploy with Vercel CLI
vercel --prod --no-cache --confirm

echo "Deployment complete. Check the URL provided above."
DEPLOY

chmod +x deploy-direct.sh

echo ""
echo "Script complete! Follow the manual steps above."
echo "Or run ./deploy-direct.sh for direct CLI deployment."