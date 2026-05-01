-- ============================================
-- FIX VIEWS WITHOUT PLAIN COLUMNS
-- Recreate views using only encrypted columns
-- ============================================

-- ============================================
-- 1. Fix transactions_decrypted view
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

-- ============================================
-- 2. Fix goals_decrypted view
-- ============================================
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
SELECT 'transactions_decrypted' AS view_name, COUNT(*) AS row_count FROM transactions_decrypted;
SELECT 'goals_decrypted' AS view_name, COUNT(*) AS row_count FROM goals_decrypted;
