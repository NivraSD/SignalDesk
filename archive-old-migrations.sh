#!/bin/bash

# Archive migrations older than today to avoid pushing old schemas
# This keeps only recent migrations that need to be applied

echo "📦 Archiving old migrations..."

# Create archive directory
mkdir -p supabase/migrations/archived_2025

# Move all migrations from October 28 and earlier
mv supabase/migrations/202510[0-2][0-8]_*.sql supabase/migrations/archived_2025/ 2>/dev/null

# Move archived and temp files
mv supabase/migrations/_archived_*.sql supabase/migrations/archived_2025/ 2>/dev/null
mv supabase/migrations/_temp_*.sql supabase/migrations/archived_2025/ 2>/dev/null

# Move the old schema file
mv supabase/migrations/schema_v3.sql supabase/migrations/archived_2025/ 2>/dev/null

echo "✅ Old migrations archived to supabase/migrations/archived_2025/"
echo ""
echo "📋 Remaining migrations to be pushed:"
ls -1 supabase/migrations/*.sql 2>/dev/null || echo "No migrations remaining"
