-- Add detection_count to track how many times we've seen the same signal pattern
-- This supports signal deduplication - seeing the same pattern repeatedly
-- strengthens the signal rather than creating duplicates

-- Add detection_count column (defaults to 1 for new signals)
ALTER TABLE signals ADD COLUMN IF NOT EXISTS detection_count INTEGER DEFAULT 1;

-- Add last_detected_at to track when we last saw this pattern
ALTER TABLE signals ADD COLUMN IF NOT EXISTS last_detected_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for efficient deduplication queries
CREATE INDEX IF NOT EXISTS idx_signals_dedup
ON signals (organization_id, signal_type, primary_target_id, status)
WHERE status = 'active';

-- Update existing signals to have detection_count = 1
UPDATE signals SET detection_count = 1 WHERE detection_count IS NULL;
UPDATE signals SET last_detected_at = created_at WHERE last_detected_at IS NULL;
