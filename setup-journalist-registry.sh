#!/bin/bash

# Create journalist_registry table using Supabase SQL editor or direct DB connection
MIGRATION_FILE="supabase/migrations/$(ls -t supabase/migrations/*journalist_registry.sql | head -1)"

echo "Creating journalist_registry table..."
echo "Migration file: $MIGRATION_FILE"

# Execute via npx supabase
cat "$MIGRATION_FILE" | npx supabase db execute --stdin

echo "✅ Done!"
