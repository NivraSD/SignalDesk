# Railway Force Nixpacks Build Solution

## Problem
Railway is caching a problematic Dockerfile with this line:
```
RUN --mount=type=cache,id=s/d6f8aa32-8e0b-43ed-a4ac-6aa2d5b20e7e-node_modules/cache,target=/app/node_modules/.cache npm ci --production=false
```

## Solution Implementation

### Files Created/Modified:

1. **Dockerfile** - Created a clean Dockerfile without cache mounts as a fallback
2. **nixpacks.toml** - Enhanced to force Nixpacks and bypass Docker completely
3. **railway.json** - Updated to explicitly use NIXPACKS builder and ignore Dockerfile
4. **railway.toml** - Additional config file that takes precedence
5. **.dockerignore** - Prevents Docker from accessing most files
6. **.npmrc** - Forces npm to avoid cache
7. **railway-force-rebuild.sh** - Script to force a complete rebuild

## How to Deploy

### Option 1: Automatic (Recommended)
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk
./backend/railway-force-rebuild.sh
```

### Option 2: Manual via Git
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend
git add -A
git commit -m "Force Nixpacks build - bypass Docker cache"
git push
```

### Option 3: Railway CLI with Environment Variable
```bash
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend
railway up --environment production -e RAILWAY_BUILDER=NIXPACKS
```

### Option 4: Railway Dashboard
1. Go to your Railway project settings
2. Under "Build" settings, set:
   - Builder: NIXPACKS
   - Build Command: `rm -rf node_modules && npm ci`
3. Add environment variable:
   - `NIXPACKS_NO_CACHE=1`
4. Trigger a new deployment

## Key Changes Made

1. **Multiple Config Files**: Created both railway.json and railway.toml (TOML takes precedence)
2. **Explicit Nixpacks**: All configs now explicitly specify NIXPACKS as the builder
3. **Cache Bypass**: Multiple mechanisms to prevent cache usage:
   - nixpacks.toml removes node_modules and cleans npm cache
   - .npmrc forces cache to /tmp
   - Build commands explicitly clean before install
4. **Docker Bypass**: 
   - watchPatterns exclude Dockerfile
   - .dockerignore prevents Docker from seeing most files
   - railway.toml explicitly ignores Docker files

## Verification

After deployment, check the build logs for:
- "FORCING NIXPACKS BUILD - BYPASSING DOCKER" message
- No mention of Docker cache mounts
- Clean npm install without cache

## Environment Variables to Set in Railway

Add these in Railway dashboard if issues persist:
```
RAILWAY_BUILDER=NIXPACKS
NIXPACKS_NO_CACHE=1
NPM_CONFIG_CACHE=/tmp/.npm
NODE_ENV=production
```

## If Problems Persist

1. Delete the deployment in Railway dashboard
2. Remove the GitHub integration
3. Re-add the GitHub integration
4. Ensure the root directory is set to `/backend`
5. Deploy again

This solution provides multiple layers of defense against Railway using the cached Dockerfile.