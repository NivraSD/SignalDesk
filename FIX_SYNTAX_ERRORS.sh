#!/bin/bash

echo "🔧 Fixing syntax errors from localStorage removal..."

# Fix OrganizationSettings.js
cat > /tmp/org_fix.js << 'EOF'
  const switchOrganization = (org) => {
    // Edge function is the single source - no localStorage
    setCurrentOrg(org);
    
    // Notify parent component
    if (onOrganizationChange) {
      onOrganizationChange(org);
    }
    
    // Close modal after a brief delay
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 500);
  };
EOF

# Apply the fix
sed -i '' '/const switchOrganization/,/^  };$/c\
  const switchOrganization = (org) => {\
    // Edge function is the single source - no localStorage\
    setCurrentOrg(org);\
    \
    // Notify parent component\
    if (onOrganizationChange) {\
      onOrganizationChange(org);\
    }\
    \
    // Close modal after a brief delay\
    setTimeout(() => {\
      if (onClose) {\
        onClose();\
      }\
    }, 500);\
  };' frontend/src/components/OrganizationSettings.js

# Fix other files with dangling JSON.stringify by removing the orphaned lines
FILES_TO_FIX=(
  "frontend/src/utils/migrateProfile.js"
  "frontend/src/components/IntelligenceDisplayV3.js"
  "frontend/src/components/DiagnosticPanel.js"
)

for file in "${FILES_TO_FIX[@]}"; do
  # Remove lines with just closing brackets/parens that are orphaned
  sed -i '' '/^[[:space:]]*});*$/d' "$file"
  sed -i '' '/^[[:space:]]*}));*$/d' "$file"
  # Remove standalone JSON property lines
  sed -i '' '/^[[:space:]]*[a-zA-Z_]*:[[:space:]]*[a-zA-Z_]*[,]*$/d' "$file"
done

# Fix intelligenceOrchestratorV4.js - remove the null || null || null line
sed -i '' 's/null \/\/ REMOVED.*||/null;\/\//g' frontend/src/services/intelligenceOrchestratorV4.js

echo "✅ Syntax fixes applied"