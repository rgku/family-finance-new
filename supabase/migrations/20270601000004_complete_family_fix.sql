-- ============================================
-- COMPLETE FAMILY DATA VISIBILITY FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. DROP ALL CONFLICTING POLICIES
-- ============================================

-- Transactions
DROP POLICY IF EXISTS "Users can access own transactions" ON transactions;
DROP POLICY IF EXISTS "strict_transactions_delete" ON transactions;
DROP POLICY IF EXISTS "strict_transactions_insert" ON transactions;
DROP POLICY IF EXISTS "strict_transactions_update" ON transactions;
DROP POLICY IF EXISTS "Family members can access family transactions" ON transactions;

-- Goals
DROP POLICY IF EXISTS "Users can access own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete goals" ON goals;
DROP POLICY IF EXISTS "Users can insert goals" ON goals;
DROP POLICY IF EXISTS "Users can update goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "strict_goals_delete" ON goals;
DROP POLICY IF EXISTS "strict_goals_insert" ON goals;
DROP POLICY IF EXISTS "strict_goals_update" ON goals;
DROP POLICY IF EXISTS "Family members can access family goals" ON goals;

-- Budgets
DROP POLICY IF EXISTS "Users can access own budgets" ON budgets;
DROP POLICY IF EXISTS "Owners can access their budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update budgets" ON budgets;
DROP POLICY IF EXISTS "strict_budgets_delete" ON budgets;
DROP POLICY IF EXISTS "strict_budgets_insert" ON budgets;
DROP POLICY IF EXISTS "strict_budgets_update" ON budgets;
DROP POLICY IF EXISTS "Family members can access family budgets" ON budgets;

-- ============================================
-- 2. CREATE CLEAN FAMILY-BASED POLICIES
-- ============================================

CREATE POLICY "Family members can access family transactions" ON transactions
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

CREATE POLICY "Family members can access family goals" ON goals
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

CREATE POLICY "Family members can access family budgets" ON budgets
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- ============================================
-- 3. FIX VIEWS (without plain columns)
-- ============================================

DROP VIEW IF EXISTS transactions_decrypted;
CREATE OR REPLACE VIEW transactions_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  decrypt_text(encrypted_description) AS description,
  decrypt_amount(encrypted_amount) AS amount,
  type,
  category,
  date,
  created_at
FROM transactions
WHERE family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL);

DROP VIEW IF EXISTS goals_decrypted;
CREATE OR REPLACE VIEW goals_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  name,
  decrypt_amount(encrypted_target_amount) AS target_amount,
  decrypt_amount(encrypted_current_amount) AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at
FROM goals
WHERE family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Policies created:' AS info;
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('transactions', 'goals', 'budgets') 
ORDER BY tablename;

SELECT 'Views fixed:' AS info;
SELECT 'transactions_decrypted' AS view_name, COUNT(*) AS row_count FROM transactions_decrypted;
SELECT 'goals_decrypted' AS view_name, COUNT(*) AS row_count FROM goals_decrypted;
