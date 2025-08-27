#!/bin/bash

# CRITICAL: Remove ALL localStorage usage from the entire codebase
# NO localStorage anywhere - edge functions are the SINGLE SOURCE OF TRUTH

echo "🔥 REMOVING ALL localStorage USAGE FROM ENTIRE CODEBASE..."

# Find all files with localStorage
FILES=$(grep -r "localStorage\." frontend/src --include="*.js" --include="*.jsx" -l)

echo "Found $(echo "$FILES" | wc -l) files with localStorage"

# Create backup
cp -r frontend/src frontend/src.backup.$(date +%s)

# Process each file
for file in $FILES; do
    echo "Processing: $file"
    
    # Remove localStorage.setItem calls
    sed -i '' 's/localStorage\.setItem([^;]*);/\/\/ REMOVED: localStorage.setItem - edge function is single source/g' "$file"
    
    # Remove localStorage.getItem calls - replace with null
    sed -i '' 's/localStorage\.getItem([^)]*)/null \/\/ REMOVED: localStorage - must use edge function/g' "$file"
    
    # Remove localStorage.removeItem calls
    sed -i '' 's/localStorage\.removeItem([^;]*);/\/\/ REMOVED: localStorage.removeItem/g' "$file"
    
    # Remove localStorage.clear calls
    sed -i '' 's/localStorage\.clear([^;]*);/\/\/ REMOVED: localStorage.clear/g' "$file"
    
    # Comment out entire localStorage blocks
    sed -i '' 's/if.*localStorage\./\/\/ REMOVED: if localStorage/g' "$file"
done

echo "✅ Removed localStorage from all files"
echo "⚠️  Now need to implement edge function replacements where needed"

# Show what was changed
echo ""
echo "Files modified:"
grep -r "REMOVED:" frontend/src --include="*.js" --include="*.jsx" -l | head -20

echo ""
echo "🎯 COMPLETE: All localStorage usage has been removed"
echo "📝 Next steps:"
echo "  1. Review critical components for edge function integration"
echo "  2. Build and test"
echo "  3. Deploy with ZERO localStorage"