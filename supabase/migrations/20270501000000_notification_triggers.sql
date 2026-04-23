-- ============================================
-- NOTIFICATION TRIGGERS MIGRATION
-- ============================================
-- This migration adds database triggers to automatically create in-app notifications
-- 
-- IMPORTANT: Run this AFTER updating the notify_budget_threshold() function
-- in 20270425000000_inapp_notifications.sql
--
-- Execute in Supabase SQL Editor or run:
-- npx supabase db push
-- ============================================

-- ============================================
-- BUDGET ALERTS TRIGGER
-- ============================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_budget_threshold ON budgets;

-- Create trigger for budget thresholds (80% and 100%)
-- Fires when budget is inserted or updated
CREATE TRIGGER on_budget_threshold
  AFTER INSERT OR UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION notify_budget_threshold();

-- ============================================
-- GOAL ACHIEVED TRIGGER  
-- ============================================

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS on_goal_achieved ON goals;

-- Create trigger for goal achieved
-- The function itself checks if the goal was just achieved
CREATE TRIGGER on_goal_achieved
  AFTER INSERT OR UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION notify_goal_achieved();

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this query to verify triggers were created:
-- 
-- SELECT 
--   tgname as trigger_name, 
--   tgrelid::regclass as table_name,
--   tgfoid::regprocedure as function_name
-- FROM pg_trigger
-- WHERE tgname IN ('on_budget_threshold', 'on_goal_achieved');
--
-- Expected output:
-- trigger_name        | table_name | function_name
-- --------------------+------------+------------------------
-- on_budget_threshold | budgets    | notify_budget_threshold()
-- on_goal_achieved    | goals      | notify_goal_achieved()
--
-- ============================================
-- TEST THE TRIGGERS
-- ============================================
-- 
-- Test 1: Budget notification
-- UPDATE budgets SET limit_amount = 100 WHERE id = 'YOUR_BUDGET_ID';
-- Then add a transaction of 80€ in the same category
-- Check: SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;
--
-- Test 2: Goal notification
-- UPDATE goals SET encrypted_current_amount = encrypt_amount('1000')
-- WHERE id = 'YOUR_GOAL_ID' AND encrypted_target_amount = encrypt_amount('1000');
-- Check: SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1;


