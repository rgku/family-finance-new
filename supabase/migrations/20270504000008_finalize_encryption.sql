-- ============================================
-- FINALIZE ENCRYPTION MIGRATION
-- Execute in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Corrigir função notify_budget_threshold()
-- Usar transactions_decrypted em vez de transactions
-- ============================================
-- Primeiro dropar o trigger (depende da função)
DROP TRIGGER IF EXISTS on_budget_threshold ON budgets;
DROP FUNCTION IF EXISTS notify_budget_threshold();

CREATE OR REPLACE FUNCTION notify_budget_threshold()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_spent DECIMAL(12,2);
  v_percent INTEGER;
  v_month_start DATE;
  v_month_end DATE;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id FROM budgets WHERE id = NEW.id;
  
  -- Calculate month start and end
  v_month_start := DATE_TRUNC('month', NEW.month);
  v_month_end := (DATE_TRUNC('month', NEW.month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Calculate spent from transactions_decrypted for this category and month
  SELECT COALESCE(SUM(amount), 0) INTO v_spent
  FROM transactions_decrypted
  WHERE user_id = v_user_id
    AND type = 'expense'
    AND category = NEW.category
    AND DATE(date) BETWEEN v_month_start AND v_month_end;
  
  -- Calculate percentage
  v_percent := ROUND((v_spent / NULLIF(NEW.limit_amount, 0)) * 100);
  
  -- Notify at 80%
  IF v_percent >= 80 AND v_percent < 100 THEN
    PERFORM create_notification(
      v_user_id,
      'Orçamento quase esgotado',
      FORMAT('Atingiste %d%% do orçamento para %s', v_percent, NEW.category),
      '/dashboard/budgets',
      'budget_80_percent'
    );
  END IF;
  
  -- Notify at 100%
  IF v_percent >= 100 THEN
    PERFORM create_notification(
      v_user_id,
      'Orçamento esgotado!',
      FORMAT('Ultrapassaste o limite do orçamento para %s (%d%%)', NEW.category, v_percent),
      '/dashboard/budgets',
      'budget_100_percent'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Migrar dados de plain_* para encrypted_* em transactions
-- Usar funções de encriptação com NOVA CHAVE
-- ============================================

-- Atualizar encrypted_description a partir de plain_description
-- NOT NULL check removido para forçar migração de todos os registos
UPDATE transactions
SET encrypted_description = encrypt_text(plain_description)
WHERE plain_description IS NOT NULL;

-- Atualizar encrypted_amount a partir de plain_amount
UPDATE transactions
SET encrypted_amount = encrypt_amount(plain_amount)
WHERE plain_amount IS NOT NULL;

-- Verificar migração de transactions
SELECT 
  'transactions' AS table_name,
  COUNT(*) AS total,
  COUNT(encrypted_description) AS with_encrypted_desc,
  COUNT(encrypted_amount) AS with_encrypted_amt
FROM transactions;

-- ============================================
-- 3. Migrar dados de plain_* para encrypted_* em goals
-- Usar funções de encriptação com NOVA CHAVE
-- ============================================

-- Atualizar encrypted_target_amount a partir de plain_target_amount
UPDATE goals
SET encrypted_target_amount = encrypt_amount(plain_target_amount)
WHERE plain_target_amount IS NOT NULL;

-- Atualizar encrypted_current_amount a partir de plain_current_amount
UPDATE goals
SET encrypted_current_amount = encrypt_amount(plain_current_amount)
WHERE plain_current_amount IS NOT NULL;

-- Verificar migração de goals
SELECT 
  'goals' AS table_name,
  COUNT(*) AS total,
  COUNT(encrypted_target_amount) AS with_encrypted_target,
  COUNT(encrypted_current_amount) AS with_encrypted_current
FROM goals;

-- ============================================
-- 4. Recriar view transactions_decrypted
-- Usar COALESCE: preferir encrypted desencriptado, senão plain
-- ============================================
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
FROM transactions;

-- ============================================
-- 5. Recriar view goals_decrypted
-- Usar COALESCE: preferir encrypted desencriptado, senão plain
-- ============================================
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
FROM goals;

-- ============================================
-- 6. Verificações finais
-- ============================================

-- Testar desencriptação nas transactions
SELECT 
  'Test decrypt transactions' AS test,
  decrypt_amount(encrypt_amount(123.45)) AS amount_test,
  decrypt_text(encrypt_text('Test Description')) AS text_test;

-- Verificar que a view está a funcionar
SELECT 
  'View transactions_decrypted' AS test,
  COUNT(*) AS row_count
FROM transactions_decrypted
LIMIT 1;

-- Verificar que a view goals_decrypted está a funcionar
SELECT 
  'View goals_decrypted' AS test,
  COUNT(*) AS row_count
FROM goals_decrypted
LIMIT 1;

-- Verificar trigger existe
SELECT 
  'Trigger notify_budget_threshold' AS test,
  tgname AS trigger_name,
  tgfoid::regprocedure AS function_name
FROM pg_trigger
WHERE tgname = 'on_budget_threshold';

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================