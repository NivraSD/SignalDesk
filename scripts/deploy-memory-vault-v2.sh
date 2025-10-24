#!/bin/bash

# Memory Vault V2: Deployment Script
# This script deploys all Memory Vault V2 components

set -e # Exit on error

echo "🚀 Deploying Memory Vault V2..."
echo ""

# Check if supabase CLI is installed
if ! command -v npx supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

# 1. Run database migration
echo "📊 Running database migration..."
npx supabase db push
echo "✅ Database migration complete"
echo ""

# 2. Deploy Edge Functions
echo "🔧 Deploying Edge Functions..."

echo "  → Deploying niv-memory-intelligence..."
npx supabase functions deploy niv-memory-intelligence

echo "  → Deploying analyze-brand-asset..."
npx supabase functions deploy analyze-brand-asset

echo "✅ Edge Functions deployed"
echo ""

# 3. Create storage bucket for brand assets
echo "📦 Setting up storage..."
echo "  Note: If bucket already exists, this will fail gracefully"

npx supabase storage create brand-assets --public || echo "  Bucket may already exist"

echo "✅ Storage setup complete"
echo ""

# 4. Instructions for job worker
echo "📋 Next steps:"
echo ""
echo "1. Start the job worker:"
echo "   npm run worker"
echo ""
echo "2. Monitor logs:"
echo "   npx supabase functions logs niv-memory-intelligence"
echo "   npx supabase functions logs analyze-brand-asset"
echo ""
echo "3. Test the save endpoint:"
echo "   curl -X POST http://localhost:3000/api/content-library/save \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"content\": {\"type\": \"test\", \"title\": \"Test\", \"content\": \"Hello\"}}'"
echo ""

echo "✨ Memory Vault V2 deployment complete!"
