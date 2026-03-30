-- =============================================
-- UNIFIED SIGNALS SCHEMA - PART 4: DATA SYNC
-- Run after Part 3 (can run later if needed)
-- =============================================

-- =============================================
-- SYNC INTELLIGENCE TARGETS FROM ALL ORGS
-- =============================================
DO $$
DECLARE
  org_record RECORD;
  total_synced INTEGER := 0;
  org_synced INTEGER;
BEGIN
  FOR org_record IN SELECT id, name FROM organizations WHERE company_profile IS NOT NULL
  LOOP
    BEGIN
      SELECT sync_intelligence_targets_from_profile(org_record.id) INTO org_synced;
      total_synced := total_synced + COALESCE(org_synced, 0);
      RAISE NOTICE 'Synced % targets for org: %', org_synced, org_record.name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error syncing org %: %', org_record.name, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '=== Total synced: % intelligence targets ===', total_synced;
END $$;

-- =============================================
-- OPTIONAL: Add auto-sync trigger on organizations
-- This can cause deadlocks if run during high activity
-- Uncomment if you want auto-sync when company_profile changes
-- =============================================
/*
CREATE OR REPLACE FUNCTION trigger_sync_intelligence_targets()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.company_profile IS DISTINCT FROM OLD.company_profile THEN
    PERFORM sync_intelligence_targets_from_profile(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_org_profile_changed ON organizations;
CREATE TRIGGER trg_org_profile_changed
  AFTER UPDATE OF company_profile ON organizations
  FOR EACH ROW EXECUTE FUNCTION trigger_sync_intelligence_targets();
*/

-- =============================================
-- DONE - All parts complete!
-- =============================================
