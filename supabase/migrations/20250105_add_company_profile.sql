-- Add company_profile JSONB column to organizations table
-- This stores essential company facts used across opportunities, content, and campaigns

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS company_profile JSONB DEFAULT '{}'::jsonb;

-- Add helpful comment
COMMENT ON COLUMN organizations.company_profile IS 'Company profile data including leadership team, headquarters, size, and key facts';

-- Example structure (for documentation):
-- {
--   "leadership": [
--     {"name": "John Smith", "title": "CEO", "linkedin": "https://linkedin.com/in/...", "email": "john@company.com"},
--     {"name": "Jane Doe", "title": "CMO", "linkedin": "...", "email": "jane@company.com"}
--   ],
--   "headquarters": {
--     "address": "123 Main St",
--     "city": "San Francisco",
--     "state": "CA",
--     "country": "United States",
--     "zip": "94102"
--   },
--   "company_size": {
--     "employees": "100-500",
--     "revenue_tier": "$10M-$50M"
--   },
--   "founded": "2020",
--   "parent_company": "Acme Corp",
--   "product_lines": ["Product A", "Product B"],
--   "key_markets": ["North America", "Europe"],
--   "business_model": "B2B SaaS"
-- }

-- Create index for JSONB queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_organizations_company_profile
ON organizations USING gin (company_profile);
