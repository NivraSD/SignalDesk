-- =============================================
-- UNIFIED SIGNALS SCHEMA - PART 2: FUNCTIONS
-- Run after Part 1
-- =============================================

-- Function to sync intelligence_targets from company_profile
CREATE OR REPLACE FUNCTION sync_intelligence_targets_from_profile(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  profile JSONB;
  target_count INTEGER := 0;
  competitor TEXT;
  stakeholder TEXT;
  regulator TEXT;
BEGIN
  -- Get company_profile
  SELECT company_profile INTO profile
  FROM organizations
  WHERE id = org_id;

  IF profile IS NULL THEN
    RETURN 0;
  END IF;

  -- Sync direct competitors
  IF profile->'competition'->'direct_competitors' IS NOT NULL THEN
    FOR competitor IN SELECT jsonb_array_elements_text(profile->'competition'->'direct_competitors')
    LOOP
      INSERT INTO intelligence_targets (organization_id, name, target_type, category, priority, synced_from)
      VALUES (org_id, competitor, 'competitor', 'direct_competitor', 'high', 'company_profile')
      ON CONFLICT (organization_id, name, target_type) DO UPDATE SET
        category = 'direct_competitor',
        priority = 'high',
        updated_at = NOW();
      target_count := target_count + 1;
    END LOOP;
  END IF;

  -- Sync indirect competitors
  IF profile->'competition'->'indirect_competitors' IS NOT NULL THEN
    FOR competitor IN SELECT jsonb_array_elements_text(profile->'competition'->'indirect_competitors')
    LOOP
      INSERT INTO intelligence_targets (organization_id, name, target_type, category, priority, synced_from)
      VALUES (org_id, competitor, 'competitor', 'indirect_competitor', 'medium', 'company_profile')
      ON CONFLICT (organization_id, name, target_type) DO UPDATE SET
        category = 'indirect_competitor',
        priority = 'medium',
        updated_at = NOW();
      target_count := target_count + 1;
    END LOOP;
  END IF;

  -- Sync emerging threats
  IF profile->'competition'->'emerging_threats' IS NOT NULL THEN
    FOR competitor IN SELECT jsonb_array_elements_text(profile->'competition'->'emerging_threats')
    LOOP
      INSERT INTO intelligence_targets (organization_id, name, target_type, category, priority, synced_from)
      VALUES (org_id, competitor, 'competitor', 'emerging_threat', 'medium', 'company_profile')
      ON CONFLICT (organization_id, name, target_type) DO UPDATE SET
        category = 'emerging_threat',
        priority = 'medium',
        updated_at = NOW();
      target_count := target_count + 1;
    END LOOP;
  END IF;

  -- Sync regulators
  IF profile->'stakeholders'->'regulators' IS NOT NULL THEN
    FOR regulator IN SELECT jsonb_array_elements_text(profile->'stakeholders'->'regulators')
    LOOP
      INSERT INTO intelligence_targets (organization_id, name, target_type, category, priority, synced_from)
      VALUES (org_id, regulator, 'regulator', 'primary_regulator', 'high', 'company_profile')
      ON CONFLICT (organization_id, name, target_type) DO UPDATE SET
        category = 'primary_regulator',
        priority = 'high',
        updated_at = NOW();
      target_count := target_count + 1;
    END LOOP;
  END IF;

  -- Sync key analysts
  IF profile->'stakeholders'->'key_analysts' IS NOT NULL THEN
    FOR stakeholder IN SELECT jsonb_array_elements_text(profile->'stakeholders'->'key_analysts')
    LOOP
      INSERT INTO intelligence_targets (organization_id, name, target_type, category, priority, synced_from)
      VALUES (org_id, stakeholder, 'influencer', 'key_analyst', 'medium', 'company_profile')
      ON CONFLICT (organization_id, name, target_type) DO UPDATE SET
        category = 'key_analyst',
        priority = 'medium',
        updated_at = NOW();
      target_count := target_count + 1;
    END LOOP;
  END IF;

  -- Sync activists
  IF profile->'stakeholders'->'activists' IS NOT NULL THEN
    FOR stakeholder IN SELECT jsonb_array_elements_text(profile->'stakeholders'->'activists')
    LOOP
      INSERT INTO intelligence_targets (organization_id, name, target_type, category, priority, synced_from)
      VALUES (org_id, stakeholder, 'stakeholder', 'activist', 'medium', 'company_profile')
      ON CONFLICT (organization_id, name, target_type) DO UPDATE SET
        category = 'activist',
        priority = 'medium',
        updated_at = NOW();
      target_count := target_count + 1;
    END LOOP;
  END IF;

  RETURN target_count;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DONE - Part 2 Complete
-- Now run Part 3 (triggers, RLS, data migration)
-- =============================================
