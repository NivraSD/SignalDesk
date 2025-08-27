-- Forget about migrating - just create what the Edge Functions need

-- Create a fresh table with the columns Edge Functions expect
CREATE TABLE IF NOT EXISTS intelligence_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT UNIQUE NOT NULL,
    organization_id TEXT,
    profile_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the other tables we need
CREATE TABLE IF NOT EXISTS intelligence_stage_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    stage_data JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intelligence_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT,
    competitors JSONB,
    stakeholders JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE intelligence_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_stage_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_targets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all" ON intelligence_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON intelligence_stage_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON intelligence_targets FOR ALL USING (true) WITH CHECK (true);

-- Done
SELECT 'Created intelligence_profiles, intelligence_stage_data, intelligence_targets' as status;