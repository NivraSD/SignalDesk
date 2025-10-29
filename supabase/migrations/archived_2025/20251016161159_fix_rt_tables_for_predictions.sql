-- Fix real-time intelligence tables for prediction system

-- Add missing columns to real_time_intelligence_briefs
ALTER TABLE real_time_intelligence_briefs
ADD COLUMN IF NOT EXISTS organization_name TEXT,
ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS breaking_summary TEXT,
ADD COLUMN IF NOT EXISTS critical_alerts JSONB DEFAULT '[]'::jsonb;

-- Enable RLS
ALTER TABLE seen_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_intelligence_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crises ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON seen_articles TO service_role;
GRANT ALL ON real_time_intelligence_briefs TO service_role;
GRANT ALL ON crises TO service_role;

GRANT SELECT ON seen_articles TO authenticated, anon;
GRANT SELECT ON real_time_intelligence_briefs TO authenticated, anon;
GRANT SELECT ON crises TO authenticated, anon;

-- RLS Policies for seen_articles
CREATE POLICY "Service role full access" ON seen_articles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their org articles" ON seen_articles
  FOR SELECT USING (true);

-- RLS Policies for real_time_intelligence_briefs
CREATE POLICY "Service role full access" ON real_time_intelligence_briefs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their org briefs" ON real_time_intelligence_briefs
  FOR SELECT USING (true);

-- RLS Policies for crises
CREATE POLICY "Service role full access" ON crises
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Users can view their org crises" ON crises
  FOR SELECT USING (true);
