# Railway Build Cache Breaking Solution

## Problem Analysis
Railway is using a cached Dockerfile build despite:
- Dockerfiles being removed from the repository
- nixpacks.toml and railway.json configured for Nixpacks
- The error shows: `npm error EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'`

This indicates Railway's build cache is holding onto an old Dockerfile configuration with problematic cache mounts.

## Immediate Solutions

### Solution 1: Force Railway Cache Invalidation via CLI
```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Force a clean deployment with cache clearing
railway up --no-cache

# Alternative: Redeploy with environment variable change
railway variables set CACHE_BUSTER=$(date +%s)
railway up
```

### Solution 2: Railway Dashboard Cache Break
1. Go to your Railway project dashboard
2. Navigate to Settings > Build & Deploy
3. Add a new environment variable:
   - Name: `NIXPACKS_NO_CACHE`
   - Value: `1`
4. Add another variable:
   - Name: `RAILWAY_DOCKERFILE_PATH`
   - Value: `DOES_NOT_EXIST`
5. Trigger a new deployment

### Solution 3: Complete Project Reset
```bash
# 1. Archive current Railway service
railway service delete --yes

# 2. Create new service
railway service create

# 3. Link repository
railway link

# 4. Deploy with Nixpacks explicitly
railway up --nixpacks
```

## Configuration Files to Ensure Nixpacks Usage

### 1. Remove ALL Dockerfile References
```bash
# Remove any Dockerfile or .dockerignore files
find . -name "Dockerfile*" -delete
find . -name ".dockerignore" -delete

# Commit the deletions
git add -A
git commit -m "Remove all Docker-related files to force Nixpacks"
git push
```

### 2. Create Comprehensive Nixpacks Configuration
Create `nixpacks.toml` in the root:
```toml
# Force Nixpacks build without Docker
[phases.setup]
nixPkgs = ["nodejs-20_x", "npm-9_x"]

[phases.install]
dependsOn = ["setup"]
cmds = [
    "echo 'Starting fresh Nixpacks build'",
    "rm -rf node_modules package-lock.json .npm",
    "npm cache clean --force",
    "npm install --no-cache --prefer-offline --no-audit --no-fund"
]

[phases.build]
dependsOn = ["install"]
cmds = ["echo 'Build phase complete'"]

[start]
cmd = "node server.js"

[variables]
NODE_ENV = "production"
NPM_CONFIG_CACHE = "/tmp/.npm"
NPM_CONFIG_PREFER_OFFLINE = "true"
```

### 3. Update railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "nixpacksConfigPath": "./nixpacks.toml",
    "watchPatterns": ["**/*.js", "**/*.json", "!node_modules/**"]
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "environments": {
    "production": {
      "build": {
        "builder": "NIXPACKS"
      }
    }
  }
}
```

### 4. Create .railway/config.json
```json
{
  "version": "2",
  "build": {
    "builder": "nixpacks",
    "buildCommand": null,
    "installCommand": null
  }
}
```

## Nuclear Option: Service Migration

If cache persists despite all attempts:

### Step 1: Export Environment Variables
```bash
railway variables export > railway-vars.env
```

### Step 2: Create New Railway Project
```bash
# Create new project
railway project create signal-desk-new

# Link to new project
railway link signal-desk-new

# Import variables
railway variables import < railway-vars.env
```

### Step 3: Update GitHub Webhook
1. Go to GitHub repository settings
2. Update webhook to point to new Railway project
3. Push code to trigger new deployment

## Verification Commands

```bash
# Check build logs for Nixpacks
railway logs --build | grep -i "nixpacks"

# Verify no Docker usage
railway logs --build | grep -i "docker" || echo "No Docker found - good!"

# Check current builder
railway status | grep -i "builder"
```

## Environment Variables to Add in Railway Dashboard

```env
# Force Nixpacks
NIXPACKS_BUILD_CMD=""
NIXPACKS_INSTALL_CMD="npm ci --production"
RAILWAY_USE_NIXPACKS=true
DISABLE_DOCKER_BUILDS=true

# Cache busting
CACHE_VERSION=v2
BUILD_CACHE_BUSTER=2024-01-15

# NPM Configuration
NPM_CONFIG_CACHE=/tmp/.npm
NPM_CONFIG_LOGLEVEL=error
NPM_CONFIG_FUND=false
NPM_CONFIG_AUDIT=false
```

## Post-Deployment Verification

1. Check build logs for "Using Nixpacks" message
2. Verify no Docker-related errors
3. Confirm node_modules installed without cache mount issues
4. Test application endpoints

## Prevention for Future

1. Add to `.gitignore`:
```
Dockerfile*
.dockerignore
docker-compose*
```

2. Add pre-commit hook:
```bash
#!/bin/sh
# .git/hooks/pre-commit
if git diff --cached --name-only | grep -E "Dockerfile|docker-compose"; then
  echo "Error: Docker files detected. Remove them before committing."
  exit 1
fi
```

3. Regular cache clearing:
```bash
# Add to deployment script
railway variables set DEPLOY_TIME=$(date +%s)
```

## Contact Railway Support

If issue persists after all attempts:
1. Contact Railway support with error logs
2. Request manual cache clear for your project
3. Reference issue: "Cached Dockerfile preventing Nixpacks migration"

## Success Indicators

✅ Build logs show "Using Nixpacks builder"
✅ No Docker-related commands in logs
✅ No cache mount errors
✅ Successful npm install without EBUSY errors
✅ Application starts successfully