-- Fix source_registry monitor_config
-- Populate monitor_config JSONB with actual RSS feed URLs and configuration
-- This fixes the "No valid RSS feed" errors

-- ============================================================================
-- RSS SOURCES - Add feed URLs to monitor_config
-- ============================================================================

-- Tier 1 RSS Feeds
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.bloomberg.com/feed/podcast/etf-iq') WHERE source_name = 'Bloomberg' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.reuters.com/rssFeed/businessNews') WHERE source_name = 'Reuters' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://feeds.content.dowjones.io/public/rss/mw_topstories') WHERE source_name = 'Wall Street Journal' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.ft.com/?format=rss') WHERE source_name = 'Financial Times' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.barrons.com/rss') WHERE source_name = 'Barrons' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.cnbc.com/id/100003114/device/rss/rss.html') WHERE source_name = 'CNBC' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.forbes.com/real-time/feed2/') WHERE source_name = 'Forbes' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://fortune.com/feed/') WHERE source_name = 'Fortune' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.economist.com/rss') WHERE source_name = 'The Economist' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://feeds.businessinsider.com/custom/all') WHERE source_name = 'Business Insider' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.fastcompany.com/latest/rss') WHERE source_name = 'Fast Company' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.inc.com/rss/') WHERE source_name = 'Inc' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://feeds.hbr.org/harvardbusiness') WHERE source_name = 'Harvard Business Review' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://techcrunch.com/feed/') WHERE source_name = 'TechCrunch' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.theverge.com/rss/index.xml') WHERE source_name = 'The Verge' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.wired.com/feed/rss') WHERE source_name = 'Wired' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://feeds.arstechnica.com/arstechnica/index') WHERE source_name = 'Ars Technica' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://venturebeat.com/feed/') WHERE source_name = 'VentureBeat' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.prnewswire.com/rss/news-releases-list.rss') WHERE source_name = 'PR Newswire' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.businesswire.com/portal/site/home/news/') WHERE source_name = 'Business Wire' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.globenewswire.com/RssFeed/subjectcode/11-Technology/feedTitle/GlobeNewswire%20-%20Technology') WHERE source_name = 'GlobeNewswire' AND monitor_method = 'rss';

-- Tier 2 RSS Feeds
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://adage.com/rss') WHERE source_name = 'AdAge' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.adweek.com/feed/') WHERE source_name = 'AdWeek' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.thedrum.com/rss/all') WHERE source_name = 'The Drum' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.marketingdive.com/feeds/news/') WHERE source_name = 'Marketing Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.fiercehealthcare.com/rss/xml') WHERE source_name = 'FierceHealthcare' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.healthcaredive.com/feeds/news/') WHERE source_name = 'Healthcare Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.modernhealthcare.com/rss') WHERE source_name = 'Modern Healthcare' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.statnews.com/feed/') WHERE source_name = 'STAT News' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.biopharmadive.com/feeds/news/') WHERE source_name = 'BioPharma Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://medcitynews.com/feed/') WHERE source_name = 'MedCity News' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://endpts.com/feed/') WHERE source_name = 'Endpoints News' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.bankingdive.com/feeds/news/') WHERE source_name = 'Banking Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.paymentsdive.com/feeds/news/') WHERE source_name = 'Payments Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.finextra.com/rss/headline.aspx') WHERE source_name = 'Finextra' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://thefinancialbrand.com/feed/') WHERE source_name = 'The Financial Brand' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://seekingalpha.com/feed.xml') WHERE source_name = 'Seeking Alpha' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.coindesk.com/arc/outboundfeeds/rss/') WHERE source_name = 'CoinDesk' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.theblock.co/rss.xml') WHERE source_name = 'The Block' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.retaildive.com/feeds/news/') WHERE source_name = 'Retail Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.grocerydive.com/feeds/news/') WHERE source_name = 'Grocery Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://chainstoreage.com/rss.xml') WHERE source_name = 'Chain Store Age' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.modernretail.co/feed/') WHERE source_name = 'Modern Retail' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.businessoffashion.com/feed/') WHERE source_name = 'Business of Fashion' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://wwd.com/feed/') WHERE source_name = 'WWD' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.protocol.com/feeds/feed.rss') WHERE source_name = 'Protocol' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.theinformation.com/feed') WHERE source_name = 'The Information' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.semafor.com/rss') WHERE source_name = 'Semafor' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://puck.news/feed/') WHERE source_name = 'Puck News' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.technologyreview.com/feed/') WHERE source_name = 'MIT Technology Review' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://spectrum.ieee.org/feeds/feed.rss') WHERE source_name = 'IEEE Spectrum' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.supplychaindive.com/feeds/news/') WHERE source_name = 'Supply Chain Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.freightwaves.com/news/feed') WHERE source_name = 'FreightWaves' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.logisticsmgmt.com/rss/all') WHERE source_name = 'Logistics Management' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.industryweek.com/rss') WHERE source_name = 'Industry Week' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.manufacturing.net/rss') WHERE source_name = 'Manufacturing.net' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.automationworld.com/rss.xml') WHERE source_name = 'Automation World' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.constructiondive.com/feeds/news/') WHERE source_name = 'Construction Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://therealdeal.com/feed/') WHERE source_name = 'The Real Deal' AND monitor_method = 'rss';

-- Tier 2 PR sources that actually have RSS (not firecrawl)
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.ragan.com/feed/') WHERE source_name = 'Ragan';

-- Tier 3 RSS Feeds
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.greentechmedia.com/rss/articles') WHERE source_name = 'GreenTech Media' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.cleantechnica.com/feed/') WHERE source_name = 'CleanTechnica' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.utilitydive.com/feeds/news/') WHERE source_name = 'Utility Dive' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://abovethelaw.com/feed/') WHERE source_name = 'Above the Law' AND monitor_method = 'rss';
UPDATE source_registry SET monitor_config = jsonb_build_object('feed_url', 'https://www.law.com/feed/') WHERE source_name = 'Law.com' AND monitor_method = 'rss';

-- ============================================================================
-- FIRECRAWL SOURCES - Basic configuration for web scraping
-- ============================================================================

-- PR/Marketing sources that need Firecrawl (no RSS)
UPDATE source_registry SET monitor_config = jsonb_build_object('scrape_method', 'firecrawl_map', 'check_frequency_hours', 6) WHERE source_name = 'PRWeek' AND monitor_method = 'firecrawl';
UPDATE source_registry SET monitor_config = jsonb_build_object('scrape_method', 'firecrawl_map', 'check_frequency_hours', 6) WHERE source_name = 'PRovoke Media' AND monitor_method = 'firecrawl';
UPDATE source_registry SET monitor_config = jsonb_build_object('scrape_method', 'firecrawl_map', 'check_frequency_hours', 6) WHERE source_name = 'PR Daily' AND monitor_method = 'firecrawl';
UPDATE source_registry SET monitor_config = jsonb_build_object('scrape_method', 'firecrawl_map', 'check_frequency_hours', 6) WHERE source_name = 'O''Dwyer''s' AND monitor_method = 'firecrawl';

-- Other firecrawl sources
UPDATE source_registry SET monitor_config = jsonb_build_object('scrape_method', 'firecrawl_map', 'check_frequency_hours', 12) WHERE monitor_method = 'firecrawl' AND monitor_config IS NULL;

-- ============================================================================
-- SITEMAP SOURCES - Add sitemap URLs
-- ============================================================================

UPDATE source_registry SET monitor_config = jsonb_build_object('sitemap_url', 'https://www.bloomberg.com/sitemap_news.xml') WHERE source_name = 'Bloomberg' AND monitor_method = 'sitemap';
UPDATE source_registry SET monitor_config = jsonb_build_object('sitemap_url', 'https://www.cnbc.com/sitemap/') WHERE source_name = 'CNBC' AND monitor_method = 'sitemap';
UPDATE source_registry SET monitor_config = jsonb_build_object('sitemap_url', 'https://www.businesswire.com/sitemap.xml') WHERE source_name = 'Business Wire' AND monitor_method = 'sitemap';
UPDATE source_registry SET monitor_config = jsonb_build_object('sitemap_url', 'https://www.prnewswire.com/sitemap.xml') WHERE source_name = 'PR Newswire' AND monitor_method = 'sitemap';
UPDATE source_registry SET monitor_config = jsonb_build_object('sitemap_url', 'https://www.reuters.com/sitemap_news.xml') WHERE source_name = 'Reuters' AND monitor_method = 'sitemap';
UPDATE source_registry SET monitor_config = jsonb_build_object('sitemap_url', 'https://www.wsj.com/news/sitemap/') WHERE source_name = 'Wall Street Journal' AND monitor_method = 'sitemap';
UPDATE source_registry SET monitor_config = jsonb_build_object('sitemap_url', 'https://www.economist.com/sitemap.xml') WHERE source_name = 'The Economist' AND monitor_method = 'sitemap';

-- ============================================================================
-- CSE SOURCES - Custom search configuration
-- ============================================================================

-- O'Dwyer's and PRovoke Media use CSE for discovery
UPDATE source_registry SET monitor_config = jsonb_build_object('search_query', 'site:odwyerpr.com', 'check_frequency_hours', 6) WHERE source_name = 'O''Dwyer''s' AND monitor_method = 'cse';
UPDATE source_registry SET monitor_config = jsonb_build_object('search_query', 'site:provokemedia.com', 'check_frequency_hours', 6) WHERE source_name = 'PRovoke Media' AND monitor_method = 'cse';
