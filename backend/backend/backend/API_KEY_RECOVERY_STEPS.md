# 🔑 SignalDesk API Key Recovery & Setup Steps

Your Claude API key was cancelled because it was exposed in the public GitHub repository. Follow these steps to get back up and running securely.

## ✅ Step-by-Step Recovery Process

### Step 1: Get a New Claude API Key
1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Name it: "SignalDesk Production"
4. **COPY THE KEY - You won't see it again!**

### Step 2: Add to GitHub Secrets
1. Go to: https://github.com/NivraSD/SignalDesk/settings/secrets/actions
2. Click "New repository secret"
3. Add these secrets:

| Secret Name | Value |
|------------|-------|
| CLAUDE_API_KEY | Your new Claude API key from Step 1 |
| JWT_SECRET | Generate with: `openssl rand -base64 32` |
| RAILWAY_TOKEN | Get from Railway (see Step 3) |

### Step 3: Get Railway Token
```bash
# Run this command in your terminal
./scripts/setup-railway-token.sh
```
Or manually:
1. Go to https://railway.app/account/tokens
2. Create new token named "GitHub Actions"
3. Add to GitHub Secrets as RAILWAY_TOKEN

### Step 4: Set Railway Environment Variables
1. Go to Railway Dashboard: https://railway.app
2. Select your SignalDesk project
3. Click on your backend service
4. Go to "Variables" tab
5. Add/Update these variables:

```
CLAUDE_API_KEY=your_new_claude_api_key_here
CLAUDE_MODEL=claude-sonnet-4-20250514
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
```

### Step 5: Redeploy Railway Service
```bash
# In your backend directory
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend
railway up
```

Or trigger from Railway dashboard:
1. Go to your service
2. Click "Redeploy"

### Step 6: Test Your Setup
```bash
# Test Claude API directly
CLAUDE_API_KEY=your_new_key node test-claude-directly.js

# Test your deployed backend
curl https://signaldesk-production.up.railway.app/api/health
```

### Step 7: Push to GitHub (Triggers Auto-Deploy)
```bash
git add .
git commit -m "Secure API key configuration"
git push origin main
```

## 🔒 What We Fixed

1. **Removed all exposed API keys** from code files
2. **Created GitHub Actions workflows** for automated deployment
3. **Updated code** to only use environment variables
4. **Enhanced .gitignore** to prevent future exposures
5. **Added validation** to check for placeholder keys

## 📋 Verification Checklist

- [ ] New Claude API key obtained
- [ ] GitHub Secrets configured
- [ ] Railway environment variables set
- [ ] Backend redeployed successfully
- [ ] Test page works with new key
- [ ] Frontend can call backend APIs

## 🚨 Important Security Notes

1. **NEVER** put API keys in code files
2. **ALWAYS** use environment variables
3. **CHECK** before committing: `git diff` to review changes
4. **ROTATE** keys if you suspect exposure
5. **MONITOR** your Anthropic dashboard for unusual usage

## 🆘 Troubleshooting

### If Railway deployment fails:
```bash
railway logs
```

### If API calls still fail:
1. Check Railway variables are set: `railway variables`
2. Check logs: `railway logs --tail`
3. Verify key format (should start with `sk-ant-api`)

### If frontend gets 401 errors:
1. Ensure JWT_SECRET matches between frontend and backend
2. Check CORS configuration in backend
3. Verify API_BASE_URL in frontend

## 📞 Need More Help?

- Railway Support: https://railway.app/help
- Anthropic Support: https://support.anthropic.com
- GitHub Actions Docs: https://docs.github.com/en/actions

## 🎉 Success!

Once everything is working:
1. Your test page should work: `/test-all-claude-features-complete.html`
2. Frontend should connect without errors
3. All Claude features should be functional

Remember: Your API keys are now secure and will be automatically deployed through GitHub Actions!