-- ============================================
-- MIGRATION: RLS - Family data sharing policies
-- Fixes: Goals and transactions visible only to owner, not family
-- ============================================

-- ============================================
-- 1. Update Goals RLS for family sharing
-- ============================================

-- Goals: Allow family members to view each other's goals
DROP POLICY IF EXISTS "Users can access own goals" ON goals;
CREATE POLICY "Users can access own goals" ON goals
  FOR SELECT USING (
    user_id = auth.uid() 
    OR family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- Goals: Only owner can insert their own
DROP POLICY IF EXISTS "Users can insert goals" ON goals;
CREATE POLICY "Users can insert goals" ON goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Goals: Only owner can update their own
DROP POLICY IF EXISTS "Users can update goals" ON goals;
CREATE POLICY "Users can update goals" ON goals
  FOR UPDATE USING (user_id = auth.uid());

-- Goals: Only owner can delete their own
DROP POLICY IF EXISTS "Users can delete goals" ON goals;
CREATE POLICY "Users can delete goals" ON goals
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 2. Update Transactions RLS for family sharing (optional)
-- ============================================

-- Transactions: Allow family members to view each other's transactions
-- (Currently already set to user only, but can enable family sharing if desired)
DROP POLICY IF EXISTS "Users can access own transactions" ON transactions;
CREATE POLICY "Users can access own transactions" ON transactions
  FOR ALL USING (
    user_id = auth.uid() 
    OR family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- 3. Update Budgets RLS for family sharing
-- ============================================

-- Budgets: Allow family members to view each other's budgets
DROP POLICY IF EXISTS "Users can access own budgets" ON budgets;
CREATE POLICY "Users can access own budgets" ON budgets
  FOR SELECT USING (
    user_id = auth.uid() 
    OR family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- Budgets: Only owner can insert/update/delete
DROP POLICY IF EXISTS "Users can insert budgets" ON budgets;
CREATE POLICY "Users can insert budgets" ON budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update budgets" ON budgets;
CREATE POLICY "Users can update budgets" ON budgets
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete budgets" ON budgets;
CREATE POLICY "Users can delete budgets" ON budgets
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 4. Update Budget Alerts RLS for family sharing
-- ============================================

-- Budget alerts: Allow family members to view
DROP POLICY IF EXISTS "Users can access own alerts" ON budget_alerts;
CREATE POLICY "Users can access own alerts" ON budget_alerts
  FOR SELECT USING (
    user_id = auth.uid() 
    OR family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- Budget alerts: Only owner can insert/update/delete
DROP POLICY IF EXISTS "Users can insert budget alerts" ON budget_alerts;
CREATE POLICY "Users can insert budget alerts" ON budget_alerts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update budget alerts" ON budget_alerts;
CREATE POLICY "Users can update budget alerts" ON budget_alerts
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete budget alerts" ON budget_alerts;
CREATE POLICY "Users can delete budget alerts" ON budget_alerts
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 5. Update goal_contributions RLS for family sharing (if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_contributions') THEN
    DROP POLICY IF EXISTS "Users can access own goal contributions" ON goal_contributions;
    CREATE POLICY "Users can access own goal contributions" ON goal_contributions
      FOR SELECT USING (
        user_id = auth.uid() 
        OR family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
      );
    
    DROP POLICY IF EXISTS "Users can insert goal contributions" ON goal_contributions;
    CREATE POLICY "Users can insert goal contributions" ON goal_contributions
      FOR INSERT WITH CHECK (user_id = auth.uid());
    
    DROP POLICY IF EXISTS "Users can delete goal contributions" ON goal_contributions;
    CREATE POLICY "Users can delete goal contributions" ON goal_contributions
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- 6. Verify RLS is working
-- ============================================
-- SELECT * FROM information_schema.table_privileges WHERE table_name IN ('goals', 'transactions', 'budgets');

-- ============================================
-- NOTE: If you want to keep transactions private (each member sees only their own)
-- then revert the transactions policy to:
-- CREATE POLICY "Users can access own transactions" ON transactions
--   FOR ALL USING (user_id = auth.uid());
-- ============================================