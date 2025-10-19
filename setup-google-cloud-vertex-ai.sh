#!/bin/bash

# Google Cloud Project Setup Script for Vertex AI
# Project ID: sigdesk-1753801804417

PROJECT_ID="sigdesk-1753801804417"
SERVICE_ACCOUNT_NAME="signaldesk-vertex-ai"
REGION="us-central1"

echo "=========================================="
echo "Google Cloud Vertex AI Setup Script"
echo "Project ID: $PROJECT_ID"
echo "=========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed."
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI is installed"
echo ""

# Set the project
echo "Setting active project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo ""
echo "Enabling required APIs..."
echo "This may take a few minutes..."

# Enable Vertex AI API
echo "1. Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com

# Enable Generative AI on Vertex AI API
echo "2. Enabling Generative AI on Vertex AI API..."
gcloud services enable generativelanguage.googleapis.com

# Enable Cloud Resource Manager API (needed for project operations)
echo "3. Enabling Cloud Resource Manager API..."
gcloud services enable cloudresourcemanager.googleapis.com

echo ""
echo "✅ APIs enabled successfully!"
echo ""

# Create service account
echo "Creating service account: $SERVICE_ACCOUNT_NAME..."
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name="SignalDesk Vertex AI Service Account" \
    --description="Service account for SignalDesk Vertex AI integration"

# Grant Vertex AI User role
echo "Granting Vertex AI User role to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download service account key
echo ""
echo "Creating service account key..."
KEY_FILE="${SERVICE_ACCOUNT_NAME}-key.json"
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo ""
echo "✅ Service account created and key downloaded to: $KEY_FILE"
echo ""

# Instructions for Supabase
echo "=========================================="
echo "NEXT STEPS:"
echo "=========================================="
echo ""
echo "1. Test Imagen 3 in the Console:"
echo "   https://console.cloud.google.com/vertex-ai/generative/vision?project=$PROJECT_ID"
echo ""
echo "2. Add the service account JSON to Supabase:"
echo "   - Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/settings/vault"
echo "   - Create a new secret named: GOOGLE_APPLICATION_CREDENTIALS"
echo "   - Paste the contents of: $KEY_FILE"
echo ""
echo "3. Update the Edge Function to use the service account:"
echo "   The vertex-ai-visual function will automatically use the credentials"
echo ""
echo "4. Your Google API Key is already configured:"
echo "   AIzaSyBwiqy6i_fB_-u82B0tmJiBLGkg_Zu3lvc"
echo ""
echo "5. Test the implementation:"
echo "   The Execute tab should now be able to generate images using Imagen 3"
echo ""
echo "=========================================="
echo "IMPORTANT NOTES:"
echo "=========================================="
echo "- Imagen 3 pricing: ~\$0.020 per image"
echo "- Veo (video) is not yet publicly available"
echo "- Ensure billing is enabled for your project"
echo ""