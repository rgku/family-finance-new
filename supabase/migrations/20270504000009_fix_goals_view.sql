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
  target_amount,
  COALESCE(current_amount::numeric, 0)::numeric AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at,
  last_contribution_date
FROM goals;