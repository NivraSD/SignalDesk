-- Add NY Times and Washington Post to source_registry
-- Both are Tier 1 premium sources with RSS discovery and authenticated scraping

INSERT INTO source_registry (source_name, source_url, source_type, industries, tier, monitor_method, monitor_config)
VALUES
  (
    'New York Times',
    'https://nytimes.com',
    'website',
    ARRAY['finance', 'technology', 'politics', 'healthcare', 'media'],
    1,
    'rss',
    '{"rss_url": "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"}'::jsonb
  ),
  (
    'Washington Post',
    'https://washingtonpost.com',
    'website',
    ARRAY['politics', 'technology', 'finance', 'healthcare'],
    1,
    'rss',
    '{"rss_url": "https://feeds.washingtonpost.com/rss/business"}'::jsonb
  )
ON CONFLICT (source_url) DO UPDATE
SET
  monitor_method = EXCLUDED.monitor_method,
  monitor_config = EXCLUDED.monitor_config,
  tier = EXCLUDED.tier,
  industries = EXCLUDED.industries;

-- Verify insertion
DO $$
BEGIN
  RAISE NOTICE 'Added NY Times and Washington Post to source_registry';
END $$;
