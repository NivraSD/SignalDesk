#!/bin/bash

echo "📝 Setting OAuth Client Secret in Supabase"
echo "=========================================="
echo ""
echo "1. First, get your client secret:"
echo "   - Go to: https://console.cloud.google.com/apis/credentials?project=sigdesk-1753801804417"
echo "   - Click on your OAuth 2.0 Client ID:"
echo "     828236259059-bdelovhuc12rgtavs7c5j9o7ftjgtof1.apps.googleusercontent.com"
echo "   - Copy the 'Client secret' value"
echo ""
echo "2. Then run this command with your secret:"
echo ""
echo "   npx supabase secrets set GOOGLE_OAUTH_CLIENT_SECRET=\"YOUR_CLIENT_SECRET_HERE\""
echo ""
echo "Example:"
echo "   npx supabase secrets set GOOGLE_OAUTH_CLIENT_SECRET=\"GOCSPX-xxxxxxxxxxxxx\""
echo ""
echo "3. After setting, the edge function will need to be redeployed to use it:"
echo "   npx supabase functions deploy vertex-ai-visual --no-verify-jwt"
echo ""
echo "=========================================="
echo ""
read -p "Do you have your client secret ready? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your client secret: " CLIENT_SECRET
    if [ ! -z "$CLIENT_SECRET" ]; then
        echo "Setting secret in Supabase..."
        npx supabase secrets set GOOGLE_OAUTH_CLIENT_SECRET="$CLIENT_SECRET"
        echo "✅ Secret set! Now redeploying function..."
        npx supabase functions deploy vertex-ai-visual --no-verify-jwt
        echo "✅ Done! The OAuth client secret is now available to your edge function."
    else
        echo "❌ No secret provided"
    fi
else
    echo "Please get your client secret from the Google Cloud Console first."
fi
