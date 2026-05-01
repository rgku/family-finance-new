-- ============================================
-- FIX FAMILY DATA VISIBILITY
-- Allow family members to see each other's data
-- Execute in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Fix Transactions RLS Policy
-- ============================================
DROP POLICY IF EXISTS "Users can access own transactions" ON transactions;

CREATE POLICY "Family members can access family transactions" ON transactions
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- ============================================
-- 2. Fix Goals RLS Policy
-- ============================================
DROP POLICY IF EXISTS "Users can access own goals" ON goals;

CREATE POLICY "Family members can access family goals" ON goals
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- ============================================
-- 3. Fix Budgets RLS Policy
-- ============================================
DROP POLICY IF EXISTS "Users can access own budgets" ON budgets;

CREATE POLICY "Family members can access family budgets" ON budgets
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- ============================================
-- 4. Fix Budget Alerts RLS Policy (optional - alerts are user-specific)
-- Keep as is since alerts are personal notifications
-- ============================================

-- ============================================
-- VERIFICATION
-- ============================================
-- Check policies were created correctly
SELECT 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename IN ('transactions', 'goals', 'budgets')
ORDER BY tablename, policyname;
