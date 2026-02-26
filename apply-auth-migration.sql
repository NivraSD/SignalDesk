-- Manual application of user management migration
-- Run this in Supabase SQL Editor if supabase db push fails

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create org_users junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS org_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create org_invitations table
CREATE TABLE IF NOT EXISTS org_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_pending_invitation UNIQUE(organization_id, email, accepted_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_users_organization_id ON org_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_users_user_id ON org_users(user_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_organization_id ON org_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON org_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON org_invitations(token);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view org members" ON org_users;
DROP POLICY IF EXISTS "Owners and admins can add members" ON org_users;
DROP POLICY IF EXISTS "Owners and admins can update roles" ON org_users;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON org_users;
DROP POLICY IF EXISTS "Users can view org invitations" ON org_invitations;
DROP POLICY IF EXISTS "Owners and admins can create invitations" ON org_invitations;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for org_users
CREATE POLICY "Users can view org members"
  ON org_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_users ou
      WHERE ou.organization_id = org_users.organization_id
      AND ou.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can add members"
  ON org_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_users ou
      WHERE ou.organization_id = organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update roles"
  ON org_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_users ou
      WHERE ou.organization_id = organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can remove members"
  ON org_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_users ou
      WHERE ou.organization_id = organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for org_invitations
CREATE POLICY "Users can view org invitations"
  ON org_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_users ou
      WHERE ou.organization_id = org_invitations.organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can create invitations"
  ON org_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_users ou
      WHERE ou.organization_id = organization_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('owner', 'admin')
    )
  );

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_org_users_updated_at ON org_users;
CREATE TRIGGER update_org_users_updated_at
  BEFORE UPDATE ON org_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
