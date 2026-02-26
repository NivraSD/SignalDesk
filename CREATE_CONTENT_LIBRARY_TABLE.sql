-- Run this in Supabase SQL Editor to create the content_library table

-- Create the table
CREATE TABLE IF NOT EXISTS content_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT,
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Enable RLS
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all operations for now" ON content_library;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON content_library;
DROP POLICY IF EXISTS "Enable insert for anon" ON content_library;
DROP POLICY IF EXISTS "Enable select for anon" ON content_library;

-- Create a permissive policy for now (we can tighten this later)
CREATE POLICY "Allow all operations for now" ON content_library
    FOR ALL USING (true) WITH CHECK (true);

-- Test the table works
INSERT INTO content_library (organization_id, type, content, status, created_by)
VALUES ('test', 'image', '{"url": "test", "prompt": "test"}', 'completed', 'test');

-- Check it worked
SELECT * FROM content_library WHERE created_by = 'test';

-- Clean up test data
DELETE FROM content_library WHERE created_by = 'test';