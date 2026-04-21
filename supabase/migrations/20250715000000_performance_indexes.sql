-- Performance Indexes Migration
-- Run this SQL in your Supabase SQL Editor

-- Indexes for transactions (most queried table)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_date_category ON transactions(date, category);

-- Indexes for goals
CREATE INDEX IF NOT EXISTS idx_goals_user_deadline ON goals(user_id, deadline);
CREATE INDEX IF NOT EXISTS idx_goals_user_type ON goals(user_id, goal_type);

-- Indexes for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets(user_id, category);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_family ON profiles(family_id);

-- Indexes for families
CREATE INDEX IF NOT EXISTS idx_families_invite ON families(invite_code);

-- Index for realtime subscriptions (if used)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_created ON transactions(user_id, date DESC, created_at);

COMMENT ON INDEX idx_transactions_user_date IS 'Fast filtering by user and date sorting';
COMMENT ON INDEX idx_transactions_user_category IS 'Fast filtering by user and category';
COMMENT ON INDEX idx_goals_user_deadline IS 'Fast sorting by deadline for goal progress';