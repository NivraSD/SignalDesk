-- Create table for tracking SignalDeck presentation generation status
-- This replaces the in-memory Map that doesn't persist across edge function instances

CREATE TABLE IF NOT EXISTS presentation_generations (
  id UUID PRIMARY KEY,
  organization_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  file_url TEXT,
  download_url TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_generations_id ON presentation_generations(id);
CREATE INDEX IF NOT EXISTS idx_generations_org ON presentation_generations(organization_id);
CREATE INDEX IF NOT EXISTS idx_generations_status ON presentation_generations(status);
CREATE INDEX IF NOT EXISTS idx_generations_created ON presentation_generations(created_at DESC);

-- RLS Policies
ALTER TABLE presentation_generations ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to presentation_generations"
  ON presentation_generations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to read their organization's generations
CREATE POLICY "Users can read their organization's presentation generations"
  ON presentation_generations
  FOR SELECT
  TO authenticated, anon
  USING (true);  -- We'll filter by organization_id in the application

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION update_presentation_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER presentation_generations_updated_at
  BEFORE UPDATE ON presentation_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_presentation_generations_updated_at();

-- Comments
COMMENT ON TABLE presentation_generations IS 'Tracks PowerPoint presentation generation status for SignalDeck';
COMMENT ON COLUMN presentation_generations.id IS 'Unique generation ID (UUID)';
COMMENT ON COLUMN presentation_generations.organization_id IS 'Organization that requested the presentation';
COMMENT ON COLUMN presentation_generations.status IS 'Current status: pending, processing, completed, or error';
COMMENT ON COLUMN presentation_generations.progress IS 'Generation progress percentage (0-100)';
COMMENT ON COLUMN presentation_generations.file_url IS 'URL to the generated PowerPoint file in storage';
COMMENT ON COLUMN presentation_generations.download_url IS 'Public download URL for the presentation';
COMMENT ON COLUMN presentation_generations.error IS 'Error message if generation failed';
COMMENT ON COLUMN presentation_generations.metadata IS 'Additional metadata (outline, slide count, etc.)';
