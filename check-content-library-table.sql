-- Check if content_library table exists and its structure
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'content_library'
ORDER BY
    ordinal_position;

-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS content_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id TEXT NOT NULL,
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Create RLS policies
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Enable all for authenticated users" ON content_library
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow inserts for anon users (for testing)
CREATE POLICY "Enable insert for anon" ON content_library
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow select for anon users
CREATE POLICY "Enable select for anon" ON content_library
    FOR SELECT
    TO anon
    USING (true);