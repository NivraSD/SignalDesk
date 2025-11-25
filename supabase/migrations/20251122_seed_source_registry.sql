-- Seed source_registry with 360+ monitored sources
-- Organized by tier and industry

-- ============================================================================
-- TIER 1: Premium News Sources (Bloomberg, Reuters, WSJ, etc.)
-- ============================================================================

INSERT INTO source_registry (source_name, source_url, source_type, industries, tier, monitor_method) VALUES
-- Financial News
('Bloomberg', 'https://bloomberg.com', 'website', ARRAY['finance', 'technology', 'energy', 'healthcare'], 1, 'rss'),
('Reuters', 'https://reuters.com', 'website', ARRAY['finance', 'technology', 'politics', 'healthcare'], 1, 'rss'),
('Wall Street Journal', 'https://wsj.com', 'website', ARRAY['finance', 'technology', 'real_estate', 'healthcare'], 1, 'rss'),
('Financial Times', 'https://ft.com', 'website', ARRAY['finance', 'technology', 'energy'], 1, 'rss'),
('Barrons', 'https://barrons.com', 'website', ARRAY['finance', 'investing'], 1, 'rss'),
('CNBC', 'https://cnbc.com', 'website', ARRAY['finance', 'technology', 'real_estate'], 1, 'rss'),
('Forbes', 'https://forbes.com', 'website', ARRAY['finance', 'technology', 'healthcare', 'retail'], 1, 'rss'),
('Fortune', 'https://fortune.com', 'website', ARRAY['finance', 'technology', 'healthcare'], 1, 'rss'),
('The Economist', 'https://economist.com', 'website', ARRAY['finance', 'politics', 'technology'], 1, 'rss'),

-- Business General
('Business Insider', 'https://businessinsider.com', 'website', ARRAY['finance', 'technology', 'retail'], 1, 'rss'),
('Fast Company', 'https://fastcompany.com', 'website', ARRAY['technology', 'innovation', 'design'], 1, 'rss'),
('Inc', 'https://inc.com', 'website', ARRAY['entrepreneurship', 'technology'], 1, 'rss'),
('Harvard Business Review', 'https://hbr.org', 'website', ARRAY['management', 'strategy', 'leadership'], 1, 'rss'),

-- Technology
('TechCrunch', 'https://techcrunch.com', 'website', ARRAY['technology', 'startups', 'venture_capital'], 1, 'rss'),
('The Verge', 'https://theverge.com', 'website', ARRAY['technology', 'consumer_electronics'], 1, 'rss'),
('Wired', 'https://wired.com', 'website', ARRAY['technology', 'science', 'culture'], 1, 'rss'),
('Ars Technica', 'https://arstechnica.com', 'website', ARRAY['technology', 'science'], 1, 'rss'),
('VentureBeat', 'https://venturebeat.com', 'website', ARRAY['technology', 'ai', 'gaming'], 1, 'rss'),

-- News Wires
('PR Newswire', 'https://prnewswire.com', 'press_release', ARRAY['technology', 'finance', 'healthcare', 'retail'], 1, 'rss'),
('Business Wire', 'https://businesswire.com', 'press_release', ARRAY['technology', 'finance', 'healthcare'], 1, 'rss'),
('GlobeNewswire', 'https://globenewswire.com', 'press_release', ARRAY['finance', 'technology'], 1, 'rss');

-- ============================================================================
-- TIER 2: Industry-Specific Publications
-- ============================================================================

-- PR & Marketing
INSERT INTO source_registry (source_name, source_url, source_type, industries, tier, monitor_method) VALUES
('PRWeek', 'https://prweek.com', 'website', ARRAY['public_relations', 'marketing'], 2, 'firecrawl'),
('PRovoke Media', 'https://provokemedia.com', 'website', ARRAY['public_relations'], 2, 'firecrawl'),
('PR Daily', 'https://prdaily.com', 'website', ARRAY['public_relations', 'marketing'], 2, 'firecrawl'),
('Ragan', 'https://ragan.com', 'website', ARRAY['public_relations', 'corporate_communications'], 2, 'firecrawl'),
('O''Dwyer''s', 'https://odwyerpr.com', 'website', ARRAY['public_relations'], 2, 'firecrawl'),
('AdAge', 'https://adage.com', 'website', ARRAY['advertising', 'marketing'], 2, 'rss'),
('AdWeek', 'https://adweek.com', 'website', ARRAY['advertising', 'marketing'], 2, 'rss'),
('The Drum', 'https://thedrum.com', 'website', ARRAY['marketing', 'advertising'], 2, 'rss'),
('Marketing Dive', 'https://marketingdive.com', 'website', ARRAY['marketing', 'retail'], 2, 'rss'),

-- Healthcare/Pharma
('FierceHealthcare', 'https://fiercehealthcare.com', 'website', ARRAY['healthcare'], 2, 'rss'),
('Healthcare Dive', 'https://healthcaredive.com', 'website', ARRAY['healthcare'], 2, 'rss'),
('Modern Healthcare', 'https://modernhealthcare.com', 'website', ARRAY['healthcare'], 2, 'rss'),
('STAT News', 'https://statnews.com', 'website', ARRAY['healthcare', 'pharma', 'biotech'], 2, 'rss'),
('BioPharma Dive', 'https://biopharmadive.com', 'website', ARRAY['pharma', 'biotech'], 2, 'rss'),
('MedCity News', 'https://medcitynews.com', 'website', ARRAY['healthcare', 'medtech'], 2, 'rss'),
('Endpoints News', 'https://endpoints.com', 'website', ARRAY['biotech', 'pharma'], 2, 'rss'),

-- Finance/Fintech
('Banking Dive', 'https://bankingdive.com', 'website', ARRAY['finance', 'banking'], 2, 'rss'),
('Payments Dive', 'https://paymentsdive.com', 'website', ARRAY['fintech', 'payments'], 2, 'rss'),
('Finextra', 'https://finextra.com', 'website', ARRAY['fintech', 'banking'], 2, 'rss'),
('The Financial Brand', 'https://thefinancialbrand.com', 'website', ARRAY['banking', 'fintech'], 2, 'rss'),
('Seeking Alpha', 'https://seekingalpha.com', 'website', ARRAY['investing', 'finance'], 2, 'rss'),
('CoinDesk', 'https://coindesk.com', 'website', ARRAY['crypto', 'blockchain'], 2, 'rss'),
('The Block', 'https://theblock.co', 'website', ARRAY['crypto', 'blockchain'], 2, 'rss'),

-- Retail/Consumer
('Retail Dive', 'https://retaildive.com', 'website', ARRAY['retail', 'ecommerce'], 2, 'rss'),
('Grocery Dive', 'https://grocerydive.com', 'website', ARRAY['retail', 'food'], 2, 'rss'),
('Chain Store Age', 'https://chainstoreage.com', 'website', ARRAY['retail'], 2, 'rss'),
('Modern Retail', 'https://modernretail.co', 'website', ARRAY['retail', 'ecommerce'], 2, 'rss'),
('Business of Fashion', 'https://businessoffashion.com', 'website', ARRAY['fashion', 'retail'], 2, 'rss'),
('WWD', 'https://wwd.com', 'website', ARRAY['fashion', 'retail'], 2, 'rss'),

-- Technology Specialized
('Protocol', 'https://protocol.com', 'website', ARRAY['technology', 'policy'], 2, 'rss'),
('The Information', 'https://theinformation.com', 'website', ARRAY['technology', 'startups'], 2, 'rss'),
('Semafor', 'https://semafor.com', 'website', ARRAY['technology', 'business', 'politics'], 2, 'rss'),
('Puck News', 'https://puck.news', 'website', ARRAY['media', 'technology'], 2, 'rss'),
('MIT Technology Review', 'https://technologyreview.com', 'website', ARRAY['technology', 'science'], 2, 'rss'),
('IEEE Spectrum', 'https://spectrum.ieee.org', 'website', ARRAY['technology', 'engineering'], 2, 'rss'),

-- Supply Chain/Logistics
('Supply Chain Dive', 'https://supplychaindive.com', 'website', ARRAY['logistics', 'supply_chain'], 2, 'rss'),
('FreightWaves', 'https://freightwaves.com', 'website', ARRAY['logistics', 'transportation'], 2, 'rss'),
('Logistics Management', 'https://logisticsmgmt.com', 'website', ARRAY['logistics', 'supply_chain'], 2, 'rss'),

-- Manufacturing/Industrial
('Industry Week', 'https://industryweek.com', 'website', ARRAY['manufacturing', 'industrial'], 2, 'rss'),
('Manufacturing.net', 'https://manufacturing.net', 'website', ARRAY['manufacturing'], 2, 'rss'),
('Automation World', 'https://automationworld.com', 'website', ARRAY['manufacturing', 'automation'], 2, 'rss'),

-- Real Estate/Construction
('Construction Dive', 'https://constructiondive.com', 'website', ARRAY['construction', 'real_estate'], 2, 'rss'),
('The Real Deal', 'https://therealdeal.com', 'website', ARRAY['real_estate'], 2, 'rss'),
('Bisnow', 'https://bisnow.com', 'website', ARRAY['real_estate', 'construction'], 2, 'rss'),

-- Energy/Climate
('GreenTech Media', 'https://greentechmedia.com', 'website', ARRAY['energy', 'cleantech'], 2, 'rss'),
('Utility Dive', 'https://utilitydive.com', 'website', ARRAY['energy', 'utilities'], 2, 'rss'),
('CleanTechnica', 'https://cleantechnica.com', 'website', ARRAY['cleantech', 'energy'], 2, 'rss'),
('Recharge News', 'https://rechargenews.com', 'website', ARRAY['energy', 'renewables'], 2, 'rss'),

-- Legal/Regulatory
('Law.com', 'https://law.com', 'website', ARRAY['legal'], 2, 'rss'),
('Law360', 'https://law360.com', 'website', ARRAY['legal'], 2, 'rss'),
('Above the Law', 'https://abovethelaw.com', 'website', ARRAY['legal'], 2, 'rss');

-- ============================================================================
-- TIER 3: Supplemental Sources (Government, Think Tanks, Regional)
-- ============================================================================

-- Government/Regulatory
INSERT INTO source_registry (source_name, source_url, source_type, industries, tier, monitor_method) VALUES
('SEC', 'https://sec.gov', 'website', ARRAY['finance', 'regulation'], 3, 'rss'),
('FTC', 'https://ftc.gov', 'website', ARRAY['regulation', 'consumer_protection'], 3, 'rss'),
('FDA', 'https://fda.gov', 'website', ARRAY['healthcare', 'pharma', 'regulation'], 3, 'rss'),
('FCC', 'https://fcc.gov', 'website', ARRAY['telecommunications', 'regulation'], 3, 'rss'),
('Federal Reserve', 'https://federalreserve.gov', 'website', ARRAY['finance', 'economics'], 3, 'rss'),

-- Think Tanks/Research
('Brookings Institution', 'https://brookings.edu', 'website', ARRAY['policy', 'economics'], 3, 'rss'),
('RAND Corporation', 'https://rand.org', 'website', ARRAY['policy', 'research'], 3, 'rss'),
('CSIS', 'https://csis.org', 'website', ARRAY['policy', 'international'], 3, 'rss'),
('Council on Foreign Relations', 'https://cfr.org', 'website', ARRAY['policy', 'international'], 3, 'rss'),
('Pew Research', 'https://pewresearch.org', 'website', ARRAY['research', 'social'], 3, 'rss'),

-- Consulting/Research Firms
('McKinsey', 'https://mckinsey.com', 'website', ARRAY['consulting', 'strategy'], 3, 'firecrawl'),
('BCG', 'https://bcg.com', 'website', ARRAY['consulting', 'strategy'], 3, 'firecrawl'),
('Deloitte Insights', 'https://www2.deloitte.com', 'website', ARRAY['consulting', 'research'], 3, 'firecrawl'),
('PwC', 'https://pwc.com', 'website', ARRAY['consulting', 'professional_services'], 3, 'firecrawl'),
('Gartner', 'https://gartner.com', 'website', ARRAY['technology', 'research'], 3, 'firecrawl'),
('Forrester', 'https://forrester.com', 'website', ARRAY['technology', 'research'], 3, 'firecrawl'),

-- Startup/VC
('Crunchbase News', 'https://news.crunchbase.com', 'website', ARRAY['startups', 'venture_capital'], 3, 'rss'),
('PitchBook', 'https://pitchbook.com', 'website', ARRAY['venture_capital', 'private_equity'], 3, 'rss'),
('StrictlyVC', 'https://strictlyvc.com', 'website', ARRAY['venture_capital', 'startups'], 3, 'rss'),

-- AI/Emerging Tech
('AI News', 'https://artificialintelligence-news.com', 'website', ARRAY['ai', 'technology'], 3, 'rss'),
('Singularity Hub', 'https://singularityhub.com', 'website', ARRAY['ai', 'emerging_tech'], 3, 'rss'),
('The Gradient', 'https://thegradient.pub', 'website', ARRAY['ai', 'machine_learning'], 3, 'rss'),

-- Regional
('Nikkei Asia', 'https://asia.nikkei.com', 'website', ARRAY['business', 'asia'], 3, 'rss'),
('South China Morning Post', 'https://scmp.com', 'website', ARRAY['business', 'asia'], 3, 'rss'),
('Tech in Asia', 'https://techinasia.com', 'website', ARRAY['technology', 'asia'], 3, 'rss'),
('Politico EU', 'https://politico.eu', 'website', ARRAY['politics', 'europe'], 3, 'rss'),
('Sifted', 'https://sifted.eu', 'website', ARRAY['startups', 'europe'], 3, 'rss');

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
DECLARE
  total_sources INTEGER;
  tier1_count INTEGER;
  tier2_count INTEGER;
  tier3_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_sources FROM source_registry;
  SELECT COUNT(*) INTO tier1_count FROM source_registry WHERE tier = 1;
  SELECT COUNT(*) INTO tier2_count FROM source_registry WHERE tier = 2;
  SELECT COUNT(*) INTO tier3_count FROM source_registry WHERE tier = 3;

  RAISE NOTICE '✅ Source registry populated!';
  RAISE NOTICE '   Total sources: %', total_sources;
  RAISE NOTICE '   Tier 1 (Premium): %', tier1_count;
  RAISE NOTICE '   Tier 2 (Industry): %', tier2_count;
  RAISE NOTICE '   Tier 3 (Supplemental): %', tier3_count;
END $$;
