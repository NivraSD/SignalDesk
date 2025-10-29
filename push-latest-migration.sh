#!/bin/bash

# Push only the latest migration directly to Supabase without using supabase db push
# This avoids conflicts with old migrations

MIGRATION_FILE="supabase/migrations/20251029_add_category_to_intelligence_targets.sql"

echo "🚀 Pushing migration directly to Supabase..."
echo "File: $MIGRATION_FILE"
echo ""

# URL-encode the password (# becomes %23)
DB_URL="postgresql://postgres.zskaxjtyuaqazydouifp:3uE%230lVz8Cct@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Execute the migration
psql "$DB_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
else
    echo ""
    echo "❌ Migration failed. Check the error above."
fi
