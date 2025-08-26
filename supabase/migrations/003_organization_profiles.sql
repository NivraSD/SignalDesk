-- Create organization_profiles table for storing discovered organization data
-- This is a simple key-value storage for organization profiles

CREATE TABLE IF NOT EXISTS organization_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name VARCHAR(255) UNIQUE NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_profiles_name ON organization_profiles(organization_name);

-- Create stage_data table for storing intermediate pipeline results
CREATE TABLE IF NOT EXISTS stage_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name VARCHAR(255) NOT NULL,
  stage VARCHAR(100) NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_name, stage)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stage_data_org ON stage_data(organization_name);
CREATE INDEX IF NOT EXISTS idx_stage_data_stage ON stage_data(stage);

-- Enable RLS
ALTER TABLE organization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_data ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON organization_profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users" ON stage_data
  FOR ALL USING (true) WITH CHECK (true);

-- Create policies for anon users (for Edge Functions)
CREATE POLICY "Enable read for anon" ON organization_profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable write for anon" ON organization_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anon" ON organization_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Enable read for anon" ON stage_data
  FOR SELECT USING (true);

CREATE POLICY "Enable write for anon" ON stage_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for anon" ON stage_data
  FOR UPDATE USING (true);