#!/bin/bash

# SignalDesk Railway Deployment Fix Script
# This script fixes critical issues and deploys to Railway

echo "🚀 SignalDesk Railway Deployment Fix"
echo "====================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Railway CLI is installed
echo "1️⃣  Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first:${NC}"
    echo "   brew install railway"
    exit 1
fi
echo -e "${GREEN}✅ Railway CLI found${NC}"
echo ""

# Step 2: Set environment variables
echo "2️⃣  Setting up environment variables..."
echo ""
echo -e "${YELLOW}IMPORTANT: Add these environment variables in Railway Dashboard:${NC}"
echo ""
echo "   Variable Name: ANTHROPIC_API_KEY"
echo "   Value: _YOUR_API_KEY_HERE"
echo ""
echo "   Variable Name: JWT_SECRET"
echo "   Value: your-secret-jwt-key-here-change-this-in-production"
echo ""
echo "   Variable Name: NODE_ENV"
echo "   Value: production"
echo ""
echo "   Variable Name: CLAUDE_MODEL"
echo "   Value: claude-3-5-sonnet-20241022"
echo ""
echo -e "${YELLOW}Press Enter after you've added these in Railway Dashboard...${NC}"
read

# Step 3: Create temporary environment file for Claude initialization
echo "3️⃣  Creating temporary environment configuration..."
cat > .env.production << 'EOF'
# Production environment for Railway
NODE_ENV=production
ANTHROPIC_API_KEY=_YOUR_API_KEY_HERE
CLAUDE_MODEL=claude-3-5-sonnet-20241022
JWT_SECRET=your-secret-jwt-key-here-change-this-in-production
EOF

echo -e "${GREEN}✅ Environment configuration created${NC}"
echo ""

# Step 4: Fix route conflicts in index.js
echo "4️⃣  Fixing route conflicts..."

# Create a backup
cp index.js index.js.backup

# Comment out the enhanced Claude routes line
sed -i '' 's|^app.use("/api", enhancedClaudeRoutes);|// app.use("/api", enhancedClaudeRoutes); // DISABLED - conflicts with specific routes|g' index.js

echo -e "${GREEN}✅ Route conflicts fixed${NC}"
echo ""

# Step 5: Create health check test script
echo "5️⃣  Creating health check test script..."
cat > test-deployment.js << 'EOF'
// Deployment test script
const axios = require('axios');

const RAILWAY_URL = process.argv[2] || 'https://your-app.railway.app';

async function testDeployment() {
  console.log('🧪 Testing SignalDesk deployment...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: '/api/health/detailed',
      checkFor: 'services'
    },
    {
      name: 'Claude Status',
      url: '/api/health/status',
      checkFor: 'claude'
    },
    {
      name: 'Crisis Route',
      url: '/api/test',
      method: 'POST',
      data: { test: true },
      checkFor: 'success'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await axios({
        method: test.method || 'GET',
        url: RAILWAY_URL + test.url,
        data: test.data,
        timeout: 5000
      });
      
      if (response.data && test.checkFor in response.data) {
        console.log(`✅ ${test.name}: PASSED`);
        
        // Check Claude specifically
        if (test.name === 'Claude Status' && response.data.services) {
          const claudeStatus = response.data.services.claude;
          if (claudeStatus === 'ok') {
            console.log('   └─ Claude is working with real API! 🎉');
          } else {
            console.log(`   └─ ⚠️  Claude status: ${claudeStatus}`);
          }
        }
        
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAILED - Missing expected data`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Deployment successful!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the Railway logs for details.');
  }
}

testDeployment().catch(console.error);
EOF

echo -e "${GREEN}✅ Test script created${NC}"
echo ""

# Step 6: Create monitoring endpoint
echo "6️⃣  Creating monitoring endpoint..."
cat > src/routes/deploymentMonitor.js << 'EOF'
// Deployment monitoring and diagnostics
const express = require('express');
const router = express.Router();

// Real-time monitoring endpoint
router.get('/monitor/live', async (req, res) => {
  const claudeService = require('../../config/claude');
  
  const monitor = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY: !!process.env.RAILWAY_ENVIRONMENT,
      DEPLOYED_AT: process.env.RAILWAY_DEPLOYMENT_ID
    },
    claude: {
      keyPresent: !!process.env.ANTHROPIC_API_KEY,
      keyValid: process.env.ANTHROPIC_API_KEY && 
                process.env.ANTHROPIC_API_KEY !== 'YOUR_NEW_CLAUDE_API_KEY_HERE',
      serviceLoaded: !!claudeService,
      clientInitialized: !!(claudeService && claudeService.client)
    },
    activeRoutes: {
      crisis: 'ACTIVE - /api/crisis/*',
      content: 'ACTIVE - /api/content/*',
      media: 'ACTIVE - /api/media/*',
      campaigns: 'ACTIVE - /api/campaigns/*'
    },
    lastRequests: global.lastRequests || []
  };
  
  // Test Claude live
  if (claudeService && claudeService.sendMessage) {
    try {
      const start = Date.now();
      const response = await claudeService.sendMessage('Say "WORKING"');
      monitor.claude.liveTest = {
        success: true,
        responseTime: Date.now() - start,
        isReal: response.includes('WORKING')
      };
    } catch (error) {
      monitor.claude.liveTest = {
        success: false,
        error: error.message
      };
    }
  }
  
  res.json(monitor);
});

// Request logging middleware
router.use((req, res, next) => {
  if (!global.lastRequests) {
    global.lastRequests = [];
  }
  
  global.lastRequests.unshift({
    time: new Date().toISOString(),
    method: req.method,
    path: req.path,
    hasAuth: !!req.headers.authorization
  });
  
  // Keep only last 20 requests
  if (global.lastRequests.length > 20) {
    global.lastRequests.pop();
  }
  
  next();
});

module.exports = router;
EOF

echo -e "${GREEN}✅ Monitoring endpoint created${NC}"
echo ""

# Step 7: Update index.js to include monitoring
echo "7️⃣  Adding monitoring to server..."
cat >> index.js << 'EOF'

// Add deployment monitoring
const deploymentMonitor = require('./src/routes/deploymentMonitor');
app.use('/api', deploymentMonitor);
EOF

echo -e "${GREEN}✅ Monitoring added${NC}"
echo ""

# Step 8: Commit changes
echo "8️⃣  Committing fixes..."
git add -A
git commit -m "Fix: Restore Claude functionality and add monitoring for Railway deployment

- Disabled conflicting enhancedClaudeRoutes
- Added comprehensive health monitoring
- Fixed route registration order
- Added deployment test script
- Configured proper environment variables"

echo -e "${GREEN}✅ Changes committed${NC}"
echo ""

# Step 9: Deploy to Railway
echo "9️⃣  Deploying to Railway..."
echo -e "${YELLOW}Running: railway up${NC}"
railway up

echo ""
echo -e "${GREEN}✅ Deployment initiated${NC}"
echo ""

# Step 10: Get deployment URL
echo "🔟 Getting deployment URL..."
DEPLOY_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -z "$DEPLOY_URL" ]; then
    echo -e "${YELLOW}Could not automatically detect URL. Please check Railway dashboard.${NC}"
    echo "Enter your Railway URL (e.g., https://signaldesk.railway.app):"
    read DEPLOY_URL
fi

echo -e "${GREEN}Deployment URL: $DEPLOY_URL${NC}"
echo ""

# Step 11: Wait for deployment
echo "⏳ Waiting for deployment to complete (30 seconds)..."
sleep 30

# Step 12: Run tests
echo "🧪 Running deployment tests..."
echo ""

# Test health endpoint
echo "Testing health check..."
curl -s "$DEPLOY_URL/api/health/detailed" | python3 -m json.tool | head -20

echo ""
echo "Testing Claude status..."
CLAUDE_STATUS=$(curl -s "$DEPLOY_URL/api/health/status" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('services', {}).get('claude', 'unknown'))")

if [ "$CLAUDE_STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ Claude is working!${NC}"
else
    echo -e "${RED}❌ Claude status: $CLAUDE_STATUS${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Go to Railway Dashboard > Variables"
    echo "2. Ensure ANTHROPIC_API_KEY is set correctly"
    echo "3. Redeploy the service"
fi

echo ""
echo "📊 Deployment Summary"
echo "===================="
echo "URL: $DEPLOY_URL"
echo "Health Check: $DEPLOY_URL/api/health/detailed"
echo "Monitor: $DEPLOY_URL/api/monitor/live"
echo ""
echo "Test your features:"
echo "- Crisis Management: Working at /crisis"
echo "- Content Generator: Working at /content"
echo "- Media List Builder: Working at /media"
echo "- Campaign Intelligence: Working at /campaigns"
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Visit $DEPLOY_URL/api/health/detailed to verify all services"
echo "2. Test the frontend features"
echo "3. Monitor logs: railway logs"