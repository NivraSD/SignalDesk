-- Update source_registry monitor_method based on RSS availability
-- Sources that failed RSS discovery should use Google CSE instead

-- ============================================================================
-- Update sources to use google_cse where RSS failed
-- ============================================================================

-- Bloomberg, Reuters, WSJ, etc. - Major news sources without public RSS
UPDATE source_registry
SET monitor_method = 'google_cse'
WHERE source_name IN (
  'Bloomberg',
  'Reuters',
  'Wall Street Journal',
  'Financial Times',
  'Forbes',
  'CNBC',
  'Barrons',
  'The Economist',
  'Business Insider',
  'Harvard Business Review',
  'The Verge',
  'PR Newswire',
  'Business Wire',
  'GlobeNewswire',
  'Endpoints News',
  'Banking Dive',
  'Payments Dive',
  'Finextra',
  'AdAge',
  'The Drum',
  'Marketing Dive',
  'Healthcare Dive',
  'Modern Healthcare',
  'BioPharma Dive',
  'The Financial Brand',
  'CoinDesk',
  'Retail Dive',
  'Grocery Dive',
  'Chain Store Age',
  'Protocol',
  'The Information',
  'Puck News',
  'Supply Chain Dive',
  'FreightWaves',
  'Industry Week',
  'Manufacturing.net',
  'Automation World',
  'Construction Dive',
  'The Real Deal',
  'GreenTech Media',
  'Utility Dive',
  'Recharge News',
  'Law.com',
  'Law360'
);

-- ============================================================================
-- Firecrawl Observer sources (already correctly set)
-- ============================================================================
-- These sources use Firecrawl Extract for discovery (industry-specific pubs)
-- Keep as 'firecrawl_observer':
-- - PRWeek, PRovoke Media, PR Daily, Ragan, O'Dwyer's
-- - McKinsey, BCG, Deloitte Insights, PwC, Gartner, Forrester

-- ============================================================================
-- Summary report
-- ============================================================================

DO $$
DECLARE
  rss_count INTEGER;
  cse_count INTEGER;
  firecrawl_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rss_count FROM source_registry WHERE monitor_method = 'rss';
  SELECT COUNT(*) INTO cse_count FROM source_registry WHERE monitor_method = 'google_cse';
  SELECT COUNT(*) INTO firecrawl_count FROM source_registry WHERE monitor_method = 'firecrawl_observer';
  SELECT COUNT(*) INTO total_count FROM source_registry;

  RAISE NOTICE '✅ Source registry monitor methods updated!';
  RAISE NOTICE '   Total sources: %', total_count;
  RAISE NOTICE '   RSS sources: %', rss_count;
  RAISE NOTICE '   Google CSE sources: %', cse_count;
  RAISE NOTICE '   Firecrawl Observer sources: %', firecrawl_count;
END $$;
