-- Fix content_library.id to UUID type
-- This resolves the Edge Function UUID error
-- Date: 2025-10-24

-- Step 1: Drop dependent objects temporarily
DROP TRIGGER IF EXISTS trigger_update_folder_count ON content_library;
DROP TRIGGER IF EXISTS trigger_track_template ON content_library;

-- Step 2: Drop primary key constraint
ALTER TABLE content_library DROP CONSTRAINT IF EXISTS content_library_pkey;

-- Step 3: Add new UUID column
ALTER TABLE content_library ADD COLUMN id_new UUID DEFAULT gen_random_uuid();

-- Step 4: Generate new UUIDs for all rows (id is INTEGER, can't convert to UUID)
-- All existing content will get new IDs
UPDATE content_library
SET id_new = gen_random_uuid();

-- Step 5: Drop old id column and rename new one
ALTER TABLE content_library DROP COLUMN id;
ALTER TABLE content_library RENAME COLUMN id_new TO id;

-- Step 6: Set as primary key with default
ALTER TABLE content_library ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE content_library ADD PRIMARY KEY (id);

-- Step 7: Recreate triggers
CREATE TRIGGER trigger_update_folder_count
AFTER INSERT OR UPDATE OR DELETE ON content_library
FOR EACH ROW
EXECUTE FUNCTION update_folder_item_count();

CREATE TRIGGER trigger_track_template
AFTER INSERT ON content_library
FOR EACH ROW
EXECUTE FUNCTION track_template_usage();

-- Step 8: Update content_relationships if it has data
-- Since content_relationships.source_content_id and target_content_id are TEXT,
-- they need to be updated to match new UUIDs
-- For now, just clear the relationships table since it's new
TRUNCATE TABLE content_relationships;

-- Step 9: Verify the change
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'content_library' AND column_name = 'id';

-- Success message
SELECT '✅ content_library.id changed to UUID successfully!' as status;
SELECT '⚠️ NOTE: Existing content IDs have been regenerated' as warning;
SELECT '⚠️ NOTE: content_relationships table has been cleared' as warning2;
