#!/bin/bash

# Deploy Organization Profiles Schema to Supabase
# This script creates the profile tables and related infrastructure

echo "🚀 Deploying Organization Profiles Schema to Supabase..."

# Supabase connection details
SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_DB_URL="postgresql://postgres.zskaxjtyuaqazydouifp:your_postgres_password_here@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Check if we have the SQL file
if [ ! -f "backend/src/db/create_organization_profiles.sql" ]; then
    echo "❌ Error: create_organization_profiles.sql not found"
    exit 1
fi

echo "📋 Creating organization profiles tables..."

# Execute using psql with the Supabase database URL
# Note: You'll need to replace 'your_postgres_password_here' with your actual password
PGPASSWORD=your_postgres_password_here psql \
    -h aws-0-us-west-1.pooler.supabase.com \
    -p 6543 \
    -U postgres.zskaxjtyuaqazydouifp \
    -d postgres \
    -f backend/src/db/create_organization_profiles.sql

if [ $? -eq 0 ]; then
    echo "✅ Organization Profiles schema deployed successfully!"
    echo ""
    echo "📊 Tables created:"
    echo "  - organization_profiles"
    echo "  - profile_events"
    echo "  - competitive_intelligence"
    echo "  - stakeholder_intelligence"
    echo "  - topic_intelligence"
    echo "  - predictive_scenarios"
    echo "  - profile_intelligence_cache"
    echo ""
    echo "🎯 Next steps:"
    echo "  1. Test the profile system with Toyota"
    echo "  2. Verify tab-specific intelligence generation"
    echo "  3. Check that profiles persist across sessions"
else
    echo "❌ Failed to deploy schema. Please check your database credentials."
    exit 1
fi