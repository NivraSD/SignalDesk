-- Create a simple table to store intelligence results if it doesn't exist
CREATE TABLE IF NOT EXISTS public.intelligence_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id TEXT,
    organization_name TEXT,
    synthesis JSONB,
    opportunities JSONB,
    enriched_data JSONB,
    statistics JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_intelligence_results_org ON public.intelligence_results(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_results_created ON public.intelligence_results(created_at DESC);

-- Enable RLS
ALTER TABLE public.intelligence_results ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all for service role" ON public.intelligence_results
    FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.intelligence_results TO service_role;
GRANT SELECT ON public.intelligence_results TO anon, authenticated;
