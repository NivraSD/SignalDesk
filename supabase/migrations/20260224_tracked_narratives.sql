-- Tracked Narratives: Stories that develop over time across multiple synthesis cycles
-- Used to provide continuity in executive briefs and surface developing trends

CREATE TABLE IF NOT EXISTS tracked_narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Core narrative info
  title TEXT NOT NULL,
  summary TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'emerging' CHECK (status IN ('emerging', 'developing', 'stable', 'declining', 'resolved')),
  trajectory TEXT DEFAULT 'growing' CHECK (trajectory IN ('growing', 'stable', 'declining')),

  -- Timeline
  first_detected_at TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,

  -- Metrics
  mention_count INT DEFAULT 1,
  synthesis_count INT DEFAULT 1, -- how many synthesis cycles mentioned this

  -- Related entities and developments
  related_entities JSONB DEFAULT '{"competitors": [], "stakeholders": [], "topics": []}',
  key_developments JSONB DEFAULT '[]', -- array of {date, development, source_url}

  -- Links to source data
  synthesis_ids UUID[] DEFAULT '{}', -- executive_synthesis records that mentioned this
  article_ids UUID[] DEFAULT '{}', -- raw_articles that contributed to this narrative

  -- Semantic search
  embedding VECTOR(1024),
  embedding_model TEXT DEFAULT 'voyage-3-large',
  embedding_updated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tracked_narratives_org_status
  ON tracked_narratives(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_tracked_narratives_org_updated
  ON tracked_narratives(organization_id, last_updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tracked_narratives_active
  ON tracked_narratives(organization_id)
  WHERE status NOT IN ('resolved');

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_tracked_narratives_embedding
  ON tracked_narratives
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tracked_narratives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tracked_narratives_updated_at
  BEFORE UPDATE ON tracked_narratives
  FOR EACH ROW
  EXECUTE FUNCTION update_tracked_narratives_updated_at();

-- RLS policies
ALTER TABLE tracked_narratives ENABLE ROW LEVEL SECURITY;

-- Users can view narratives for their organization
CREATE POLICY "Users can view own org narratives"
  ON tracked_narratives FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
  ON tracked_narratives FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE tracked_narratives IS 'Tracks developing stories/narratives over time for continuity in executive synthesis';
COMMENT ON COLUMN tracked_narratives.status IS 'emerging = just detected, developing = growing coverage, stable = ongoing but steady, declining = fading, resolved = concluded';
COMMENT ON COLUMN tracked_narratives.trajectory IS 'Direction the narrative is moving: growing (more coverage), stable, declining (less coverage)';
