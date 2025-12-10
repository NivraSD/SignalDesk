-- Fix RLS policy on content_library to allow anon reads
-- The table has RLS enabled but policies may not be set correctly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all content" ON content_library;
DROP POLICY IF EXISTS "Users can insert content" ON content_library;
DROP POLICY IF EXISTS "Users can update content" ON content_library;
DROP POLICY IF EXISTS "Users can delete content" ON content_library;
DROP POLICY IF EXISTS "Enable all operations" ON content_library;
DROP POLICY IF EXISTS "Allow all reads" ON content_library;
DROP POLICY IF EXISTS "Allow all inserts" ON content_library;
DROP POLICY IF EXISTS "Allow all updates" ON content_library;
DROP POLICY IF EXISTS "Allow all deletes" ON content_library;

-- Create permissive policies for all operations
CREATE POLICY "content_library_select_policy" ON content_library
  FOR SELECT USING (true);

CREATE POLICY "content_library_insert_policy" ON content_library
  FOR INSERT WITH CHECK (true);

CREATE POLICY "content_library_update_policy" ON content_library
  FOR UPDATE USING (true);

CREATE POLICY "content_library_delete_policy" ON content_library
  FOR DELETE USING (true);

-- Grant permissions to all roles
GRANT SELECT, INSERT, UPDATE, DELETE ON content_library TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_library TO authenticated;
GRANT ALL ON content_library TO service_role;
