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

-- RLS Policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for org_users
-- Users can view org_users for organizations they belong to
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

-- Only owners and admins can add members
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

-- Only owners and admins can update member roles
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

-- Only owners and admins can remove members
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
-- Users can view invitations for orgs they belong to
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

-- Only owners and admins can create invitations
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_users_updated_at
  BEFORE UPDATE ON org_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
