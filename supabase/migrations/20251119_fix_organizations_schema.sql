-- Fix organizations table schema - add missing columns that UI expects
-- The OrganizationSettings component reads/writes url, industry, size
-- but these columns don't exist in the database

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS size TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON organizations(industry);
CREATE INDEX IF NOT EXISTS idx_organizations_url ON organizations(url);

COMMENT ON COLUMN organizations.url IS 'Company website URL';
COMMENT ON COLUMN organizations.industry IS 'Primary industry classification';
COMMENT ON COLUMN organizations.size IS 'Company size (employee count range)';
