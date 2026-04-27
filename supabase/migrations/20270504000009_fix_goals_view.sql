-- ============================================
-- Fix goals_decrypted view to use plain current_amount column
-- ============================================

DROP VIEW IF EXISTS goals_decrypted;

CREATE OR REPLACE VIEW goals_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  name,
  COALESCE(plain_target_amount, decrypt_amount(encrypted_target_amount), target_amount, 0) AS target_amount,
  COALESCE(plain_current_amount, decrypt_amount(encrypted_current_amount), current_amount, 0) AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at,
  last_contribution_date
FROM goals;