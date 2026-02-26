# Railway Support Ticket Documentation

## Issue Summary
Railway is using a phantom cached Dockerfile that doesn't exist in the repository, even when:
- Builder is explicitly set to "Nixpacks" in settings
- No Dockerfile exists in the repository
- New services are created from scratch
- All cache-clearing attempts have been made

## Error Details

### Consistent Error (Repeating every deployment):
```
RUN --mount=type=cache,id=s/d6f8aa32-8e0b-43ed-a4ac-6aa2d5b20e7e-node_modules/cache,target=/app/node_modules/.cache npm ci --production=false

npm error code EBUSY
npm error syscall rmdir
npm error path /app/node_modules/.cache
npm error errno -16
npm error EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'
```

### Error on New Service:
```
failed to calculate checksum of ref k9f49ssw16oqdbc1ncn9mnk7i::u5pdho5lst153hnf1qfl3jcb0: "/.nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix": not found
```

## What We've Tried

1. ✅ Removed all Dockerfiles from repository
2. ✅ Set Builder to "Nixpacks" in Railway settings
3. ✅ Created nixpacks.toml, nixpacks.json, railway.toml configurations
4. ✅ Added environment variables to force Nixpacks
5. ✅ Created brand new service (still fails)
6. ✅ Pushed multiple commits to break cache
7. ✅ Added .railwayignore to exclude Docker files

## Current Repository State

- **NO Dockerfile exists** in the repository
- **nixpacks.toml** is present and configured
- **railway.json** explicitly sets builder to NIXPACKS
- **railway.toml** forces Nixpacks configuration

## Request for Railway Support

1. **Clear ALL build caches** for the entire project
2. **Force the service to use Nixpacks** builder
3. **Remove any phantom Dockerfile references** from Railway's internal cache
4. **Investigate why new services inherit cached Docker configurations**

## Project Details

- Repository: `NivraSD/SignalDesk`
- Root Directory: `/backend`
- Desired Builder: Nixpacks
- Node.js version: 20.x

## Temporary Workaround Needed

While this is being fixed, we need either:
1. A way to completely bypass Railway's build cache
2. Manual cache clearing by Railway team
3. A fresh project that doesn't inherit corrupted cache

## Impact

- Cannot deploy any updates
- Production service is stuck on old version
- New services fail immediately
- Business operations affected

---

**Last Updated**: August 13, 2025
**Ticket Status**: Submitted to Railway Support
**Severity**: Critical - Production Blocked