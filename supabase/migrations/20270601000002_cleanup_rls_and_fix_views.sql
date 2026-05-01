-- ============================================
-- CLEANUP RLS POLICIES & FIX VIEWS
-- Remove conflicting policies and make views family-aware
-- ============================================

-- ============================================
-- 1. DROP ALL CONFLICTING POLICIES
-- ============================================

-- Transactions: drop all old/strict policies
DROP POLICY IF EXISTS "Users can access own transactions" ON transactions;
DROP POLICY IF EXISTS "strict_transactions_delete" ON transactions;
DROP POLICY IF EXISTS "strict_transactions_insert" ON transactions;
DROP POLICY IF EXISTS "strict_transactions_update" ON transactions;

-- Goals: drop all old/strict policies
DROP POLICY IF EXISTS "Users can access own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete goals" ON goals;
DROP POLICY IF EXISTS "Users can insert goals" ON goals;
DROP POLICY IF EXISTS "Users can update goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "strict_goals_delete" ON goals;
DROP POLICY IF EXISTS "strict_goals_insert" ON goals;
DROP POLICY IF EXISTS "strict_goals_update" ON goals;

-- Budgets: drop all old/strict policies
DROP POLICY IF EXISTS "Users can access own budgets" ON budgets;
DROP POLICY IF EXISTS "Owners can access their budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update budgets" ON budgets;
DROP POLICY IF EXISTS "strict_budgets_delete" ON budgets;
DROP POLICY IF EXISTS "strict_budgets_insert" ON budgets;
DROP POLICY IF EXISTS "strict_budgets_update" ON budgets;

-- ============================================
-- 2. RE-CREATE CLEAN FAMILY-BASED POLICIES
-- ============================================

-- Transactions: allow all operations for family members
DROP POLICY IF EXISTS "Family members can access family transactions" ON transactions;
CREATE POLICY "Family members can access family transactions" ON transactions
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- Goals: allow all operations for family members
DROP POLICY IF EXISTS "Family members can access family goals" ON goals;
CREATE POLICY "Family members can access family goals" ON goals
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- Budgets: allow all operations for family members
DROP POLICY IF EXISTS "Family members can access family budgets" ON budgets;
CREATE POLICY "Family members can access family budgets" ON budgets
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL)
  );

-- ============================================
-- 3. FIX VIEWS TO ENFORCE FAMILY FILTERING
-- Views bypass RLS, so add explicit family filter using auth.uid()
-- ============================================

-- Fix transactions_decrypted view
DROP VIEW IF EXISTS transactions_decrypted;
CREATE OR REPLACE VIEW transactions_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  COALESCE(decrypt_text(encrypted_description), plain_description, '') AS description,
  COALESCE(decrypt_amount(encrypted_amount), plain_amount, 0) AS amount,
  type,
  category,
  date,
  created_at
FROM transactions
WHERE family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL);

-- Fix goals_decrypted view
DROP VIEW IF EXISTS goals_decrypted;
CREATE OR REPLACE VIEW goals_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  name,
  COALESCE(decrypt_amount(encrypted_target_amount), plain_target_amount, 0) AS target_amount,
  COALESCE(decrypt_amount(encrypted_current_amount), plain_current_amount, 0) AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at
FROM goals
WHERE family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid() AND family_id IS NOT NULL);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  tablename, 
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename IN ('transactions', 'goals', 'budgets')
ORDER BY tablename;

-- Check views are filtering correctly (should return only family data)
SELECT 'transactions_decrypted' AS view_name, COUNT(*) AS row_count FROM transactions_decrypted;
SELECT 'goals_decrypted' AS view_name, COUNT(*) AS row_count FROM goals_decrypted;
