-- Create real_time_intelligence table for prediction system
CREATE TABLE IF NOT EXISTS public.real_time_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Intelligence data
  events JSONB DEFAULT '[]'::jsonb,
  entities JSONB DEFAULT '[]'::jsonb,
  key_findings JSONB DEFAULT '[]'::jsonb,
  source_data JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  intelligence_type TEXT DEFAULT 'real_time',
  processing_stage TEXT DEFAULT 'raw',
  quality_score NUMERIC(3,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_real_time_intelligence_org
  ON public.real_time_intelligence(organization_id);
CREATE INDEX IF NOT EXISTS idx_real_time_intelligence_created
  ON public.real_time_intelligence(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_real_time_intelligence_type
  ON public.real_time_intelligence(intelligence_type);

-- Enable RLS
ALTER TABLE public.real_time_intelligence ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view intelligence for their organization"
  ON public.real_time_intelligence
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access"
  ON public.real_time_intelligence
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.real_time_intelligence TO service_role;
GRANT SELECT ON public.real_time_intelligence TO authenticated;
GRANT SELECT ON public.real_time_intelligence TO anon;

COMMENT ON TABLE public.real_time_intelligence IS 'Stores real-time intelligence data for stakeholder prediction system';
