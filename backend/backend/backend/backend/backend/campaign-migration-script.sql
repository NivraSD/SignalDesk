-- Campaign Orchestration Migration Script for SignalDesk
-- This adds new tables without modifying existing ones

-- Campaign Types/Templates Table (new)
CREATE TABLE IF NOT EXISTS campaign_types (
  id SERIAL PRIMARY KEY,
  type_key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7),
  duration VARCHAR(50),
  budget_range VARCHAR(100),
  phases JSONB DEFAULT '[]',
  key_activities JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Plans Table (new - for executable campaigns)
CREATE TABLE IF NOT EXISTS campaign_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL, -- Link to existing campaigns
  template_id VARCHAR(50) REFERENCES campaign_types(type_key),
  name VARCHAR(255) NOT NULL,
  brief TEXT,
  strategy JSONB,
  plan_data JSONB, -- Contains timeline, tasks, budget, content briefs, etc.
  status VARCHAR(50) DEFAULT 'planning', -- planning, active, completed, paused
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Tasks Table (new)
CREATE TABLE IF NOT EXISTS campaign_tasks (
  id SERIAL PRIMARY KEY,
  campaign_plan_id INTEGER REFERENCES campaign_plans(id) ON DELETE CASCADE,
  phase VARCHAR(255),
  task VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  assignee VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in-progress, completed, overdue
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  dependencies JSONB DEFAULT '[]',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Expenses Table (new)
CREATE TABLE IF NOT EXISTS campaign_expenses (
  id SERIAL PRIMARY KEY,
  campaign_plan_id INTEGER REFERENCES campaign_plans(id) ON DELETE CASCADE,
  category VARCHAR(255),
  description TEXT,
  amount DECIMAL(10, 2),
  vendor VARCHAR(255),
  expense_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  receipt_url TEXT,
  created_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content Briefs Table (new)
CREATE TABLE IF NOT EXISTS campaign_content_briefs (
  id SERIAL PRIMARY KEY,
  campaign_plan_id INTEGER REFERENCES campaign_plans(id) ON DELETE CASCADE,
  content_id INTEGER REFERENCES content(id) ON DELETE SET NULL, -- Link to existing content
  type VARCHAR(100) NOT NULL, -- Press Release, Blog Post, etc.
  title VARCHAR(255) NOT NULL,
  brief TEXT NOT NULL,
  due_date DATE,
  assignee VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in-progress, review, approved, completed
  priority VARCHAR(20) DEFAULT 'medium',
  content_draft TEXT,
  final_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Metrics Table (new)
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id SERIAL PRIMARY KEY,
  campaign_plan_id INTEGER REFERENCES campaign_plans(id) ON DELETE CASCADE,
  metric_category VARCHAR(100),
  metric_name VARCHAR(255),
  target_value VARCHAR(100),
  current_value VARCHAR(100),
  measurement_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default campaign templates
INSERT INTO campaign_types (type_key, name, description, icon, color, duration, budget_range, phases, key_activities) VALUES
('product-launch', 'Product Launch', 'Launch new products with maximum impact and media coverage', 'Rocket', '#3b82f6', '3 months', 'Starting from $50k', 
 '["Pre-launch Buzz", "Launch Week", "Post-launch Momentum", "Long-term Growth"]'::jsonb,
 '["Media outreach", "Influencer partnerships", "Launch events", "Content creation"]'::jsonb),

('funding-announcement', 'Funding Announcement', 'Announce funding rounds to maximize visibility and credibility', 'DollarSign', '#10b981', '6 weeks', 'Starting from $30k',
 '["Preparation", "Exclusive Reveal", "Broad Announcement", "Follow-up Stories"]'::jsonb,
 '["Exclusive media placements", "Executive interviews", "Industry analyst briefings", "Investor communications"]'::jsonb),

('brand-awareness', 'Brand Awareness', 'Build and strengthen brand recognition in target markets', 'Globe', '#8b5cf6', '6 months', 'Starting from $75k',
 '["Market Research", "Strategy Development", "Campaign Execution", "Performance Optimization"]'::jsonb,
 '["Thought leadership", "Strategic partnerships", "Content marketing", "Speaking opportunities"]'::jsonb),

('thought-leadership', 'Thought Leadership', 'Position executives as industry experts and visionaries', 'Award', '#f59e0b', '4 months', 'Starting from $40k',
 '["Topic Development", "Content Creation", "Media Placement", "Engagement Tracking"]'::jsonb,
 '["Op-ed placements", "Speaking engagements", "Podcast appearances", "Research reports"]'::jsonb),

('crisis-management', 'Crisis Management', 'Navigate challenging situations with strategic communication', 'Shield', '#ef4444', 'As needed', 'Starting from $25k',
 '["Immediate Response", "Stakeholder Management", "Media Relations", "Recovery"]'::jsonb,
 '["Rapid response", "Stakeholder communications", "Media monitoring", "Reputation repair"]'::jsonb),

('event-promotion', 'Event Promotion', 'Drive attendance and coverage for conferences, webinars, or launches', 'Calendar', '#06b6d4', '8 weeks', 'Starting from $35k',
 '["Early Bird", "Registration Drive", "Final Push", "Event Coverage"]'::jsonb,
 '["Media partnerships", "Speaker promotion", "Social campaigns", "Content amplification"]'::jsonb),

('partnership-announcement', 'Partnership Announcement', 'Announce strategic partnerships for maximum industry impact', 'Users', '#84cc16', '4 weeks', 'Starting from $20k',
 '["Alignment", "Preparation", "Announcement", "Amplification"]'::jsonb,
 '["Joint messaging", "Co-branded content", "Executive quotes", "Trade media outreach"]'::jsonb),

('market-expansion', 'Market Expansion', 'Support entry into new markets or geographic regions', 'TrendingUp', '#6366f1', '4 months', 'Starting from $60k',
 '["Market Research", "Localization", "Soft Launch", "Full Market Entry"]'::jsonb,
 '["Local media relations", "Regional partnerships", "Cultural adaptation", "Community engagement"]'::jsonb)
ON CONFLICT (type_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_plans_user_id ON campaign_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_plans_status ON campaign_plans(status);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_campaign_plan_id ON campaign_tasks(campaign_plan_id);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_status ON campaign_tasks(status);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_due_date ON campaign_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_campaign_content_briefs_campaign_plan_id ON campaign_content_briefs(campaign_plan_id);
CREATE INDEX IF NOT EXISTS idx_campaign_content_briefs_status ON campaign_content_briefs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_expenses_campaign_plan_id ON campaign_expenses(campaign_plan_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_plan_id ON campaign_metrics(campaign_plan_id);

-- Add triggers for updated_at (if function doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaign_types_updated_at BEFORE UPDATE ON campaign_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_plans_updated_at BEFORE UPDATE ON campaign_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_tasks_updated_at BEFORE UPDATE ON campaign_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_expenses_updated_at BEFORE UPDATE ON campaign_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_content_briefs_updated_at BEFORE UPDATE ON campaign_content_briefs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
