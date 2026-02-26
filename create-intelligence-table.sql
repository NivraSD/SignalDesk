-- Create intelligence table to store synthesis results
CREATE TABLE IF NOT EXISTS public.intelligence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id INTEGER REFERENCES public.organizations(id),
    organization_name TEXT,
    synthesis JSONB,
    opportunities JSONB,
    raw_intelligence JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intelligence_org_id ON public.intelligence(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_created_at ON public.intelligence(created_at DESC);

-- Enable RLS
ALTER TABLE public.intelligence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can do everything" ON public.intelligence
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.intelligence TO service_role;
GRANT SELECT ON public.intelligence TO anon, authenticated;

-- Add comment
COMMENT ON TABLE public.intelligence IS 'Stores synthesized intelligence and opportunities from the pipeline';
