-- Create claude_analyses table for storing Claude's analysis from each stage
CREATE TABLE IF NOT EXISTS claude_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  request_id TEXT,
  claude_analysis JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(organization_name, stage_name, request_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_claude_analyses_org_name ON claude_analyses(organization_name);
CREATE INDEX IF NOT EXISTS idx_claude_analyses_stage_name ON claude_analyses(stage_name);
CREATE INDEX IF NOT EXISTS idx_claude_analyses_request_id ON claude_analyses(request_id);
CREATE INDEX IF NOT EXISTS idx_claude_analyses_created_at ON claude_analyses(created_at DESC);

-- Add RLS policies
ALTER TABLE claude_analyses ENABLE ROW LEVEL SECURITY;

-- Policy to allow edge functions to read/write
CREATE POLICY "Enable all access for service role" ON claude_analyses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_claude_analyses_updated_at
  BEFORE UPDATE ON claude_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();