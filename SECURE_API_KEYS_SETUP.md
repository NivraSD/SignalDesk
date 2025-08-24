# 🔒 URGENT: Secure API Keys Setup for SignalDesk

## ⚠️ CRITICAL: Your API Keys Were Exposed!

Your Claude API key was cancelled because it was exposed in the public GitHub repository. Here's how to fix this securely:

## 📋 Immediate Actions Required

### 1. Get a New Claude API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create a new API key
3. **DO NOT PUT IT IN ANY CODE FILE**

### 2. Set Up GitHub Secrets
1. Go to your GitHub repository: https://github.com/NivraSD/SignalDesk
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:
   - Name: `CLAUDE_API_KEY` → Value: Your new Claude API key
   - Name: `JWT_SECRET` → Value: A secure random string
   - Name: `GOOGLE_API_KEY` → Value: Your Google API key
   - Name: `NEWS_API_KEY` → Value: Your News API key
   - Name: `TWITTER_BEARER_TOKEN` → Value: Your Twitter token

### 3. Set Up Railway Environment Variables
1. Go to Railway Dashboard
2. Select your SignalDesk project
3. Go to **Variables** tab
4. Add these variables:
   ```
   CLAUDE_API_KEY=your_new_claude_api_key
   CLAUDE_MODEL=claude-3-5-sonnet-20241022
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```

### 4. Update .gitignore
Make sure `.env` files are NEVER committed:
```gitignore
# Environment variables
.env
.env.*
*.env
.env.local
.env.production
backend/.env
frontend/.env
```

### 5. Use GitHub Actions for Deployment (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        with:
          service: signaldesk-backend
          
      - name: Set Railway Environment Variables
        run: |
          railway variables set CLAUDE_API_KEY=${{ secrets.CLAUDE_API_KEY }}
          railway variables set JWT_SECRET=${{ secrets.JWT_SECRET }}
```

## 🛡️ Security Best Practices

### NEVER Do This:
- ❌ Hardcode API keys in code
- ❌ Commit `.env` files to Git
- ❌ Share API keys in documentation
- ❌ Use the same API key in multiple places

### ALWAYS Do This:
- ✅ Use environment variables
- ✅ Store secrets in GitHub Secrets
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys regularly
- ✅ Monitor for exposed secrets

## 🔧 Local Development Setup

For local development, create `backend/.env.local`:
```env
CLAUDE_API_KEY=your_dev_api_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
JWT_SECRET=local-dev-secret
NODE_ENV=development
```

**Never commit this file!**

## 📝 Code Changes Required

### Update backend/config/claude.js:
```javascript
const claudeApiKey = process.env.CLAUDE_API_KEY;

if (!claudeApiKey || claudeApiKey === 'YOUR_NEW_CLAUDE_API_KEY_HERE') {
  console.error('⚠️ CLAUDE_API_KEY not set in environment variables!');
  console.error('Please set it in Railway dashboard or .env.local for development');
  // Return mock responses in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock Claude responses for development');
  } else {
    throw new Error('CLAUDE_API_KEY is required in production');
  }
}
```

## 🚀 Deployment Checklist

Before deploying:
- [ ] New Claude API key obtained from Anthropic
- [ ] GitHub Secrets configured
- [ ] Railway environment variables set
- [ ] `.env` files removed from Git history
- [ ] `.gitignore` updated
- [ ] No hardcoded keys in any files
- [ ] Test with new API key

## 🔍 Check for Exposed Keys

Run this command to check for any exposed keys:
```bash
# Search for potential API keys
grep -r "sk-ant-api" . --exclude-dir=node_modules
grep -r "AIzaSy" . --exclude-dir=node_modules
grep -r "Bearer" . --exclude-dir=node_modules
```

## 📚 Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Anthropic API Keys](https://console.anthropic.com/settings/keys)

## ⚡ Quick Fix for Now

1. Get new Claude API key from Anthropic
2. Set it in Railway dashboard (Variables tab)
3. Redeploy Railway service
4. Your app will work again!

**Remember: NEVER commit API keys to Git!**