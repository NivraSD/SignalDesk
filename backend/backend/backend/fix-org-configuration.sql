-- Add an organization name field to intelligence_targets table if it doesn't exist
-- This will allow storing the actual organization name alongside competitors and topics

-- First, check current configuration
SELECT DISTINCT organization_id, 
       (SELECT name FROM intelligence_targets WHERE organization_id = it.organization_id AND type = 'organization' LIMIT 1) as org_name
FROM intelligence_targets it
ORDER BY organization_id DESC
LIMIT 10;

-- Example: Insert organization records for existing configs
-- For the restaurant configuration (McDonald's, Chipotle competitors)
INSERT INTO intelligence_targets (organization_id, name, type, keywords, priority, active)
VALUES ('org-1754511333394', 'Taco Bell', 'organization', ARRAY['taco bell', 'yum brands'], 'high', true)
ON CONFLICT DO NOTHING;

-- For older configs that might be Nike (check if they have Adidas/Puma as competitors)
UPDATE intelligence_targets 
SET active = false 
WHERE organization_id IN (
  SELECT DISTINCT organization_id 
  FROM intelligence_targets 
  WHERE name IN ('Adidas', 'Puma') AND type = 'competitor'
);

-- Add a generic test organization for testing
INSERT INTO intelligence_targets (organization_id, name, type, keywords, priority, active)
VALUES ('org-test', 'Test Corporation', 'organization', ARRAY['test corp', 'testing'], 'high', true)
ON CONFLICT DO NOTHING;

INSERT INTO intelligence_targets (organization_id, name, type, keywords, priority, active)
VALUES 
  ('org-test', 'Example Competitor 1', 'competitor', ARRAY['example1'], 'high', true),
  ('org-test', 'Example Competitor 2', 'competitor', ARRAY['example2'], 'medium', true),
  ('org-test', 'Industry Trends', 'topic', ARRAY['trends', 'innovation'], 'high', true)
ON CONFLICT DO NOTHING;