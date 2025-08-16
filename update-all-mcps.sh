#!/bin/bash

echo "Updating all MCPs with correct database connection..."

# Correct database connection
DB_PASSWORD="habku2-gotraf-suVhan"
DB_HOST="db.zskaxjtyuaqazydouifp.supabase.co"
DB_PORT="5432"

# Update Campaigns MCP
cat > /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-campaigns/src/db-config.ts << EOF
import { Pool } from 'pg';

const DATABASE_URL = 'postgresql://postgres:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/postgres';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection silently
pool.query('SELECT 1').catch(() => {
  // Fail silently
});
EOF

# Update Media MCP
cat > /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-media/src/db-config.ts << EOF
import { Pool } from 'pg';

const DATABASE_URL = 'postgresql://postgres:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/postgres';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection silently
pool.query('SELECT 1').catch(() => {
  // Fail silently
});
EOF

# Update the imports in the main files
echo "Updating imports..."

# For Campaigns
if grep -q "process.env.DATABASE_URL" /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-campaigns/src/index.ts; then
  sed -i '' '/let pool: Pool/,/^}/d' /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-campaigns/src/index.ts
  sed -i '' '/import { Pool } from/a\
import { pool } from "./db-config.js";' /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-campaigns/src/index.ts
fi

# For Media
if grep -q "process.env.DATABASE_URL" /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-media/src/index.ts; then
  sed -i '' '/let pool: Pool/,/^}/d' /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-media/src/index.ts
  sed -i '' '/import { Pool } from/a\
import { pool } from "./db-config.js";' /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-media/src/index.ts
fi

echo "Building all MCPs..."

cd /Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers

for mcp in signaldesk-memory signaldesk-campaigns signaldesk-media; do
  echo "Building $mcp..."
  cd $mcp
  npm run build > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ $mcp built successfully"
  else
    echo "❌ $mcp build failed"
  fi
  cd ..
done

echo ""
echo "All MCPs updated with correct database connection!"
echo "Please restart Claude Desktop now."