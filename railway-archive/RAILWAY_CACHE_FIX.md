# Railway Cache Fix - CRITICAL

## Problem
Railway is using a cached Dockerfile with problematic cache mounts that cause:
```
npm error EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'
```

## Solution
1. Removed all Dockerfiles
2. Using nixpacks configuration only
3. Simplified build process

## Configuration Files

### `.nixpacks/config.json`
```json
{
  "providers": ["node"],
  "buildPlan": {
    "phases": {
      "install": {
        "cmds": [
          "npm ci --verbose"
        ]
      }
    }
  },
  "start": {
    "cmd": "node server.js"
  }
}
```

### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 45,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

## Force Railway to Clear Cache
If deployment still fails, go to Railway dashboard:
1. Settings > Clear Build Cache
2. Trigger new deployment

## Deployment Command
```bash
git push origin main
```

---
*Last updated: 2025-08-13 16:06*