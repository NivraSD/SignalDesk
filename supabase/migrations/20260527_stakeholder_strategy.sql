-- Strategy layer for stakeholder_equilibrium.
-- Per (asset, stakeholder), the AI-drafted (then human-edited) plan to move a
-- drifted stakeholder back toward equilibrium.
--
-- strategy shape:
-- {
--   "objective": "what aligned engagement should achieve for this stakeholder",
--   "moves": [
--     { "action": "...", "rationale": "...", "channel": "...",
--       "owner": "...", "timeframe": "...", "priority": 1 }
--   ],
--   "drafted_at": "<iso>",
--   "model": "<model id>"
-- }

ALTER TABLE stakeholder_equilibrium
  ADD COLUMN IF NOT EXISTS strategy JSONB,
  ADD COLUMN IF NOT EXISTS strategy_updated_at TIMESTAMPTZ;
