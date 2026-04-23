-- Add last_sent column to budget_alerts table
ALTER TABLE budget_alerts ADD COLUMN IF NOT EXISTS last_sent TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_budget_alerts_last_sent ON budget_alerts(last_sent);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_last_sent ON budget_alerts(user_id, last_sent);