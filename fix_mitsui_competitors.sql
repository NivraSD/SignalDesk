-- Fix: Populate Mitsui & Co. competitors in intelligence_targets table
-- Based on mcp-discovery/index.ts line 943 example for Trading companies

-- First, let's populate the company_profile with basic competition structure
UPDATE organizations
SET company_profile = jsonb_set(
  COALESCE(company_profile, '{}'::jsonb),
  '{competition}',
  '{
    "direct_competitors": [
      "Mitsubishi Corporation",
      "Sumitomo Corporation",
      "Itochu",
      "Marubeni",
      "Toyota Tsusho",
      "Sojitz",
      "Glencore",
      "Trafigura",
      "Vitol",
      "Noble Group",
      "Cargill",
      "Louis Dreyfus"
    ],
    "indirect_competitors": [
      "BHP",
      "Rio Tinto",
      "Vale"
    ],
    "competitive_dynamics": "Japanese general trading companies (sogo shosha) compete on scale, diversification, and relationships. Mitsui competes with peer sogo shosha for commodity trading, infrastructure projects, and strategic investments globally."
  }'::jsonb
)
WHERE id = '4f9504ea-9ba3-4696-9e75-8f226f23f4ad';

-- Second, populate intelligence_targets table (used by synthesis as primary source)
-- Delete existing targets first to avoid duplicates
DELETE FROM intelligence_targets WHERE organization_id = '4f9504ea-9ba3-4696-9e75-8f226f23f4ad';

-- Insert direct competitors
INSERT INTO intelligence_targets (organization_id, type, name, priority, active, created_at)
VALUES
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Mitsubishi Corporation', 'high', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Sumitomo Corporation', 'high', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Itochu', 'high', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Marubeni', 'high', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Toyota Tsusho', 'high', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Sojitz', 'medium', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Glencore', 'high', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Trafigura', 'medium', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Vitol', 'medium', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Noble Group', 'medium', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Cargill', 'medium', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'competitor', 'Louis Dreyfus', 'medium', true, NOW());

-- Insert some key stakeholders (regulators, analysts)
INSERT INTO intelligence_targets (organization_id, type, name, priority, active, created_at)
VALUES
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'stakeholder', 'Ministry of Economy Trade and Industry', 'high', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'stakeholder', 'Fair Trade Commission of Japan', 'medium', true, NOW()),
  ('4f9504ea-9ba3-4696-9e75-8f226f23f4ad', 'stakeholder', 'Bank of Japan', 'medium', true, NOW());

-- Verify the update
SELECT
  'Competitors in company_profile' as check_type,
  jsonb_array_length(company_profile->'competition'->'direct_competitors') as count
FROM organizations
WHERE id = '4f9504ea-9ba3-4696-9e75-8f226f23f4ad'
UNION ALL
SELECT
  'Competitors in intelligence_targets',
  COUNT(*)::int
FROM intelligence_targets
WHERE organization_id = '4f9504ea-9ba3-4696-9e75-8f226f23f4ad' AND type = 'competitor';
