-- Stakeholder Intelligence Database Schema
-- Created for SignalDesk Platform

-- Organizations table (companies using the platform)
CREATE TABLE IF NOT EXISTS organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  industry VARCHAR(100),
  type VARCHAR(100), -- 'agency', 'tech_company', 'healthcare', etc.
  strategic_goals TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Stakeholder groups for each organization
CREATE TABLE IF NOT EXISTS stakeholder_groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100), -- 'target_client', 'competitor', 'referral_partner', etc.
  priority VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
  reason TEXT,
  influence INT DEFAULT 5, -- 1-10 scale
  current_sentiment INT DEFAULT 5, -- 1-10 scale
  target_sentiment INT DEFAULT 8,
  engagement_level INT DEFAULT 5,
  is_pre_indexed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  INDEX idx_org_stakeholder (organization_id, priority)
);

-- Individual stakeholder entities within groups
CREATE TABLE IF NOT EXISTS stakeholder_entities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stakeholder_group_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  ticker_symbol VARCHAR(10),
  website_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  metadata JSON, -- Store additional flexible data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stakeholder_group_id) REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
  INDEX idx_entity_name (name)
);

-- Stakeholder monitoring sources
CREATE TABLE IF NOT EXISTS stakeholder_sources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stakeholder_group_id INT NOT NULL,
  stakeholder_entity_id INT, -- Can be NULL for group-level sources
  name VARCHAR(255) NOT NULL,
  url VARCHAR(1000),
  type VARCHAR(50), -- 'web', 'rss', 'api', 'social', 'regulatory'
  extraction_method VARCHAR(50), -- 'scraping', 'rss', 'api', 'manual'
  api_endpoint VARCHAR(500),
  api_key_ref VARCHAR(100), -- Reference to which API key to use
  rss_feed_url VARCHAR(1000),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_checked TIMESTAMP NULL,
  check_frequency_hours INT DEFAULT 24,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stakeholder_group_id) REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (stakeholder_entity_id) REFERENCES stakeholder_entities(id) ON DELETE CASCADE,
  INDEX idx_active_sources (stakeholder_group_id, is_active),
  INDEX idx_check_schedule (last_checked, check_frequency_hours)
);

-- Monitoring topics for each stakeholder
CREATE TABLE IF NOT EXISTS stakeholder_monitoring_topics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stakeholder_group_id INT NOT NULL,
  topic VARCHAR(500) NOT NULL,
  category VARCHAR(100), -- 'business', 'regulatory', 'competitive', 'market'
  keywords TEXT, -- Comma-separated keywords for this topic
  sentiment_threshold INT DEFAULT 3, -- Alert if sentiment drops below
  volume_threshold INT DEFAULT 10, -- Alert if mention volume exceeds
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stakeholder_group_id) REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
  INDEX idx_group_topics (stakeholder_group_id, is_active)
);

-- Intelligence findings from monitoring
CREATE TABLE IF NOT EXISTS intelligence_findings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stakeholder_group_id INT NOT NULL,
  stakeholder_source_id INT,
  title VARCHAR(500),
  content TEXT,
  url VARCHAR(1000),
  type VARCHAR(50), -- 'news', 'alert', 'opportunity', 'risk', 'insight'
  sentiment_score DECIMAL(3,2), -- -1 to 1
  relevance_score DECIMAL(3,2), -- 0 to 1
  priority VARCHAR(20),
  extracted_entities JSON, -- People, companies, topics mentioned
  metadata JSON,
  published_at TIMESTAMP,
  discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (stakeholder_group_id) REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (stakeholder_source_id) REFERENCES stakeholder_sources(id) ON DELETE SET NULL,
  INDEX idx_findings_timeline (stakeholder_group_id, discovered_at DESC),
  INDEX idx_unread_findings (stakeholder_group_id, is_read, is_archived)
);

-- AI-generated predictions and recommendations
CREATE TABLE IF NOT EXISTS stakeholder_predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stakeholder_group_id INT NOT NULL,
  prediction_text TEXT NOT NULL,
  confidence_score DECIMAL(3,2), -- 0 to 1
  timeframe VARCHAR(100), -- 'Next 30 days', 'Next quarter', etc.
  category VARCHAR(50), -- 'opportunity', 'risk', 'action'
  is_active BOOLEAN DEFAULT TRUE,
  outcome VARCHAR(20), -- 'pending', 'correct', 'incorrect', 'partial'
  outcome_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (stakeholder_group_id) REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
  INDEX idx_active_predictions (stakeholder_group_id, is_active)
);

-- Recommended actions for stakeholders
CREATE TABLE IF NOT EXISTS stakeholder_actions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stakeholder_group_id INT NOT NULL,
  action_text TEXT NOT NULL,
  priority VARCHAR(20), -- 'critical', 'high', 'medium', 'low'
  impact VARCHAR(100),
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  assigned_to VARCHAR(255),
  completed_at TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stakeholder_group_id) REFERENCES stakeholder_groups(id) ON DELETE CASCADE,
  INDEX idx_pending_actions (stakeholder_group_id, status, priority)
);

-- Pre-indexed stakeholder database (system-wide)
CREATE TABLE IF NOT EXISTS pre_indexed_stakeholders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100), -- 'tech_companies', 'vc_firms', 'pr_agencies', etc.
  type VARCHAR(100),
  aliases JSON, -- Array of alternative names
  influence INT DEFAULT 5,
  verified_sources JSON, -- Array of verified source objects
  monitoring_topics JSON, -- Default monitoring topics
  metadata JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category, is_active),
  INDEX idx_name_search (name)
);

-- Search and discovery cache
CREATE TABLE IF NOT EXISTS source_discovery_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  query VARCHAR(500) NOT NULL,
  api_source VARCHAR(50), -- 'google', 'news_api', 'twitter'
  results JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX idx_cache_lookup (query, api_source, expires_at)
);

-- Create indexes for common queries
CREATE INDEX idx_org_stakeholders ON stakeholder_groups(organization_id, priority, is_pre_indexed);
CREATE INDEX idx_intelligence_recent ON intelligence_findings(discovered_at DESC, stakeholder_group_id);
CREATE INDEX idx_source_validation ON stakeholder_sources(is_verified, last_checked);