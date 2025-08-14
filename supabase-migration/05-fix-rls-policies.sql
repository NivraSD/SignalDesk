-- Fix RLS Policies for Supabase Auth
-- This migration updates RLS policies to work correctly with Supabase Auth

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own organization data" ON organizations;
DROP POLICY IF EXISTS "Users can view own organization users" ON users;
DROP POLICY IF EXISTS "Users can manage own organization projects" ON projects;
DROP POLICY IF EXISTS "Users can manage own organization content" ON content;
DROP POLICY IF EXISTS "Users can manage own organization intelligence" ON intelligence_targets;
DROP POLICY IF EXISTS "Users can view own organization findings" ON intelligence_findings;
DROP POLICY IF EXISTS "Users can view own organization monitoring" ON monitoring_runs;
DROP POLICY IF EXISTS "Users can manage own organization opportunities" ON opportunity_queue;
DROP POLICY IF EXISTS "Users can manage own organization memory" ON memoryvault_items;

-- Create proper RLS policies using auth.uid()

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Organizations policies (users can view their organization)
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Projects policies (users can manage projects in their organization)
CREATE POLICY "Users can view organization projects" ON projects
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization projects" ON projects
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization projects" ON projects
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization projects" ON projects
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Content policies
CREATE POLICY "Users can view organization content" ON content
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization content" ON content
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization content" ON content
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization content" ON content
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Intelligence targets policies
CREATE POLICY "Users can view organization intelligence targets" ON intelligence_targets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization intelligence targets" ON intelligence_targets
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization intelligence targets" ON intelligence_targets
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization intelligence targets" ON intelligence_targets
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Intelligence findings policies (read-only for users)
CREATE POLICY "Users can view organization findings" ON intelligence_findings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Monitoring runs policies (read-only for users)
CREATE POLICY "Users can view organization monitoring runs" ON monitoring_runs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Opportunity queue policies
CREATE POLICY "Users can view organization opportunities" ON opportunity_queue
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization opportunities" ON opportunity_queue
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- MemoryVault policies
CREATE POLICY "Users can view organization memory items" ON memoryvault_items
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create organization memory items" ON memoryvault_items
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update organization memory items" ON memoryvault_items
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete organization memory items" ON memoryvault_items
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Create function to automatically set organization_id for new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Check if user already exists in users table
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = new.id) THEN
    -- Create default organization if needed
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = 'default-org') THEN
      INSERT INTO public.organizations (id, name, industry, size)
      VALUES ('default-org', 'Default Organization', 'Technology', 'Small');
    END IF;
    
    -- Insert user into users table with default organization
    INSERT INTO public.users (id, email, name, organization_id, role)
    VALUES (
      new.id, 
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      'default-org',
      'admin'
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add helpful comment
COMMENT ON SCHEMA public IS 'SignalDesk application schema with proper RLS policies for Supabase Auth';