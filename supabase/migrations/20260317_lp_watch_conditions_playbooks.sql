-- LP Watch Conditions & Playbooks tables
-- Created for post-simulation strategic output processing

CREATE TABLE IF NOT EXISTS lp_watch_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES lp_simulations(id) ON DELETE CASCADE,
  fulcrum_id TEXT NOT NULL,
  condition_name TEXT NOT NULL,
  trigger_description TEXT NOT NULL,
  monitoring_source TEXT,
  threshold TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'expired')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lp_watch_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_watch_conditions_all" ON lp_watch_conditions FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS lp_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_condition_id UUID REFERENCES lp_watch_conditions(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES lp_simulations(id) ON DELETE CASCADE,
  playbook_name TEXT NOT NULL,
  headline_response TEXT,
  talking_points JSONB DEFAULT '[]',
  positioning_statement TEXT,
  media_angle TEXT,
  social_draft TEXT,
  sequence_notes TEXT,
  cascade_prediction TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lp_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lp_playbooks_all" ON lp_playbooks FOR ALL USING (true);
