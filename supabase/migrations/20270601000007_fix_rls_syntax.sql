-- ============================================
-- FIX RLS POLICIES SYNTAX ERROR
-- Remove extra parentheses that break the policies
-- ============================================

-- 1. Fix transactions policy
DROP POLICY IF EXISTS "Family members can access family transactions" ON transactions;
CREATE POLICY "Family members can access family transactions" ON transactions
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- 2. Fix goals policy  
DROP POLICY IF EXISTS "Family members can access family goals" ON goals;
CREATE POLICY "Family members can access family goals" ON goals
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- 3. Fix budgets policy
DROP POLICY IF EXISTS "Family members can access family budgets" ON budgets;
CREATE POLICY "Family members can access family budgets" ON budgets
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- 4. VERIFY CORRECT POLICIES
SELECT tablename, policyname, qual FROM pg_policies 
WHERE tablename IN ('transactions', 'goals', 'budgets') 
ORDER BY tablename;
