#!/bin/bash

# Fix hardcoded Supabase keys in all files
echo "🔐 Removing hardcoded API keys from source code..."

# Find all files with hardcoded keys
FILES=$(grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/ --include="*.js" --include="*.jsx" -l)

COUNT=$(echo "$FILES" | wc -l)
echo "Found $COUNT files with hardcoded keys"

# Create backup
echo "Creating backup..."
cp -r src/ src-backup-$(date +%Y%m%d-%H%M%S)/

# Fix each file
for file in $FILES; do
  echo "Fixing: $file"
  
  # Replace hardcoded URL and key patterns
  sed -i '' "s|process\.env\.REACT_APP_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp\.supabase\.co'|process.env.REACT_APP_SUPABASE_URL|g" "$file"
  sed -i '' "s|process\.env\.REACT_APP_SUPABASE_ANON_KEY || 'eyJ[^']*'|process.env.REACT_APP_SUPABASE_ANON_KEY|g" "$file"
  
  # For lines that have just the hardcoded value
  sed -i '' "s|'https://zskaxjtyuaqazydouifp\.supabase\.co'|process.env.REACT_APP_SUPABASE_URL|g" "$file"
  sed -i '' "s|'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^']*'|process.env.REACT_APP_SUPABASE_ANON_KEY|g" "$file"
done

echo "✅ Fixed $COUNT files"
echo "⚠️  Make sure to set these environment variables:"
echo "  REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co"
echo "  REACT_APP_SUPABASE_ANON_KEY=<your-key-here>"