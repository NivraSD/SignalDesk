-- SignalDesk Demo Data for Supabase
-- Run this after the schema setup

-- Insert demo user (after creating auth user in Supabase Dashboard)
-- Replace the UUID with the actual auth.users.id from Supabase Auth
INSERT INTO users (id, email, name, organization_id, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'demo@signaldesk.com', 'Demo User', 'demo-org', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert demo projects
INSERT INTO projects (id, name, description, user_id, organization_id, status)
VALUES 
  ('22222222-2222-2222-2222-222222222222'::uuid, 'Q4 Product Launch', 'Major product release campaign', '11111111-1111-1111-1111-111111111111'::uuid, 'demo-org', 'active'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'Thought Leadership Campaign', 'CEO positioning as industry expert', '11111111-1111-1111-1111-111111111111'::uuid, 'demo-org', 'active'),
  ('44444444-4444-4444-4444-444444444444'::uuid, 'Crisis Response Plan', 'Prepared responses for potential issues', '11111111-1111-1111-1111-111111111111'::uuid, 'demo-org', 'planning');

-- Insert demo content
INSERT INTO content (type, title, content, user_id, project_id, organization_id)
VALUES 
  ('press_release', 'SignalDesk Launches Revolutionary AI PR Platform', 'SignalDesk today announced the launch of its AI-powered PR platform...', '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'demo-org'),
  ('media_pitch', 'Exclusive: How AI is Transforming PR', 'Hi Sarah, I wanted to reach out with an exclusive opportunity...', '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'demo-org'),
  ('social_post', 'Exciting news! 🚀', 'We''re thrilled to announce SignalDesk''s new AI capabilities...', '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'demo-org');

-- Insert demo intelligence targets
INSERT INTO intelligence_targets (organization_id, name, type, priority, keywords, sources)
VALUES 
  ('demo-org', 'OpenAI', 'competitor', 'high', ARRAY['ChatGPT', 'GPT-4', 'Sam Altman'], '{"rss": ["https://openai.com/blog/rss"], "twitter": ["@OpenAI"]}'),
  ('demo-org', 'AI Regulation', 'topic', 'high', ARRAY['AI Act', 'AI regulation', 'AI ethics'], '{"google_news": true, "reddit": ["r/artificial"]}'),
  ('demo-org', 'TechCrunch', 'stakeholder', 'medium', ARRAY['SignalDesk', 'PR tech', 'AI PR'], '{"website": "https://techcrunch.com", "rss": ["https://techcrunch.com/feed/"]}');

-- Insert demo intelligence findings
INSERT INTO intelligence_findings (organization_id, target_id, finding_type, title, content, source_url, relevance_score, sentiment, ai_analysis)
VALUES 
  ('demo-org', 1, 'product_launch', 'OpenAI Announces GPT-5 Development', 'OpenAI CEO Sam Altman confirmed development of GPT-5...', 'https://example.com/news/1', 0.95, 'neutral', 'Significant competitive development. Recommend preparing response messaging.'),
  ('demo-org', 2, 'regulatory_update', 'EU AI Act Passes Final Vote', 'The European Parliament approved the AI Act...', 'https://example.com/news/2', 0.88, 'positive', 'New compliance requirements. Update product positioning to emphasize safety.'),
  ('demo-org', 3, 'media_mention', 'TechCrunch Covers AI PR Tools', 'TechCrunch published a roundup of AI-powered PR platforms...', 'https://techcrunch.com/example', 0.92, 'positive', 'SignalDesk not mentioned. Opportunity for outreach.');

-- Insert demo opportunities
INSERT INTO opportunity_queue (organization_id, title, type, description, score, urgency, suggested_action, deadline, keywords, status)
VALUES 
  ('demo-org', 'AI Ethics Panel at TechCrunch Disrupt', 'speaking_opportunity', 'TechCrunch is seeking panelists for AI ethics discussion', 85, 'high', 'Submit CEO as panelist highlighting responsible AI in PR', '2025-09-01', ARRAY['AI ethics', 'conference', 'thought leadership'], 'active'),
  ('demo-org', 'Journalist Request: AI Tools for Small Business', 'media_opportunity', 'Reporter from Inc. Magazine seeking sources on AI tools for SMBs', 78, 'urgent', 'Respond with customer case studies and offer expert interview', '2025-08-20', ARRAY['media request', 'Inc Magazine', 'AI tools'], 'active'),
  ('demo-org', 'Product Hunt Launch Window', 'launch_opportunity', 'Optimal timing identified for Product Hunt launch based on competition analysis', 72, 'medium', 'Prepare launch assets and coordinate with community', '2025-09-15', ARRAY['Product Hunt', 'launch', 'product'], 'active');

-- Insert demo opportunity patterns
INSERT INTO opportunity_patterns (name, type, description, signals, success_criteria)
VALUES 
  ('Competitor Vulnerability', 'competitive', 'Detect when competitors have negative news', 
   '{"triggers": ["layoffs", "security breach", "bad reviews"], "threshold": 3}',
   '{"response_time": "< 24 hours", "message_type": "thought_leadership"}'),
  ('Trending Topic Alignment', 'newsjacking', 'Identify trending topics that align with our expertise',
   '{"sources": ["Twitter", "Google Trends", "Reddit"], "relevance_score": 0.7}',
   '{"engagement_rate": "> 5%", "media_mentions": "> 2"}');

-- Insert demo memoryvault items
INSERT INTO memoryvault_items (project_id, organization_id, name, type, content, metadata)
VALUES 
  ('22222222-2222-2222-2222-222222222222'::uuid, 'demo-org', 'Product Launch Playbook', 'playbook', 
   'Standard process for product launches: 1. Embargo tier-1 media 2. Prepare executive briefing...', 
   '{"version": "2.0", "last_used": "2025-07-01", "success_rate": 0.85}'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'demo-org', 'Key Journalist Preferences', 'relationship', 
   'Sarah Chen (TechCrunch): Prefers exclusive angles, 48hr response time, loves data-driven stories...', 
   '{"updated": "2025-08-01", "interaction_count": 12}'),
  ('33333333-3333-3333-3333-333333333333'::uuid, 'demo-org', 'CEO Bio - Long Form', 'content_template', 
   'John Smith is a visionary leader in the AI industry with over 15 years of experience...', 
   '{"usage_count": 45, "last_updated": "2025-08-10"}');

-- Insert demo monitoring runs
INSERT INTO monitoring_runs (organization_id, target_id, status, findings_count, execution_time)
VALUES 
  ('demo-org', 1, 'completed', 5, 2340),
  ('demo-org', 2, 'completed', 3, 1890),
  ('demo-org', 3, 'completed', 8, 3200);

-- Create sample memoryvault relationships
INSERT INTO memoryvault_relationships (source_item_id, target_item_id, relationship_type, strength)
VALUES 
  (1, 2, 'references', 0.9),
  (1, 3, 'uses', 0.7);

COMMENT ON SCHEMA public IS 'SignalDesk Demo Data Loaded';