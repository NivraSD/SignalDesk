#!/bin/bash

# Fix Gamma Presentation RLS Permissions
# This script applies all necessary RLS policy fixes

set -e  # Exit on error

echo "🔧 Fixing Gamma Presentation Permissions..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "   Please set it in your .env file or export it:"
    echo "   export DATABASE_URL='your-database-url'"
    exit 1
fi

echo "📋 Step 1: Creating presentations storage bucket..."
psql "$DATABASE_URL" -f supabase/migrations/20251025_create_presentations_storage_bucket.sql
echo "✅ Storage bucket created and policies set"
echo ""

echo "📋 Step 2: Fixing table RLS policies..."
psql "$DATABASE_URL" -f supabase/migrations/20251025_fix_gamma_rls_policies.sql
echo "✅ Table RLS policies updated"
echo ""

echo "📋 Step 3: Verifying policies..."

# Check storage policies
echo "   Checking storage bucket policies..."
psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%presentation%';
" | xargs

# Check campaign_presentations policies
echo "   Checking campaign_presentations policies..."
psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) as policy_count
  FROM pg_policies
  WHERE tablename = 'campaign_presentations';
" | xargs

# Check content_library policies
echo "   Checking content_library policies..."
psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) as policy_count
  FROM pg_policies
  WHERE tablename = 'content_library';
" | xargs

echo ""
echo "✅ All done! Permissions have been fixed."
echo ""
echo "Next steps:"
echo "1. Deploy the updated Edge Function:"
echo "   supabase functions deploy gamma-presentation"
echo ""
echo "2. Test it:"
echo "   node test-gamma-export.js"
echo ""
