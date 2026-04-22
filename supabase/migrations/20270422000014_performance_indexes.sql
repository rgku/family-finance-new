-- Performance indexes for FamFlow
-- Execute this in Supabase SQL Editor
-- Note: Running without CONCURRENTLY to allow transaction execution

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date 
ON transactions(user_id, type, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category 
ON transactions(user_id, category);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_created 
ON goals(user_id, created_at DESC);

-- Budgets indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_month 
ON budgets(user_id, month);

-- Family members indexes
CREATE INDEX IF NOT EXISTS idx_family_members_user 
ON family_members(user_id);

-- Budget alerts indexes
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user 
ON budget_alerts(user_id);