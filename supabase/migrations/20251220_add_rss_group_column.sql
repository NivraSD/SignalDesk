-- Add rss_group column for distributing RSS sources across multiple orchestrator runs
-- This prevents timeout issues by splitting 169 sources into 3 groups of ~56 each

ALTER TABLE source_registry ADD COLUMN IF NOT EXISTS rss_group INTEGER DEFAULT 1;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_source_registry_rss_group
ON source_registry(rss_group)
WHERE monitor_method = 'rss' AND active = true;

-- Distribute existing RSS sources evenly across 3 groups
-- Using row_number to ensure even distribution
WITH numbered_sources AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY tier ASC, source_name ASC) as rn
  FROM source_registry
  WHERE monitor_method = 'rss' AND active = true
)
UPDATE source_registry s
SET rss_group = ((ns.rn - 1) % 3) + 1
FROM numbered_sources ns
WHERE s.id = ns.id;

-- Verify distribution
DO $$
DECLARE
  g1_count INTEGER;
  g2_count INTEGER;
  g3_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO g1_count FROM source_registry WHERE monitor_method = 'rss' AND active = true AND rss_group = 1;
  SELECT COUNT(*) INTO g2_count FROM source_registry WHERE monitor_method = 'rss' AND active = true AND rss_group = 2;
  SELECT COUNT(*) INTO g3_count FROM source_registry WHERE monitor_method = 'rss' AND active = true AND rss_group = 3;

  RAISE NOTICE 'RSS Group Distribution: Group 1: %, Group 2: %, Group 3: %', g1_count, g2_count, g3_count;
END $$;
