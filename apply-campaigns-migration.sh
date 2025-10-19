#!/bin/bash

# Apply campaigns table migration directly
NEXT_PUBLIC_SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"

echo "Applying campaigns table migration..."

psql "$DATABASE_URL" -f supabase/migrations/20251009_create_campaigns_table.sql

echo "Done!"
