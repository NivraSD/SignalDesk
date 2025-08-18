#!/bin/bash

# Setup Niv Realtime Tables in Supabase
echo "🚀 Setting up Niv Realtime Tables in Supabase..."

# Use the supabase CLI to execute the SQL
if command -v supabase &> /dev/null; then
    echo "📝 Running database migrations..."
    cd frontend
    
    # Run the migration
    supabase db push --db-url "postgresql://postgres.zskaxjtyuaqazydouifp:MUmjKBxTiecMPpYVgwGsZEKyFfyFbxqV@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    
    echo "✅ Database tables created successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to Supabase Dashboard > Database > Replication"
    echo "2. Enable replication for: niv_conversations, niv_artifacts, niv_workspace_edits"
    echo "3. Test the application at http://localhost:3000/niv-realtime"
else
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "brew install supabase/tap/supabase"
fi