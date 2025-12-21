# Automated Cookie Refresh

Automatically refreshes auth cookies for premium news sources using Playwright.

## Supported Sources

- NYTimes
- Bloomberg
- WSJ (Wall Street Journal)
- FT (Financial Times)
- WaPo (Washington Post)

## Setup

### 1. GitHub Secrets Required

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

**Supabase Access Token:**
```
SUPABASE_ACCESS_TOKEN  - Get from: https://supabase.com/dashboard/account/tokens
```

**News Site Credentials (add for each source you subscribe to):**
```
NYTIMES_EMAIL
NYTIMES_PASSWORD
BLOOMBERG_EMAIL
BLOOMBERG_PASSWORD
WSJ_EMAIL
WSJ_PASSWORD
FT_EMAIL
FT_PASSWORD
WAPO_EMAIL
WAPO_PASSWORD
```

### 2. Schedule

The workflow runs automatically:
- **Weekly** on Sundays at 2 AM UTC
- **Manually** via workflow_dispatch

### 3. Manual Run

To run manually:
1. Go to Actions tab in GitHub
2. Select "Refresh Auth Cookies" workflow
3. Click "Run workflow"

## Local Testing

```bash
cd scripts/cookie-refresh
npm install
npx playwright install chromium

# Set environment variables
export NYTIMES_EMAIL="your-email"
export NYTIMES_PASSWORD="your-password"
# ... other sources

# Run
npm run refresh
```

## Troubleshooting

### Login Failed
- Check credentials are correct
- Site may have changed login flow (update the login function)
- May need to handle CAPTCHA or 2FA

### No Cookies Extracted
- Login may have failed silently
- Check if site requires additional verification

### Supabase Update Failed
- Verify SUPABASE_ACCESS_TOKEN is valid
- Check project is linked correctly

## Notes

- Cookies typically last 1-4 weeks depending on the site
- Some sites (Bloomberg) are more aggressive with session invalidation
- If a site requires 2FA, you may need to use app passwords or disable 2FA
