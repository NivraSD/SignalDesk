-- Create executive_synthesis table via Supabase Dashboard SQL Editor
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS executive_synthesis CASCADE;

-- Create the table
CREATE TABLE executive_synthesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  synthesis_data JSONB NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX idx_executive_synthesis_org ON executive_synthesis(organization_id);
CREATE INDEX idx_executive_synthesis_created ON executive_synthesis(created_at DESC);

-- Disable RLS for now (we can enable it later if needed)
ALTER TABLE executive_synthesis DISABLE ROW LEVEL SECURITY;

-- Verify the table was created
SELECT 'Table created successfully!' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'executive_synthesis';
