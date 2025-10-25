-- Fix folder_index permissions for triggers
-- The update_folder_item_count() trigger needs to bypass RLS

-- Drop and recreate the function with SECURITY DEFINER
DROP FUNCTION IF EXISTS update_folder_item_count() CASCADE;

CREATE OR REPLACE FUNCTION update_folder_item_count()
RETURNS TRIGGER
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.folder IS NOT NULL THEN
    -- Create folder if it doesn't exist
    INSERT INTO folder_index (organization_id, folder_path, item_count, last_updated)
    VALUES (NEW.organization_id, NEW.folder, 1, NOW())
    ON CONFLICT (folder_path) DO UPDATE
    SET item_count = folder_index.item_count + 1,
        last_updated = NOW();

  ELSIF TG_OP = 'UPDATE' AND OLD.folder IS DISTINCT FROM NEW.folder THEN
    -- Decrement old folder if it exists
    IF OLD.folder IS NOT NULL THEN
      UPDATE folder_index
      SET item_count = GREATEST(0, item_count - 1),
          last_updated = NOW()
      WHERE folder_path = OLD.folder
        AND organization_id = OLD.organization_id;
    END IF;

    -- Increment new folder (create if doesn't exist)
    IF NEW.folder IS NOT NULL THEN
      INSERT INTO folder_index (organization_id, folder_path, item_count, last_updated)
      VALUES (NEW.organization_id, NEW.folder, 1, NOW())
      ON CONFLICT (folder_path) DO UPDATE
      SET item_count = folder_index.item_count + 1,
          last_updated = NOW();
    END IF;

  ELSIF TG_OP = 'DELETE' AND OLD.folder IS NOT NULL THEN
    UPDATE folder_index
    SET item_count = GREATEST(0, item_count - 1),
        last_updated = NOW()
    WHERE folder_path = OLD.folder
      AND organization_id = OLD.organization_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_folder_count ON content_library;
CREATE TRIGGER trigger_update_folder_count
AFTER INSERT OR UPDATE OR DELETE ON content_library
FOR EACH ROW
EXECUTE FUNCTION update_folder_item_count();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION update_folder_item_count() TO authenticated;
GRANT EXECUTE ON FUNCTION update_folder_item_count() TO anon;
GRANT EXECUTE ON FUNCTION update_folder_item_count() TO service_role;

-- Verify the function exists
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'update_folder_item_count';
