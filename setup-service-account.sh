#!/bin/bash

echo "🔑 Setting up Service Account: vertex-express@sigdesk-1753801804417.iam.gserviceaccount.com"
echo "============================================================================================="
echo ""
echo "Step 1: Get the JSON key for your service account"
echo "--------------------------------------------------"
echo "1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=sigdesk-1753801804417"
echo "2. Click on: vertex-express@sigdesk-1753801804417.iam.gserviceaccount.com"
echo "3. Go to the 'Keys' tab"
echo "4. Click 'ADD KEY' > 'Create new key' > 'JSON'"
echo "5. Download the JSON file"
echo ""
echo "Step 2: Set it in Supabase"
echo "---------------------------"
echo "Run this command with your downloaded JSON file:"
echo ""
echo "  npx supabase secrets set GOOGLE_SERVICE_ACCOUNT=\"\$(cat path/to/your-key.json)\""
echo ""
echo "Example:"
echo "  npx supabase secrets set GOOGLE_SERVICE_ACCOUNT=\"\$(cat ~/Downloads/sigdesk-*.json)\""
echo ""
echo "Step 3: Redeploy the edge function"
echo "-----------------------------------"
echo "  npx supabase functions deploy vertex-ai-visual --no-verify-jwt"
echo ""
echo "============================================================================================="
echo ""
echo "Alternatively, if you already have the JSON key, paste it here:"
read -p "Do you have the JSON key file? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter the path to your JSON key file: " KEY_PATH
    if [ -f "$KEY_PATH" ]; then
        echo "Setting service account in Supabase..."
        npx supabase secrets set GOOGLE_SERVICE_ACCOUNT="$(cat $KEY_PATH)"
        echo "✅ Service account set! Redeploying function..."
        npx supabase functions deploy vertex-ai-visual --no-verify-jwt
        echo "✅ Done! Service account authentication is now configured."
    else
        echo "❌ File not found: $KEY_PATH"
    fi
fi
