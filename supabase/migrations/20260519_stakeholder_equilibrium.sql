-- stakeholder_equilibrium — per (asset, stakeholder) control-system definition.
--
-- An "asset" is an lp_scenarios row (Cobre Panamá, etc.). For each stakeholder
-- relevant to that asset, we define:
--   * equilibrium_state: what "aligned / non-disruptive" looks like
--   * ladder: 4 escalation rungs with indicators
--   * current_level: where they sit RIGHT NOW (0 = equilibrium, 1-4 = drift)
--   * influence_weight: how much they matter for the aggregate health score
--
-- The same actor (e.g. Mulino) can have different equilibria for different
-- assets — so the key is (asset_id, stakeholder_name).
--
-- ladder shape:
-- [
--   { level: 1, label: 'Mild concern', description: '...',
--     indicators: ['...', '...'], typical_response: 'monitor' },
--   { level: 2, label: 'Grumbling', ... },
--   { level: 3, label: 'Active resistance', ... },
--   { level: 4, label: 'Deal-breaker', ... }
-- ]

CREATE TABLE IF NOT EXISTS stakeholder_equilibrium (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL REFERENCES lp_scenarios(id) ON DELETE CASCADE,

  stakeholder_name TEXT NOT NULL,
  stakeholder_type TEXT,
    -- 'government' | 'corporate' | 'community' | 'media' | 'civil_society'
    -- | 'financial' | 'international' | 'regulator'
  stakeholder_role TEXT,      -- free text: "President of Panama", "Operator", etc.

  entity_profile_id UUID,     -- optional link to lp_entity_profiles
  influence_weight INTEGER DEFAULT 5 CHECK (influence_weight BETWEEN 1 AND 10),

  equilibrium_state TEXT,     -- markdown — the artifact
  ladder JSONB DEFAULT '[]'::jsonb,

  current_level INTEGER DEFAULT 0 CHECK (current_level BETWEEN 0 AND 4),
  current_level_reasoning TEXT,
  current_level_updated_at TIMESTAMPTZ,
  current_level_evidence JSONB DEFAULT '[]'::jsonb,
    -- citations: [{type: 'alert', id, label}, ...]

  edit_log JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (asset_id, stakeholder_name)
);

CREATE INDEX IF NOT EXISTS idx_stakeholder_equilibrium_asset
  ON stakeholder_equilibrium(asset_id);
CREATE INDEX IF NOT EXISTS idx_stakeholder_equilibrium_level
  ON stakeholder_equilibrium(asset_id, current_level);
CREATE INDEX IF NOT EXISTS idx_stakeholder_equilibrium_type
  ON stakeholder_equilibrium(asset_id, stakeholder_type);

ALTER TABLE stakeholder_equilibrium ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stakeholder_equilibrium_all" ON stakeholder_equilibrium FOR ALL USING (true);

CREATE TRIGGER update_stakeholder_equilibrium_updated_at
  BEFORE UPDATE ON stakeholder_equilibrium
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
