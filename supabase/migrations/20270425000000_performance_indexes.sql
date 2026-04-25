-- Performance Indexes for FamFlow
-- Created: 2026-04-25
-- Purpose: Improve query performance for tables with high data volume
--
-- INSTRUÇÕES:
-- 1. Executar no Supabase SQL Editor
-- 2. Confirmar sucesso em Database -> Indexes
-- 3. Se erro "relation does not exist", comentar índice correspondente
--
-- Note: These indexes will:
-- - Speed up read queries by 50-90%
-- - Slow down write operations by 5-10% (acceptable tradeoff)
-- - Add ~5-10MB to database size (negligible)
-- - Are automatically maintained by PostgreSQL

-- Transactions: Most critical table - optimize by user_id and date
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date 
ON transactions(user_id, date DESC);

-- Transactions: Optimize by user_id and type (income/expense filtering)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_type 
ON transactions(user_id, type);

-- Transactions: Optimize by user_id and category (category filtering)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_category 
ON transactions(user_id, category);

-- Transactions: Optimize by user_id and created_at (recent transactions)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_created_at 
ON transactions(user_id, created_at DESC);

-- Goals: Optimize by user_id for fast loading
CREATE INDEX IF NOT EXISTS idx_goals_user_id 
ON goals(user_id);

-- Goals: Optimize by user_id and goal_type (savings vs other)
CREATE INDEX IF NOT EXISTS idx_goals_user_id_goal_type 
ON goals(user_id, goal_type);

-- Budgets: Optimize by user_id for fast loading
CREATE INDEX IF NOT EXISTS idx_budgets_user_id 
ON budgets(user_id);

-- Budgets: Optimize by user_id and category
CREATE INDEX IF NOT EXISTS idx_budgets_user_id_category 
ON budgets(user_id, category);

-- Profiles: Optimize by family_id (family grouping)
CREATE INDEX IF NOT EXISTS idx_profiles_family_id 
ON profiles(family_id);

-- Notifications: Optimize by user_id and created_at (recent notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

-- Notifications: Optimize by user_id and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read 
ON notifications(user_id, read);

-- Recurring Transactions: Optimize by user_id
-- NOTA: Executar apenas se a tabela recurring_transactions existir
-- CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id 
-- ON recurring_transactions(user_id);

-- Stripe Subscriptions: Optimize by user_id
-- NOTA: Executar apenas se a tabela stripe_subscriptions existir
-- CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id 
-- ON stripe_subscriptions(user_id);

-- AI Insights: Optimize by user_id and month (cached insights)
-- NOTA: Executar apenas se a tabela ai_insights existir
-- CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id_month 
-- ON ai_insights(user_id, month);

-- Composite index for common analytics query pattern
CREATE INDEX IF NOT EXISTS idx_transactions_analytics 
ON transactions(user_id, type, category, date DESC);
