-- Add sender tracking to budget_expenses
ALTER TABLE budget_expenses
ADD COLUMN IF NOT EXISTS sender_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT;

-- Index for filtering by sender
CREATE INDEX IF NOT EXISTS idx_budget_expenses_sender ON budget_expenses(sender_name);
