# Database Setup Instructions for Opportunity Engine

## ⚠️ Current Status
The Opportunity Engine tables need to be created in your Supabase database.

## 📋 Quick Setup via Supabase Dashboard

### Option 1: Use Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard:**
   https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/editor

2. **Copy the SQL from:**
   `/Users/jonathanliebowitz/Desktop/SignalDesk/mcp-servers/signaldesk-scraper/setup.sql`

3. **Paste and Run in SQL Editor**

### Option 2: Manual Table Creation

If you prefer, here's the cleaned SQL to run in the Supabase SQL Editor:

```sql
-- SignalDesk Opportunity Engine Tables

-- 1. Webpage Snapshots (for visual change detection)
CREATE TABLE IF NOT EXISTS webpage_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  screenshot BYTEA,
  content_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webpage_url_created 
ON webpage_snapshots(url, created_at DESC);

-- 2. Monitoring Results (raw signals from scraping)
CREATE TABLE IF NOT EXISTS monitoring_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  signals JSONB,
  patterns JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  organization_id UUID
);

-- 3. Detected Opportunities (identified patterns)
CREATE TABLE IF NOT EXISTS detected_opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  pattern_type VARCHAR(100),
  signal_data JSONB,
  confidence DECIMAL(3,2),
  action_window VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  brief JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  acted_upon BOOLEAN DEFAULT FALSE,
  outcome JSONB
);

-- 4. Cascade Predictions (your secret weapon!)
CREATE TABLE IF NOT EXISTS cascade_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_event JSONB NOT NULL,
  first_order_effects JSONB,
  second_order_effects JSONB,
  third_order_effects JSONB,
  opportunities JSONB,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  organization_id UUID
);

-- 5. Opportunity Patterns (pattern library)
CREATE TABLE IF NOT EXISTS opportunity_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  required_signals JSONB,
  confidence_threshold DECIMAL(3,2),
  action_window VARCHAR(50),
  suggested_response TEXT,
  success_rate DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Insert Default Patterns
INSERT INTO opportunity_patterns (name, required_signals, confidence_threshold, action_window, suggested_response) VALUES
('competitor_weakness', '["negative_sentiment", "leadership_change", "product_issue"]', 0.7, '24-48 hours', 'Position as stable alternative'),
('narrative_vacuum', '["high_search_volume", "low_expert_coverage", "journalist_interest"]', 0.6, '3-5 days', 'Offer executive as expert source'),
('cascade_event', '["primary_disruption", "industry_impact", "supply_chain_effect"]', 0.8, '1-3 days', 'Pre-position for cascade effects'),
('viral_moment', '["rapid_social_growth", "relevant_to_brand", "positive_sentiment"]', 0.65, '6-12 hours', 'Amplify with brand perspective'),
('regulatory_change', '["new_regulation", "comment_period", "industry_impact"]', 0.75, '2-4 weeks', 'Thought leadership on implications')
ON CONFLICT (name) DO NOTHING;

-- 7. Learning Outcomes (track what works)
CREATE TABLE IF NOT EXISTS opportunity_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES detected_opportunities(id),
  action_taken BOOLEAN,
  outcome JSONB,
  success_metrics JSONB,
  lessons_learned TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_monitoring_results_created 
ON monitoring_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_detected_opportunities_status 
ON detected_opportunities(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cascade_predictions_confidence 
ON cascade_predictions(confidence DESC, created_at DESC);
```

## 🔍 Verify Setup

After running the SQL, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'webpage_snapshots',
  'monitoring_results',
  'detected_opportunities',
  'cascade_predictions',
  'opportunity_patterns',
  'opportunity_outcomes'
);
```

Expected result: Should show all 6 tables.

## 🎯 Quick Test

Test that the patterns were inserted:

```sql
SELECT name, action_window, suggested_response 
FROM opportunity_patterns;
```

Should return 5 rows:
- competitor_weakness (24-48 hours)
- narrative_vacuum (3-5 days)
- cascade_event (1-3 days)
- viral_moment (6-12 hours)
- regulatory_change (2-4 weeks)

## 🚀 Next Steps

Once tables are created:

1. **Test the Scraper MCP in Claude Desktop:**
   ```
   "Use signaldesk-scraper to monitor TechCrunch.com"
   ```

2. **Test Cascade Detection:**
   ```
   "Detect cascade indicators for supply chain disruptions"
   ```

3. **Test Pattern Matching:**
   ```
   "Check for competitor weakness patterns"
   ```

## 📊 What These Tables Enable

### `webpage_snapshots`
- Visual change detection on competitor sites
- Track when pages update

### `monitoring_results`
- Store raw scraping data
- Track all signals collected

### `detected_opportunities`
- Track identified opportunities
- Score and prioritize actions
- Monitor what you acted on

### `cascade_predictions`
- Your unique differentiator!
- Predict 2nd and 3rd order effects
- See opportunities before competitors

### `opportunity_patterns`
- Pattern recognition library
- Learn what opportunities look like
- Improve detection over time

### `opportunity_outcomes`
- Track what worked
- Learn from successes/failures
- Continuously improve

## 🆘 Troubleshooting

If tables aren't creating:
1. Check you're in the correct Supabase project
2. Ensure you have admin permissions
3. Try creating one table at a time
4. Check for any existing tables with same names

## ✅ Success Indicators

After setup, you should be able to:
- Run web scraping with the scraper MCP
- Store monitoring results
- Detect opportunity patterns
- Track cascade predictions
- Learn from outcomes

Your Opportunity Engine is ready when all 6 tables exist!