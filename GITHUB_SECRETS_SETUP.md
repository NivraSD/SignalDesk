# 🔐 GitHub Secrets Setup Guide

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### 1. Go to GitHub Repository Settings
- Navigate to: https://github.com/NivraSD/SignalDesk
- Click on **Settings** tab
- In the left sidebar, click **Secrets and variables** → **Actions**
- Click **New repository secret** for each secret below

### 2. Add These Secrets

#### API Keys
- **CLAUDE_API_KEY**
  - Get from: https://console.anthropic.com/settings/keys
  - Create a new API key (since your old one was cancelled)
  
- **JWT_SECRET**
  - Generate a secure random string (at least 32 characters)
  - You can use: `openssl rand -base64 32`

- **GOOGLE_API_KEY**
  - Your Google API key for search functionality
  
- **NEWS_API_KEY**
  - Your News API key for news monitoring
  
- **TWITTER_BEARER_TOKEN**
  - Your Twitter/X API bearer token

#### Railway Deployment
- **RAILWAY_TOKEN**
  - Get from Railway dashboard:
  - Go to https://railway.app/account/tokens
  - Create a new token named "GitHub Actions"
  - Copy and save as GitHub secret

#### Vercel Deployment (Optional)
- **VERCEL_TOKEN**
  - Get from: https://vercel.com/account/tokens
  - Create a new token
  
- **VERCEL_ORG_ID**
  - Find in Vercel project settings
  
- **VERCEL_PROJECT_ID**
  - Find in Vercel project settings

## 🚀 Quick Setup Commands

After adding all secrets, run these commands to verify:

```bash
# Test the GitHub Actions workflow locally (optional)
act -s CLAUDE_API_KEY="your_key" -s RAILWAY_TOKEN="your_token" push

# Or trigger the workflow manually from GitHub
# Go to Actions tab → Select workflow → Run workflow
```

## ✅ Verification Checklist

- [ ] New Claude API key obtained from Anthropic
- [ ] All secrets added to GitHub repository
- [ ] Railway token created and added
- [ ] Pushed changes to trigger deployment
- [ ] Verified Railway environment variables are set
- [ ] Tested application with new API key

## 🔒 Security Notes

- Never commit these values to your repository
- Rotate keys regularly
- Use different keys for dev/staging/production
- Monitor API usage for unusual activity