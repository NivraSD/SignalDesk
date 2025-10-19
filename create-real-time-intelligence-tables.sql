-- Real-Time Intelligence System Tables

CREATE TABLE IF NOT EXISTS seen_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  url text NOT NULL,
  title text,
  seen_at timestamptz NOT NULL DEFAULT now(),
  source text,
  UNIQUE(organization_id, url, source)
);

CREATE INDEX IF NOT EXISTS idx_seen_articles_org_date ON seen_articles(organization_id, seen_at DESC);

CREATE TABLE IF NOT EXISTS real_time_intelligence_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  time_window text,
  articles_analyzed int,
  events_detected int,
  alerts_generated int,
  synthesis jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rt_briefs_org_date ON real_time_intelligence_briefs(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS crises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id text NOT NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL,
  impact text,
  source_events jsonb,
  response_timeframe text,
  response_strategy jsonb,
  status text DEFAULT 'detected',
  detected_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  metrics jsonb,
  stakeholders_affected text[],
  media_coverage_urls text[]
);

CREATE INDEX IF NOT EXISTS idx_crises_org_severity ON crises(organization_id, severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_crises_status ON crises(status, detected_at DESC);
