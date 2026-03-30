-- Create table for storing Claude's rich analyses from each stage
-- This ensures the actual Claude insights are preserved and passed to synthesis

CREATE TABLE IF NOT EXISTS claude_analyses (
  id SERIAL PRIMARY KEY,
  organization_name VARCHAR(255) NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  request_id VARCHAR(255) NOT NULL, -- Links analyses from same pipeline run
  claude_analysis JSONB NOT NULL, -- The full Claude analysis output
  metadata JSONB, -- Metadata about the analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one analysis per stage per request
  UNIQUE(organization_name, stage_name, request_id)
);

-- Index for fast retrieval by organization and request
CREATE INDEX IF NOT EXISTS idx_claude_analyses_org_request 
  ON claude_analyses(organization_name, request_id);

-- Index for cleanup of old analyses
CREATE INDEX IF NOT EXISTS idx_claude_analyses_created 
  ON claude_analyses(created_at);

-- Add RLS policies
ALTER TABLE claude_analyses ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read/write their org's analyses
CREATE POLICY "Users can manage their organization's Claude analyses" 
  ON claude_analyses
  FOR ALL 
  USING (true) -- In production, add proper auth checks
  WITH CHECK (true);

COMMENT ON TABLE claude_analyses IS 'Stores Claude AI analyses from each intelligence stage for use in final synthesis';
COMMENT ON COLUMN claude_analyses.request_id IS 'UUID linking all analyses from the same pipeline run';
COMMENT ON COLUMN claude_analyses.claude_analysis IS 'Complete Claude analysis including insights, opportunities, and rich narratives';
COMMENT ON COLUMN claude_analyses.metadata IS 'Analysis metadata: model used, duration, quality indicators';