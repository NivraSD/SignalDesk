# Cleanup List

## Files to Remove (35+ test files)

### Backend Test Files
- All `test-*.js` files
- All `TEST-*.js` files  
- All `*.log` files
- Old deployment files (railway.toml, render.yaml, etc.)
- Duplicate/backup files (*.backup, *.broken, etc.)

### Frontend Test Files  
- `/src/components/Monitoring/TEST-*.js`
- `/src/components/Monitoring/DEBUG-*.js`
- `/src/components/Monitoring/test-*.js`
- `/src/services/api.js.broken`
- `/src/services/api.js.backup`

### Other Cleanup
- Remove hardcoded localhost references (46 files)
- Remove unused monitoring components
- Clean up package.json dependencies

## Safe to Keep
- DEPLOYMENT_GUIDE.md
- Core business logic files
- Authentication system
- Database schemas
- API endpoints

## Command to Clean Test Files
```bash
# Dry run first (see what would be deleted)
find . -name "test-*.js" -o -name "TEST-*.js" -o -name "*.log" -o -name "*.backup" -o -name "*.broken"

# Actually delete (BE CAREFUL)
find . -name "test-*.js" -o -name "TEST-*.js" -o -name "*.log" -o -name "*.backup" -o -name "*.broken" -delete
```