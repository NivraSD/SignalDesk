# Vertex AI Authentication Setup

## Current Setup
- OAuth Client ID: 828236259059-bdelovhuc12rgtavs7c5j9o7ftjgtof1.apps.googleusercontent.com
- Project ID: sigdesk-1753801804417

## Option 1: Quick Test with Access Token
```bash
# If you have gcloud CLI installed:
gcloud auth login
gcloud config set project sigdesk-1753801804417
ACCESS_TOKEN=$(gcloud auth print-access-token)
npx supabase secrets set GOOGLE_ACCESS_TOKEN="$ACCESS_TOKEN"
```

## Option 2: Service Account (Recommended)
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=sigdesk-1753801804417
2. Click "CREATE SERVICE ACCOUNT"
3. Name: signaldesk-vertex-ai
4. Grant roles:
   - Vertex AI User
   - Service Account Token Creator
5. Create JSON key
6. Set in Supabase:
```bash
npx supabase secrets set GOOGLE_SERVICE_ACCOUNT="$(cat your-service-account-key.json)"
```

## Option 3: Get OAuth Client Secret
1. Go to: https://console.cloud.google.com/apis/credentials?project=sigdesk-1753801804417
2. Find your OAuth 2.0 Client ID
3. Download or copy the client secret
4. Set in Supabase:
```bash
npx supabase secrets set GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"
```

## Testing
After setting up authentication, test with:
```bash
node test-vertex-direct.js
```

## Current Status
✅ vertex-ai-visual now supports multiple auth methods
✅ Placeholder images working
⏳ Waiting for proper authentication credentials
