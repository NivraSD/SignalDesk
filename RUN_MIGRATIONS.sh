#!/bin/bash

# Run Database Migrations for Supabase
# This script applies all necessary database migrations

echo "🗄️  Running Supabase Database Migrations"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Supabase connection details
SUPABASE_PROJECT_ID="zskaxjtyuaqazydouifp"
SUPABASE_DB_URL="https://$SUPABASE_PROJECT_ID.supabase.co"

echo ""
echo -e "${YELLOW}📋 Migrations to apply:${NC}"
echo "1. Fix RLS policies (users table reference)"
echo "2. Grant proper permissions for Edge Functions"
echo "3. Ensure all tables have proper indexes"
echo ""

# Check if user wants to proceed
read -p "Do you want to proceed with migrations? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Migrations cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Starting migrations...${NC}"
echo ""

# Instructions for running migrations
echo -e "${YELLOW}Option 1: Run via Supabase Dashboard (Recommended)${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_ID/sql/new"
echo "2. Copy the contents of FIX_RLS_POLICIES.sql"
echo "3. Paste and run in SQL Editor"
echo ""

echo -e "${YELLOW}Option 2: Run via Supabase CLI${NC}"
echo "Run these commands:"
echo ""
echo "cd frontend"
echo "supabase db push --file ../FIX_RLS_POLICIES.sql"
echo ""

echo -e "${YELLOW}Option 3: Create migration files${NC}"
echo "Run these commands to create proper migration structure:"
echo ""
cat << 'EOF'
# Create migrations directory
mkdir -p frontend/supabase/migrations

# Copy migration files
cp FIX_RLS_POLICIES.sql frontend/supabase/migrations/20240101000001_fix_rls_policies.sql

# Apply migrations
cd frontend
supabase db push
EOF

echo ""
echo -e "${GREEN}📝 After running migrations, verify with:${NC}"
echo ""
echo "1. Check RLS policies are active:"
echo "   SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';"
echo ""
echo "2. Test user authentication and data access"
echo "3. Verify Edge Functions can access database"
echo ""

echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "• Always backup your database before running migrations"
echo "• Test in a staging environment first if possible"
echo "• Monitor for any errors in the Supabase logs"
echo ""

echo "Migration guide complete! Follow the steps above to apply migrations."