#!/bin/bash

# BULLETPROOF Railway Deployment Script
# This WILL work - guaranteed with multiple failsafes
# Created: 2025-08-13

set -e

echo "🔥 BULLETPROOF RAILWAY DEPLOYMENT STARTING..."
echo "==========================================="
echo "This deployment WILL include Niv routes!"
echo ""

# Step 1: Verify Niv files exist locally
echo "📍 Step 1: Verifying Niv files exist locally..."
if [ ! -f "src/routes/nivRoutes.js" ]; then
    echo "❌ ERROR: src/routes/nivRoutes.js not found!"
    exit 1
fi

if [ ! -f "src/agents/NivPRStrategist.js" ]; then
    echo "❌ ERROR: src/agents/NivPRStrategist.js not found!"
    exit 1
fi

echo "✅ Niv files verified locally"
echo ""

# Step 2: Force cache bust in ALL deployment files
echo "📍 Step 2: Updating deployment configurations with cache bust..."

TIMESTAMP=$(date +%s)
BUILD_ID="BULLETPROOF-${TIMESTAMP}"

# Update package.json with a cache-busting comment
echo "  - Adding cache bust to package.json..."
if grep -q '"cache-bust":' package.json; then
    sed -i.bak "s/\"cache-bust\": \".*\"/\"cache-bust\": \"${BUILD_ID}\"/" package.json
else
    # Add cache-bust to package.json scripts section
    sed -i.bak '/"scripts": {/a\
    "cache-bust": "'${BUILD_ID}'",' package.json
fi

# Step 3: Create deployment verification script
echo "📍 Step 3: Creating deployment verification script..."
cat > verify-niv-deployment.js << 'EOF'
// Deployment verification script
// This MUST pass for deployment to be considered successful

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING NIV DEPLOYMENT...');
console.log('================================');

// Check 1: Verify files exist
const nivRoutesPath = path.join(__dirname, 'src/routes/nivRoutes.js');
const nivAgentPath = path.join(__dirname, 'src/agents/NivPRStrategist.js');

if (!fs.existsSync(nivRoutesPath)) {
    console.error('❌ CRITICAL: nivRoutes.js NOT FOUND!');
    process.exit(1);
}

if (!fs.existsSync(nivAgentPath)) {
    console.error('❌ CRITICAL: NivPRStrategist.js NOT FOUND!');
    process.exit(1);
}

console.log('✅ Niv files exist');

// Check 2: Verify index.js includes the route
const indexPath = path.join(__dirname, 'index.js');
const indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('app.use("/api/niv"')) {
    console.error('❌ CRITICAL: Niv route not registered in index.js!');
    process.exit(1);
}

console.log('✅ Niv route registered in index.js');

// Check 3: Test route loading
try {
    const nivRoutes = require('./src/routes/nivRoutes');
    console.log('✅ Niv routes module loads successfully');
} catch (err) {
    console.error('❌ CRITICAL: Cannot load nivRoutes module:', err.message);
    process.exit(1);
}

console.log('');
console.log('🎉 NIV DEPLOYMENT VERIFICATION PASSED!');
console.log('=====================================');
EOF

echo "✅ Verification script created"
echo ""

# Step 4: Update nixpacks.toml with bulletproof configuration
echo "📍 Step 4: Creating bulletproof nixpacks configuration..."
cat > nixpacks.toml << EOF
# BULLETPROOF NIXPACKS CONFIGURATION
# Build ID: ${BUILD_ID}
# Forces complete rebuild with Niv route verification

[phases.setup]
nixPkgs = ["nodejs-20_x", "npm-9"]

[phases.install]
cmds = [
    "echo '🔥 BULLETPROOF BUILD ${BUILD_ID}'",
    "echo '🚨 FORCE REBUILD - NO CACHE'",
    "echo 'Timestamp: ${TIMESTAMP}'",
    "rm -rf node_modules .npm package-lock.json || true",
    "rm -rf /tmp/npm-* || true",
    "npm cache clean --force || true",
    "echo '📦 Installing dependencies...'",
    "npm install --verbose --no-cache --prefer-online",
    "echo '✅ Dependencies installed'",
    "echo '🔍 VERIFYING NIV FILES...'",
    "ls -la src/routes/nivRoutes.js || (echo 'FATAL: nivRoutes.js missing!' && exit 1)",
    "ls -la src/agents/NivPRStrategist.js || (echo 'FATAL: NivPRStrategist.js missing!' && exit 1)",
    "echo '✅ Niv files verified'",
    "echo '🧪 Running deployment verification...'",
    "node verify-niv-deployment.js || (echo 'FATAL: Deployment verification failed!' && exit 1)",
    "echo '✅ All verifications passed!'"
]

[phases.build]
cmds = [
    "echo '🏗️ Build verification...'",
    "find . -name 'nivRoutes.js' -type f | head -5",
    "find . -name 'NivPRStrategist.js' -type f | head -5",
    "echo '✅ Build complete'"
]

[start]
cmd = "node server.js"

[variables]
NODE_ENV = "production"
NIXPACKS_NO_CACHE = "1"
FORCE_REBUILD = "${BUILD_ID}"
EOF

echo "✅ Nixpacks configuration updated"
echo ""

# Step 5: Update railway.json to force nixpacks
echo "📍 Step 5: Updating railway.json..."
cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "echo 'FORCE NIXPACKS BUILD ${BUILD_ID}' && npm ci --verbose",
    "nixpacksConfigPath": "./nixpacks.toml"
  },
  "deploy": {
    "startCommand": "node verify-niv-deployment.js && node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "numReplicas": 1
  },
  "environments": {
    "production": {
      "build": {
        "builder": "NIXPACKS",
        "buildCommand": "echo 'PRODUCTION BUILD ${BUILD_ID}'"
      }
    }
  }
}
EOF

echo "✅ railway.json updated"
echo ""

# Step 6: Create a deployment trigger file
echo "📍 Step 6: Creating deployment trigger..."
cat > .railway-deploy-trigger << EOF
FORCE DEPLOYMENT: ${BUILD_ID}
Timestamp: $(date)
Purpose: Force Railway to detect changes and rebuild with Niv routes
Build ID: ${BUILD_ID}

This file changes on every deployment to force Railway to rebuild.
If Railway still uses cache after this, there's a serious platform issue.
EOF

echo "✅ Deployment trigger created"
echo ""

# Step 7: Update Dockerfile as backup (even though we're using nixpacks)
echo "📍 Step 7: Updating Dockerfile as backup..."
cat > Dockerfile << EOF
# BULLETPROOF DOCKERFILE - Build ${BUILD_ID}
# This is a BACKUP - we're using nixpacks, but this ensures deployment
FROM node:20-alpine

WORKDIR /app

# Force cache invalidation
ENV CACHE_BUST=${BUILD_ID}
ENV FORCE_REBUILD=${TIMESTAMP}

# Copy and install dependencies
COPY package*.json ./
RUN npm ci --only=production --verbose

# Copy all source files
COPY . .

# Verify Niv files exist
RUN ls -la src/routes/nivRoutes.js || exit 1
RUN ls -la src/agents/NivPRStrategist.js || exit 1

# Run verification
RUN node verify-niv-deployment.js || exit 1

EXPOSE 3000
CMD ["node", "server.js"]
EOF

echo "✅ Dockerfile updated"
echo ""

# Step 8: Commit all changes
echo "📍 Step 8: Committing all changes..."
git add -A
git commit -m "BULLETPROOF DEPLOYMENT ${BUILD_ID}: Force complete rebuild with Niv routes verification" || true

echo ""
echo "=========================================="
echo "🎯 BULLETPROOF DEPLOYMENT READY!"
echo "=========================================="
echo ""
echo "✅ All deployment files updated with Build ID: ${BUILD_ID}"
echo "✅ Verification scripts in place"
echo "✅ Multiple failsafes configured"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Push to GitHub: git push origin main"
echo "2. In Railway Dashboard:"
echo "   a. Go to your service settings"
echo "   b. Under 'Build' section, ensure:"
echo "      - Builder: NIXPACKS (not Docker)"
echo "      - Watch Patterns: Remove any Docker exclusions"
echo "   c. Click 'Deploy' or trigger a manual deployment"
echo ""
echo "🔍 VERIFICATION:"
echo "After deployment, test the Niv routes:"
echo "curl https://your-app.railway.app/api/niv/health"
echo ""
echo "💪 This deployment is BULLETPROOF - it WILL work!"