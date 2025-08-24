#!/bin/bash

echo "🔄 Supabase Credentials Update Script"
echo "======================================"
echo ""
echo "This script will update all your Supabase credentials"
echo ""

# Get new credentials from user
echo "Please go to https://app.supabase.com/projects"
echo "Find your project (or create new one) and go to Settings > API"
echo ""
read -p "Enter your Supabase Project URL (e.g., https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY

# Validate inputs
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Both URL and API key are required!"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $SUPABASE_URL | grep -oP '(?<=https://).*?(?=\.supabase\.co)')

echo ""
echo "📝 Updating configuration files..."

# Update .env
cat > .env << EOF
REACT_APP_SUPABASE_URL=$SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
REACT_APP_API_URL=
REACT_APP_ENABLE_CLAUDE=true
REACT_APP_ENABLE_MONITORING=true
EOF

# Update .env.production
cat > .env.production << EOF
REACT_APP_SUPABASE_URL=$SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
REACT_APP_API_URL=
REACT_APP_ENABLE_CLAUDE=true
REACT_APP_ENABLE_MONITORING=true
EOF

# Update .env.local
cat > .env.local << EOF
REACT_APP_SUPABASE_URL=$SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOF

echo "✅ Environment files updated"

# Update test files
echo "📝 Updating test files..."

# Update the test HTML file
sed -i.bak "s|const SUPABASE_URL = '.*'|const SUPABASE_URL = '$SUPABASE_URL'|g" test-edge-functions.html
sed -i.bak "s|const SUPABASE_ANON_KEY = '.*'|const SUPABASE_ANON_KEY = '$SUPABASE_ANON_KEY'|g" test-edge-functions.html

# Update the diagnostic script
sed -i.bak "s|const SUPABASE_URL = '.*'|const SUPABASE_URL = '$SUPABASE_URL';|g" diagnose-supabase.js
sed -i.bak "s|const ANON_KEY = '.*'|const ANON_KEY = '$SUPABASE_ANON_KEY';|g" diagnose-supabase.js

# Clean up backup files
rm -f *.bak

echo "✅ Test files updated"

echo ""
echo "🚀 Next Steps:"
echo "=============="
echo ""
echo "1. Link to your Supabase project:"
echo "   supabase link --project-ref $PROJECT_REF"
echo ""
echo "2. Deploy Edge Functions:"
echo "   supabase functions deploy claude-chat"
echo "   supabase functions deploy monitor-intelligence"
echo ""
echo "3. Set Anthropic API key:"
echo "   supabase secrets set ANTHROPIC_API_KEY=your-anthropic-key"
echo ""
echo "4. Run database setup (in Supabase SQL Editor):"
echo "   Copy contents of setup-supabase-complete.sql"
echo ""
echo "5. Test the connection:"
echo "   node diagnose-supabase.js"
echo ""
echo "6. Rebuild and deploy to Vercel:"
echo "   npm run build"
echo "   vercel --prod"
echo ""
echo "✅ Credentials have been updated in all files!"
echo ""
echo "Project Reference: $PROJECT_REF"
echo "URL: $SUPABASE_URL"