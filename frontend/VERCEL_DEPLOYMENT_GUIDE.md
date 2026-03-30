# SignalDesk Frontend - Vercel Deployment Guide

## 🎯 Objective
Deploy SignalDesk frontend on Vercel and connect it to the Supabase backend with working Claude AI integration.

## 📋 Prerequisites
- Vercel account (free tier is sufficient)
- Supabase project configured at: `https://zskaxjtyuaqazydouifp.supabase.co`
- Node.js and npm installed locally

## 🚀 Deployment Steps

### Step 1: Prepare the Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
   ```

2. **Verify configuration files exist:**
   - ✅ `vercel.json` - Vercel configuration
   - ✅ `.env.production` - Production environment variables
   - ✅ `src/config/api.js` - API configuration

### Step 2: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 3: Deploy to Vercel

#### Option A: Using the Deployment Script (Recommended)
```bash
./deploy-to-vercel.sh
```

#### Option B: Manual Deployment
```bash
# Clean previous builds
rm -rf build/ .vercel/

# Install dependencies
npm install

# Build the application
npm run build

# Deploy to Vercel
vercel --prod
```

### Step 4: Configure Environment Variables in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `signaldesk-frontend` project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `REACT_APP_SUPABASE_URL` | `https://zskaxjtyuaqazydouifp.supabase.co` | Production |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8` | Production |
| `REACT_APP_ENV` | `production` | Production |

5. Click **Save** for each variable
6. **Important:** Redeploy after adding variables:
   ```bash
   vercel --prod --force
   ```

### Step 5: Verify Deployment

1. **Access your deployed frontend:**
   - URL format: `https://signaldesk-frontend-[hash].vercel.app`
   - Or your custom domain if configured

2. **Test backend connection:**
   - Navigate to: `https://your-vercel-url/test-backend-connection.html`
   - Run all tests to verify:
     - ✅ API Health Check
     - ✅ CORS Configuration
     - ✅ Authentication
     - ✅ Claude AI Integration

3. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for: `API Configuration: Using Supabase URL: https://zskaxjtyuaqazydouifp.supabase.co`

## 🔧 Troubleshooting

### Issue: Frontend can't connect to backend

**Solution 1: Check CORS on Supabase project**
Ensure your Supabase project allows your Vercel domain:
```javascript
// In your backend server.js
app.use(cors({
  origin: [
    'https://signaldesk-frontend-*.vercel.app',
    'https://your-custom-domain.com',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

**Solution 2: Clear Vercel cache**
```bash
vercel --prod --force
```

**Solution 3: Verify environment variables**
```bash
vercel env ls
```

### Issue: Claude AI not responding

**Solution 1: Check Supabase Edge Functions logs**
```bash
# In Supabase dashboard, check Edge Function logs for Claude API errors
```

**Solution 2: Verify Claude API key in Supabase**
Ensure `ANTHROPIC_API_KEY` is set in Supabase Edge Function secrets

### Issue: Build fails on Vercel

**Solution 1: Disable treating warnings as errors**
Already configured in `vercel.json`:
```json
"build": {
  "env": {
    "CI": "false"
  }
}
```

**Solution 2: Check build logs**
```bash
vercel logs
```

## 📊 Monitoring & Maintenance

### Check Deployment Status
```bash
vercel ls
```

### View Logs
```bash
vercel logs [deployment-url]
```

### Rollback if Needed
```bash
vercel rollback [deployment-url]
```

## 🔐 Security Best Practices

1. **Never commit sensitive data:**
   - API keys should be in Vercel Dashboard, not in code
   - Use `.gitignore` for local `.env` files

2. **Enable HTTPS only:**
   - Vercel handles this automatically

3. **Set proper CORS headers:**
   - Configure in both `vercel.json` and backend

## ✅ Deployment Checklist

- [ ] Frontend builds successfully locally
- [ ] `vercel.json` configured with correct API URL
- [ ] Environment variables set in Vercel Dashboard
- [ ] Deployment successful on Vercel
- [ ] Backend connection verified via test page
- [ ] Claude AI responses working
- [ ] Login/Authentication functional
- [ ] No CORS errors in browser console

## 🆘 Getting Help

1. **Check Vercel Status:** https://vercel-status.com/
2. **Vercel Documentation:** https://vercel.com/docs
3. **Supabase Status:** https://status.supabase.com

## 📝 Notes

- The frontend is configured to automatically connect to the Supabase backend
- All API calls go through the configured `REACT_APP_API_URL`
- The test page at `/test-backend-connection.html` helps diagnose issues
- Vercel automatically provides SSL and handles routing for SPA

## 🎉 Success Indicators

When properly configured, you should see:
1. Frontend loads without errors
2. API calls show correct URL in Network tab
3. Claude AI provides intelligent responses
4. No CORS errors in console
5. Authentication works correctly

---

**Last Updated:** Configuration optimized for Supabase backend at `https://zskaxjtyuaqazydouifp.supabase.co`