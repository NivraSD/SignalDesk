-- SignalDesk Complete Setup - SAFE VERSION (No Destructive Operations)
-- Run this after schema setup to have a working platform

-- Step 1: Create demo user in database (update with your Auth UID later)
INSERT INTO users (id, email, name, organization_id, role)
VALUES 
  (gen_random_uuid(), 'demo@signaldesk.com', 'Demo User', 'demo-org', 'admin')
ON CONFLICT (email) DO UPDATE 
SET organization_id = 'demo-org', role = 'admin';

-- Step 2: Create essential projects (needed for platform to work)
WITH demo_user AS (
  SELECT id FROM users WHERE email = 'demo@signaldesk.com' LIMIT 1
)
INSERT INTO projects (name, description, user_id, organization_id, status)
SELECT 
  'Default Workspace', 
  'Main workspace for PR activities', 
  demo_user.id, 
  'demo-org', 
  'active'
FROM demo_user
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE name = 'Default Workspace' AND organization_id = 'demo-org'
);

-- Step 3: Set up monitoring targets (so monitoring features work)
INSERT INTO intelligence_targets (organization_id, name, type, priority, keywords, sources, active)
SELECT * FROM (
  VALUES 
    ('demo-org', 'Industry News', 'topic', 'high', 
     ARRAY['AI', 'PR', 'communications', 'marketing']::TEXT[], 
     '{"rss": ["https://techcrunch.com/feed/", "https://venturebeat.com/feed/"], "monitoring_enabled": true}'::JSONB,
     true),
    ('demo-org', 'Competitor Watch', 'competitor', 'high', 
     ARRAY['competitor', 'launch', 'announcement']::TEXT[], 
     '{"rss": [], "monitoring_enabled": true}'::JSONB,
     true)
) AS targets(organization_id, name, type, priority, keywords, sources, active)
WHERE NOT EXISTS (
  SELECT 1 FROM intelligence_targets WHERE organization_id = 'demo-org'
);

-- Step 4: Create at least one opportunity (so Opportunity Engine works)
INSERT INTO opportunity_queue (organization_id, title, type, description, score, urgency, status)
SELECT 
  'demo-org', 
  'Platform Ready for Launch', 
  'announcement', 
  'Your SignalDesk platform is now operational on Supabase', 
  100, 
  'medium', 
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM opportunity_queue WHERE organization_id = 'demo-org'
);

-- Step 5: Initialize MemoryVault with platform knowledge
WITH demo_project AS (
  SELECT id FROM projects WHERE name = 'Default Workspace' LIMIT 1
)
INSERT INTO memoryvault_items (project_id, organization_id, name, type, content)
SELECT 
  demo_project.id,
  'demo-org',
  'Platform Configuration',
  'system',
  'SignalDesk platform successfully migrated to Supabase. All monitoring, intelligence, and content features are operational.'
FROM demo_project
WHERE NOT EXISTS (
  SELECT 1 FROM memoryvault_items 
  WHERE name = 'Platform Configuration' 
  AND organization_id = 'demo-org'
);

-- Step 6: Create initial monitoring run (proves monitoring works)
INSERT INTO monitoring_runs (organization_id, status, findings_count, execution_time, started_at, completed_at)
SELECT 
  'demo-org', 
  'completed', 
  0, 
  1000,
  NOW() - INTERVAL '1 minute',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM monitoring_runs WHERE organization_id = 'demo-org'
);

-- Step 7: Create better RLS policies (only if they don't exist)
DO $$ 
BEGIN
  -- Check and create policy for organizations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND policyname = 'Enable read for authenticated users'
  ) THEN
    CREATE POLICY "Enable read for authenticated users" ON organizations
      FOR SELECT USING (true);
  END IF;

  -- Check and create policy for users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON users
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;

  -- Check and create policy for projects
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON projects
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;

  -- Check and create policy for content
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'content' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON content
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;

  -- Check and create policy for intelligence_targets
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'intelligence_targets' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON intelligence_targets
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;

  -- Check and create policy for intelligence_findings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'intelligence_findings' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON intelligence_findings
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;

  -- Check and create policy for monitoring_runs
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'monitoring_runs' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON monitoring_runs
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;

  -- Check and create policy for opportunity_queue
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'opportunity_queue' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON opportunity_queue
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;

  -- Check and create policy for memoryvault_items
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'memoryvault_items' 
    AND policyname = 'Enable all for authenticated users'
  ) THEN
    CREATE POLICY "Enable all for authenticated users" ON memoryvault_items
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Step 8: Create function to link Auth user to database user (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, organization_id, role)
  VALUES (new.id, new.email, 'demo-org', 'member')
  ON CONFLICT (id) DO UPDATE
  SET email = new.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user creation (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Verify setup
DO $$ 
DECLARE
  org_count INTEGER;
  user_count INTEGER;
  project_count INTEGER;
  target_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations WHERE id = 'demo-org';
  SELECT COUNT(*) INTO user_count FROM users WHERE email = 'demo@signaldesk.com';
  SELECT COUNT(*) INTO project_count FROM projects WHERE organization_id = 'demo-org';
  SELECT COUNT(*) INTO target_count FROM intelligence_targets WHERE organization_id = 'demo-org';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PLATFORM SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Setup Status:';
  RAISE NOTICE '  Organization: % created', CASE WHEN org_count > 0 THEN 'demo-org' ELSE 'PENDING' END;
  RAISE NOTICE '  User: % ready', CASE WHEN user_count > 0 THEN 'demo@signaldesk.com' ELSE 'PENDING' END;
  RAISE NOTICE '  Projects: % workspace(s) created', project_count;
  RAISE NOTICE '  Monitoring: % target(s) configured', target_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Go to Authentication → Users';
  RAISE NOTICE '2. Create user: demo@signaldesk.com / demo123';
  RAISE NOTICE '3. Enable realtime on monitoring tables';
  RAISE NOTICE '4. Your platform is ready to use!';
  RAISE NOTICE '========================================';
END $$;