-- Budget tracker table for Telegram bot expenses
CREATE TABLE IF NOT EXISTS budget_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  category VARCHAR(100),
  description TEXT,
  source_type VARCHAR(20) DEFAULT 'text', -- 'text' or 'image'
  raw_message TEXT, -- original message or image analysis
  telegram_message_id BIGINT,
  telegram_chat_id BIGINT,
  synced_to_sheets BOOLEAN DEFAULT FALSE,
  sheets_row_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_budget_expenses_created_at ON budget_expenses(created_at DESC);
CREATE INDEX idx_budget_expenses_category ON budget_expenses(category);
CREATE INDEX idx_budget_expenses_synced ON budget_expenses(synced_to_sheets) WHERE synced_to_sheets = FALSE;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_budget_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER budget_expenses_updated_at
  BEFORE UPDATE ON budget_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_expenses_updated_at();
