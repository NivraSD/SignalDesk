# Fix Content Library Table

## Issue
The `organization_id` column in `content_library` table is set as UUID type but we're passing string values like "Tesla" or organization names.

## Solution
Run this SQL in your Supabase SQL editor:

```sql
-- Fix the organization_id column to accept strings
ALTER TABLE content_library
ALTER COLUMN organization_id TYPE VARCHAR(255)
USING organization_id::VARCHAR(255);
```

## How to Apply
1. Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new
2. Paste the SQL above
3. Click "Run"

## Alternative: Recreate Table
If the above doesn't work, drop and recreate:

```sql
-- Drop existing table
DROP TABLE IF EXISTS content_library;

-- Create with correct schema
CREATE TABLE content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id VARCHAR(255),  -- Changed from UUID to VARCHAR
  content_type VARCHAR(100),
  title VARCHAR(500),
  content TEXT,
  metadata JSONB,
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'niv'
);

-- Enable RLS
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all operations" ON content_library
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON content_library TO anon, authenticated, service_role;
```

## Verification
After running the SQL, test saving content from the app.