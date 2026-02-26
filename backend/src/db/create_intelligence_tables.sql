-- SignalDesk Intelligence System Database Schema
-- Central source of truth for all intelligence gathering

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS organization_intelligence CASCADE;
DROP TABLE IF EXISTS industry_subcategories CASCADE;
DROP TABLE IF EXISTS industry_indexes CASCADE;

-- Industry indexes with subcategories
CREATE TABLE industry_indexes (
  id SERIAL PRIMARY KEY,
  industry VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  keywords JSONB DEFAULT '[]',
  competitors JSONB DEFAULT '[]',
  rss_feeds JSONB DEFAULT '[]',
  news_queries JSONB DEFAULT '[]',
  websites JSONB DEFAULT '[]',
  trending_topics JSONB DEFAULT '[]',
  priority VARCHAR(20) DEFAULT 'medium',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(industry, subcategory)
);

-- Industry subcategories mapping
CREATE TABLE industry_subcategories (
  id SERIAL PRIMARY KEY,
  main_industry VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  description TEXT,
  example_companies JSONB DEFAULT '[]',
  specific_sources JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(main_industry, subcategory)
);

-- Organization-specific intelligence configuration
CREATE TABLE organization_intelligence (
  id SERIAL PRIMARY KEY,
  organization_id UUID,
  organization_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  subcategory VARCHAR(100),
  competitors JSONB DEFAULT '[]',
  keywords JSONB DEFAULT '[]',
  custom_sources JSONB DEFAULT '{}',
  monitoring_config JSONB DEFAULT '{}',
  intelligence_history JSONB DEFAULT '[]',
  last_scan TIMESTAMP,
  scan_frequency_minutes INTEGER DEFAULT 60,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_name)
);

-- Create indexes for performance
CREATE INDEX idx_industry_indexes_industry ON industry_indexes(industry);
CREATE INDEX idx_industry_indexes_subcategory ON industry_indexes(subcategory);
CREATE INDEX idx_industry_subcategories_main ON industry_subcategories(main_industry);
CREATE INDEX idx_organization_intelligence_name ON organization_intelligence(organization_name);
CREATE INDEX idx_organization_intelligence_industry ON organization_intelligence(industry);

-- Insert base industry data with subcategories
INSERT INTO industry_subcategories (main_industry, subcategory, description, example_companies) VALUES
-- Technology subcategories
('technology', 'artificial_intelligence', 'AI/ML companies and platforms', '["OpenAI", "Anthropic", "DeepMind", "Hugging Face"]'),
('technology', 'cloud_computing', 'Cloud infrastructure and services', '["AWS", "Azure", "Google Cloud", "Cloudflare"]'),
('technology', 'cybersecurity', 'Security software and services', '["CrowdStrike", "Palo Alto", "Fortinet", "SentinelOne"]'),
('technology', 'saas', 'Software as a Service companies', '["Salesforce", "Workday", "ServiceNow", "Zoom"]'),
('technology', 'developer_tools', 'Dev tools and platforms', '["GitHub", "GitLab", "JetBrains", "Docker"]'),
('technology', 'consumer_tech', 'Consumer electronics and apps', '["Apple", "Samsung", "Sony", "Fitbit"]'),

-- Finance subcategories
('finance', 'banking', 'Traditional and digital banking', '["JPMorgan", "Bank of America", "Chime", "Revolut"]'),
('finance', 'fintech', 'Financial technology companies', '["Stripe", "Square", "PayPal", "Klarna"]'),
('finance', 'cryptocurrency', 'Crypto and blockchain', '["Coinbase", "Binance", "Kraken", "Chainalysis"]'),
('finance', 'insurance', 'Insurtech and traditional insurance', '["Lemonade", "Root", "Progressive", "Geico"]'),
('finance', 'investment', 'Asset management and trading', '["BlackRock", "Vanguard", "Robinhood", "E*TRADE"]'),

-- Healthcare subcategories
('healthcare', 'biotech', 'Biotechnology companies', '["Moderna", "BioNTech", "CRISPR Therapeutics", "Illumina"]'),
('healthcare', 'pharma', 'Pharmaceutical companies', '["Pfizer", "J&J", "Merck", "AstraZeneca"]'),
('healthcare', 'medical_devices', 'Medical device manufacturers', '["Medtronic", "Abbott", "Boston Scientific", "Stryker"]'),
('healthcare', 'digital_health', 'Digital health and telemedicine', '["Teladoc", "Babylon Health", "Ro", "Hims"]'),
('healthcare', 'health_insurance', 'Health insurance providers', '["UnitedHealth", "Anthem", "Cigna", "Humana"]'),

-- Retail subcategories
('retail', 'ecommerce', 'Online retail platforms', '["Amazon", "Shopify", "eBay", "Etsy"]'),
('retail', 'fashion', 'Fashion and apparel', '["Nike", "Zara", "H&M", "Lululemon"]'),
('retail', 'grocery', 'Grocery and food retail', '["Walmart", "Kroger", "Whole Foods", "Instacart"]'),
('retail', 'luxury', 'Luxury goods and services', '["LVMH", "Gucci", "Hermès", "Tiffany"]'),

-- Energy subcategories
('energy', 'renewable', 'Renewable energy companies', '["NextEra", "Orsted", "First Solar", "Vestas"]'),
('energy', 'oil_gas', 'Oil and gas companies', '["ExxonMobil", "Chevron", "Shell", "BP"]'),
('energy', 'electric_vehicles', 'EV manufacturers and charging', '["Tesla", "Rivian", "ChargePoint", "Lucid"]'),
('energy', 'battery_tech', 'Battery and storage technology', '["CATL", "BYD", "Panasonic", "QuantumScape"]'),

-- Media subcategories
('media', 'streaming', 'Streaming platforms', '["Netflix", "Disney+", "HBO Max", "Spotify"]'),
('media', 'gaming', 'Gaming companies', '["Activision", "EA", "Take-Two", "Roblox"]'),
('media', 'social_media', 'Social media platforms', '["Meta", "Twitter", "TikTok", "Snapchat"]'),
('media', 'news_publishing', 'News and publishing', '["NYT", "News Corp", "Bloomberg", "Conde Nast"]'),

-- Transportation subcategories
('transportation', 'airlines', 'Airlines and aviation', '["Delta", "United", "Southwest", "American"]'),
('transportation', 'automotive', 'Auto manufacturers', '["Tesla", "Ford", "GM", "Toyota"]'),
('transportation', 'logistics', 'Logistics and delivery', '["UPS", "FedEx", "DHL", "Maersk"]'),
('transportation', 'rideshare', 'Rideshare and mobility', '["Uber", "Lyft", "DoorDash", "Instacart"]'),

-- Add more subcategories as needed
('real_estate', 'commercial', 'Commercial real estate', '["CBRE", "JLL", "Cushman & Wakefield", "WeWork"]'),
('real_estate', 'residential', 'Residential real estate', '["Zillow", "Redfin", "Compass", "Opendoor"]'),
('education', 'edtech', 'Education technology', '["Coursera", "Duolingo", "Chegg", "2U"]'),
('education', 'higher_ed', 'Universities and colleges', '["Harvard", "MIT", "Stanford", "ASU"]');

-- Sample function to get intelligence config for an organization
CREATE OR REPLACE FUNCTION get_organization_intelligence_config(org_name TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'organization', oi.organization_name,
    'industry', oi.industry,
    'subcategory', oi.subcategory,
    'competitors', oi.competitors,
    'keywords', oi.keywords,
    'industry_sources', (
      SELECT json_build_object(
        'rss_feeds', ii.rss_feeds,
        'news_queries', ii.news_queries,
        'websites', ii.websites
      )
      FROM industry_indexes ii
      WHERE ii.industry = oi.industry
      AND (ii.subcategory = oi.subcategory OR ii.subcategory IS NULL)
      LIMIT 1
    ),
    'custom_sources', oi.custom_sources,
    'monitoring_config', oi.monitoring_config
  ) INTO result
  FROM organization_intelligence oi
  WHERE oi.organization_name = org_name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON industry_indexes TO authenticated;
GRANT ALL ON industry_subcategories TO authenticated;
GRANT ALL ON organization_intelligence TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_intelligence_config TO authenticated;