-- ============================================
-- FIX: Allow users to see their own data + family data
-- Users NEVER lose access to their historical data
-- ============================================

-- Transactions: User's own OR family's transactions
DROP POLICY IF EXISTS "Users can access own transactions" ON transactions;
CREATE POLICY "Users can access transactions" ON transactions
  FOR ALL USING (
    user_id = auth.uid() 
    OR 
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- Goals: User's own OR family's goals
DROP POLICY IF EXISTS "Users can access own goals" ON goals;
CREATE POLICY "Users can access goals" ON goals
  FOR ALL USING (
    user_id = auth.uid() 
    OR 
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- Budgets: Keep as user-only (budgets are personal)
-- No change needed - budgets remain personal to user
