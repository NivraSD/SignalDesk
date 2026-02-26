# SignalDesk Deployment Guide: Vercel + Supabase

## Overview
This guide ensures successful deployment of SignalDesk with proper Supabase integration on Vercel, preventing the common issue where Vercel deploys without including Supabase.

## Root Cause Analysis
The deployment was failing because:
1. **Supabase SDK was in `devDependencies`** instead of `dependencies` in package.json
2. **RLS policies referenced wrong table** (`profiles` instead of `users`)
3. **Missing environment variables** in Vercel production environment
4. **Hardcoded credentials** in the code (security risk)

## Quick Start Deployment

### Prerequisites
- Vercel CLI: `npm i -g vercel`
- Supabase CLI: `brew install supabase/tap/supabase`
- Node.js 18+ installed
- Git repository initialized

### Step 1: Fix Critical Issues
```bash
# 1. Apply database migrations (fixes RLS policies)
# Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new
# Run the contents of FIX_RLS_POLICIES.sql

# 2. Ensure Supabase SDK is in dependencies (already fixed)
cd frontend
npm install

# 3. Remove any hardcoded credentials (already fixed)
```

### Step 2: Configure Environment Variables
```bash
# Run the setup script
./SETUP_VERCEL_ENV.sh

# Or manually in Vercel Dashboard:
# 1. Go to: https://vercel.com/[your-team]/[your-project]/settings/environment-variables
# 2. Add:
#    - REACT_APP_SUPABASE_URL = https://zskaxjtyuaqazydouifp.supabase.co
#    - REACT_APP_SUPABASE_ANON_KEY = [your-anon-key]
```

### Step 3: Deploy Edge Functions (Optional but Recommended)
```bash
# Deploy Supabase Edge Functions for AI features
./DEPLOY_EDGE_FUNCTIONS.sh

# You'll need your Anthropic API key for Claude integration
```

### Step 4: Deploy to Vercel
```bash
cd frontend

# Deploy to production
vercel --prod

# Or for preview deployment
vercel
```

### Step 5: Verify Deployment
```bash
# Run the test script
./TEST_VERCEL_DEPLOYMENT.sh

# Or manually verify:
# 1. Visit your deployment URL
# 2. Check browser console for errors
# 3. Try logging in
# 4. Test database queries
```

## Deployment Checklist

### Before Deployment
- [ ] Database migrations applied in Supabase
- [ ] Environment variables set in Vercel
- [ ] No hardcoded credentials in code
- [ ] `@supabase/supabase-js` in `dependencies` not `devDependencies`
- [ ] Edge Functions deployed (if using AI features)

### During Deployment
- [ ] Build completes without errors
- [ ] No warnings about missing dependencies
- [ ] Environment variables are loaded

### After Deployment
- [ ] Frontend loads without console errors
- [ ] Login functionality works
- [ ] Database queries succeed
- [ ] Real-time subscriptions connect
- [ ] Edge Functions respond (if deployed)

## File Structure

```
SignalDesk/
├── frontend/                    # React application
│   ├── .env                    # Local environment variables (not committed)
│   ├── package.json            # Dependencies (Supabase must be here!)
│   ├── vercel.json             # Vercel configuration
│   ├── src/
│   │   └── config/
│   │       └── supabase.js    # Supabase client (no hardcoded keys!)
│   └── supabase/
│       └── functions/          # Edge Functions
├── FIX_RLS_POLICIES.sql        # Database migration
├── SETUP_VERCEL_ENV.sh         # Environment setup script
├── DEPLOY_EDGE_FUNCTIONS.sh    # Edge Functions deployment
├── TEST_VERCEL_DEPLOYMENT.sh   # Testing script
└── MONITOR_DEPLOYMENT.sh       # Health monitoring

```

## Environment Variables

### Required for Vercel
```bash
REACT_APP_SUPABASE_URL=https://[your-project].supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
```

### Required for Edge Functions
```bash
ANTHROPIC_API_KEY=sk-ant-...  # For Claude integration
```

## Common Issues & Solutions

### Issue 1: Supabase Not Connected
**Symptom:** "Supabase configuration missing" error in console
**Solution:** 
1. Check environment variables in Vercel dashboard
2. Redeploy with `vercel --prod --force`

### Issue 2: Database Queries Fail
**Symptom:** 401 Unauthorized or "permission denied"
**Solution:**
1. Run RLS policy migrations
2. Check user has correct organization_id
3. Verify auth token is valid

### Issue 3: Edge Functions Not Working
**Symptom:** 404 when calling Edge Functions
**Solution:**
1. Deploy functions: `supabase functions deploy [function-name]`
2. Set secrets: `supabase secrets set ANTHROPIC_API_KEY`
3. Check CORS configuration

### Issue 4: Build Fails on Vercel
**Symptom:** "Module not found: @supabase/supabase-js"
**Solution:**
1. Ensure `@supabase/supabase-js` is in `dependencies` not `devDependencies`
2. Clear build cache: `vercel --prod --force`

## Monitoring

### Health Check
```bash
# Run continuous monitoring
./MONITOR_DEPLOYMENT.sh

# Or check manually
curl https://your-app.vercel.app
curl https://your-project.supabase.co
```

### Logs
- **Vercel Logs:** https://vercel.com/[team]/[project]/functions
- **Supabase Logs:** https://supabase.com/dashboard/project/[id]/logs
- **Edge Function Logs:** `supabase functions logs [function-name]`

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use environment variables** for all sensitive data
3. **Enable RLS** on all tables
4. **Rotate API keys** regularly
5. **Use service role keys** only in backend/Edge Functions
6. **Implement rate limiting** on API endpoints
7. **Enable 2FA** on Vercel and Supabase accounts

## Rollback Procedure

If deployment fails:

```bash
# 1. Revert to previous deployment in Vercel
vercel rollback

# 2. Restore database if needed
# Use Supabase's point-in-time recovery

# 3. Check and fix the issue
# 4. Redeploy when ready
```

## Support & Troubleshooting

### Quick Diagnostics
1. Check build logs in Vercel
2. Verify environment variables are set
3. Test Supabase connection independently
4. Review browser console for errors

### Getting Help
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Check deployment status: https://status.vercel.com

## Future Improvements

To prevent similar issues:

1. **Automated Testing**
   - Add CI/CD pipeline with deployment tests
   - Implement health checks post-deployment

2. **Infrastructure as Code**
   - Use Terraform or Pulumi for consistent deployments
   - Version control infrastructure changes

3. **Monitoring**
   - Set up alerts for deployment failures
   - Implement uptime monitoring
   - Track performance metrics

4. **Documentation**
   - Keep this guide updated
   - Document any new deployment steps
   - Maintain changelog of infrastructure changes

---

**Last Updated:** December 2024
**Maintained By:** SignalDesk Team
**Version:** 1.0.0