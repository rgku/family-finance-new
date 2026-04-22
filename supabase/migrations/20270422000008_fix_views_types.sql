-- ============================================
-- FIX VIEWS - Ensure proper types
-- ============================================

-- Drop and recreate views with explicit type casting
DROP VIEW IF EXISTS transactions_decrypted;
DROP VIEW IF EXISTS goals_decrypted;

CREATE VIEW transactions_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  decrypt_text(encrypted_description)::TEXT AS description,
  decrypt_amount(encrypted_amount)::NUMERIC AS amount,
  type,
  category,
  date,
  created_at
FROM transactions;

CREATE VIEW goals_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  name,
  decrypt_amount(encrypted_target_amount)::NUMERIC AS target_amount,
  decrypt_amount(encrypted_current_amount)::NUMERIC AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at
FROM goals;

-- Test
SELECT 
  amount,
  pg_typeof(amount) AS amount_type,
  description
FROM transactions_decrypted
LIMIT 3;
