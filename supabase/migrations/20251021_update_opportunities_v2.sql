-- Update Opportunities Table for V2 Architecture
-- Add fields for strategic context, execution plans, and Gamma presentations

-- 1. Add strategic context fields
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS strategic_context JSONB,
ADD COLUMN IF NOT EXISTS time_window TEXT,
ADD COLUMN IF NOT EXISTS expected_impact TEXT;

-- 2. Add execution plan
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS execution_plan JSONB;

-- 3. Add Gamma presentation fields
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS presentation_url TEXT,
ADD COLUMN IF NOT EXISTS presentation_data JSONB;

-- 4. Add execution tracking
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS auto_executable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS executed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS campaign_session_id UUID REFERENCES campaign_builder_sessions(id);

-- 5. Add opportunity version for tracking V1 vs V2
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 2;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_auto_executable ON opportunities(auto_executable);
CREATE INDEX IF NOT EXISTS idx_opportunities_executed ON opportunities(executed);
CREATE INDEX IF NOT EXISTS idx_opportunities_campaign_session ON opportunities(campaign_session_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_version ON opportunities(version);

-- 7. Add comments
COMMENT ON COLUMN opportunities.strategic_context IS 'V2: Detailed strategic context including trigger_events, market_dynamics, why_now';
COMMENT ON COLUMN opportunities.execution_plan IS 'V2: Complete execution plan with stakeholder campaigns and content items';
COMMENT ON COLUMN opportunities.presentation_url IS 'V2: Auto-generated Gamma presentation URL';
COMMENT ON COLUMN opportunities.presentation_data IS 'V2: Full Gamma presentation data and metadata';
COMMENT ON COLUMN opportunities.auto_executable IS 'V2: Whether this opportunity can be auto-executed';
COMMENT ON COLUMN opportunities.executed IS 'V2: Whether this opportunity has been executed';
COMMENT ON COLUMN opportunities.campaign_session_id IS 'V2: Link to campaign session if executed';
COMMENT ON COLUMN opportunities.version IS 'Format version: 1 = legacy, 2 = execution-ready V2';

-- 8. Update existing opportunities to version 1 (legacy)
UPDATE opportunities
SET version = 1
WHERE version IS NULL;
