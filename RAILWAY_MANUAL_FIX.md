# URGENT: Railway Manual Fix Required

## The Problem
Railway is using a **cached Dockerfile** that doesn't exist in our repository. It's completely ignoring our files and using an old cached build configuration with problematic cache mounts.

## Manual Fix Required in Railway Dashboard

### Step 1: Go to Railway Dashboard
1. Open https://railway.app
2. Navigate to your SignalDesk project
3. Click on the backend service

### Step 2: Force Nixpacks Builder
1. Go to **Settings** tab
2. Scroll to **Build Configuration**
3. Find **Builder** dropdown
4. **Change from "Dockerfile" to "Nixpacks"**
5. Click **Save**

### Step 3: Add Environment Variables
Go to **Variables** tab and add:
- `NIXPACKS_NO_CACHE` = `true`
- `RAILWAY_DOCKERFILE_PATH` = (leave empty)
- `RAILWAY_SKIP_BUILD_CACHE` = `true`
- `DISABLE_DOCKER` = `true`

### Step 4: Clear Build Cache
1. Go to **Settings** → **Danger Zone**
2. Click **"Clear Build Cache"** if available
3. Or click **"Restart Service"**

### Step 5: Trigger New Deployment
1. Go to **Deployments** tab
2. Click **"Trigger Deployment"** or **"Redeploy"**

## Alternative: Delete and Recreate Service

If the above doesn't work:

1. **Delete the current service**:
   - Settings → Danger Zone → Delete Service

2. **Create new service**:
   - Click "New Service"
   - Select "GitHub Repo"
   - Choose your repository
   - Select `/backend` as root directory
   - Ensure **Nixpacks** is selected as builder

3. **Add environment variables** from your old service

## What This Fixes

Railway is stuck using this cached Dockerfile line:
```
RUN --mount=type=cache,id=s/d6f8aa32-8e0b-43ed-a4ac-6aa2d5b20e7e-node_modules/cache,target=/app/node_modules/.cache npm ci --production=false
```

By forcing Nixpacks, Railway will:
- Ignore any Dockerfile
- Use our nixpacks.toml configuration
- Build without cache mounts
- Deploy successfully

## Verification

After deployment starts, check the build logs for:
- "NIXPACKS BUILD - NOT DOCKER" message
- No Docker-related commands
- No cache mount errors

---
**This is a Railway platform issue where their cache is overriding repository files. Manual intervention through their dashboard is required.**