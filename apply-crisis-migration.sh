#!/bin/bash

# Apply crisis tables migration directly via Supabase SQL Editor
echo "📊 Applying crisis tables migration..."
echo ""
echo "INSTRUCTIONS:"
echo "1. Go to https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new"
echo "2. Copy the SQL from: supabase/migrations/20251003_create_crisis_tables.sql"
echo "3. Paste it into the SQL Editor"
echo "4. Click 'Run'"
echo ""
echo "Or, you can run this SQL command directly:"
echo ""
cat supabase/migrations/20251003_create_crisis_tables.sql
