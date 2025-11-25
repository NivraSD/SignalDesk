-- Fix PR sources monitor_method from 'firecrawl_observer' to 'firecrawl'
-- This will allow batch-scraper-v5-orchestrator-fireplexity to discover them

UPDATE source_registry
SET monitor_method = 'firecrawl'
WHERE monitor_method = 'firecrawl_observer'
  AND source_name IN ('PRWeek', 'PRovoke Media', 'PR Daily', 'Ragan', 'O''Dwyer''s');

-- Also ensure RSS-based PR sources are properly configured
UPDATE source_registry
SET monitor_method = 'rss'
WHERE source_name IN ('AdAge', 'AdWeek', 'The Drum', 'Marketing Dive')
  AND monitor_method != 'rss';
