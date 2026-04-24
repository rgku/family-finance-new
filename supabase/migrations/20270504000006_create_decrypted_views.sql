-- ============================================
-- MIGRATION: Criar views para usar dados plain
-- ============================================

-- View para transactions com dados descriptados
CREATE OR REPLACE VIEW transactions_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  COALESCE(plain_description, encrypted_description) AS description,
  COALESCE(plain_amount, encrypted_amount::DECIMAL, 0) AS amount,
  type,
  category,
  date,
  created_at
FROM transactions;

-- View para goals com dados descriptados
CREATE OR REPLACE VIEW goals_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  name,
  COALESCE(plain_target_amount, encrypted_target_amount::DECIMAL, 0) AS target_amount,
  COALESCE(plain_current_amount, encrypted_current_amount::DECIMAL, 0) AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at
FROM goals;

-- Testar
SELECT * FROM transactions_decrypted LIMIT 5;
SELECT * FROM goals_decrypted LIMIT 5;