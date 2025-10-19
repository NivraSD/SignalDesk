#!/bin/bash

echo "🔧 Fixing Claude API timeouts in all stage functions"
echo "===================================================="

# Fix all stage claude-analyst.ts files
for stage in 1-competitors 2-media 3-regulatory 4-trends; do
  FILE="supabase/functions/intelligence-stage-${stage}/claude-analyst.ts"
  
  if [ -f "$FILE" ]; then
    echo "Fixing $FILE..."
    
    # Check if timeout is already added
    if grep -q "AbortController" "$FILE"; then
      echo "  ✅ Already has timeout"
    else
      # Add timeout before the fetch call
      sed -i '' '/const response = await fetch.*anthropic/i\
    // Add timeout to prevent hanging\
    const controller = new AbortController();\
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout\
    ' "$FILE"
      
      # Add signal to fetch options and clear timeout
      sed -i '' '/body: JSON.stringify({/a\
      }),\
      signal: controller.signal\
    });\
    \
    clearTimeout(timeoutId);\
    \
    // Original close was here, removing duplicate' "$FILE"
      
      # Remove the duplicate closing
      sed -i '' '/^    });$/d' "$FILE" | head -1
      
      echo "  ✅ Added timeout"
    fi
  fi
done

echo ""
echo "✅ All Claude analyst files updated with timeouts"