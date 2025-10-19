#!/bin/bash
# Get an access token using gcloud CLI

echo "Getting access token from gcloud..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get the access token
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Failed to get access token"
    echo "Run: gcloud auth login"
    echo "Then: gcloud config set project sigdesk-1753801804417"
else
    echo "✅ Access token obtained!"
    echo ""
    echo "To set it in Supabase, run:"
    echo "npx supabase secrets set GOOGLE_ACCESS_TOKEN=\"$ACCESS_TOKEN\""
    echo ""
    echo "Or test directly:"
    echo "export GOOGLE_ACCESS_TOKEN=\"$ACCESS_TOKEN\""
fi
