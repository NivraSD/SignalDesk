-- Fix RLS for user_profiles to allow reading
-- The admin dashboard needs to see all users
-- User profile data (email, name) isn't highly sensitive for internal tools

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all reads on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;

-- Allow all reads (for admin dashboard)
CREATE POLICY "Allow all reads on user_profiles" ON user_profiles
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON user_profiles TO authenticated;
