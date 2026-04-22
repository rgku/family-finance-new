-- ============================================
-- SECURE VIEWS & AUTO-ENCRYPT TRIGGERS
-- Views that auto-decrypt for the app
-- Triggers that auto-encrypt on insert/update
-- ============================================

-- ============================================
-- 1. VIEWS QUE DESENCRIPTAM AUTOMATICAMENTE
-- ============================================

-- View para transactions (desencripta amount e description)
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
FROM transactions;

-- View para goals (desencripta target_amount e current_amount)
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
FROM goals;

-- ============================================
-- 2. TRIGGERS PARA ENCRIPTAR AO INSERIR/ATUALIZAR
-- ============================================

-- Trigger para transactions: encripta ao inserir
CREATE OR REPLACE FUNCTION encrypt_transaction_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.encrypted_description := encrypt_text(NEW.description);
  NEW.encrypted_amount := encrypt_amount(NEW.amount);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_encrypt_transaction_insert ON transactions;
CREATE TRIGGER trg_encrypt_transaction_insert
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_transaction_insert();

-- Trigger para transactions: encripta ao atualizar
CREATE OR REPLACE FUNCTION encrypt_transaction_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.description IS DISTINCT FROM OLD.description THEN
    NEW.encrypted_description := encrypt_text(NEW.description);
  END IF;
  IF NEW.amount IS DISTINCT FROM OLD.amount THEN
    NEW.encrypted_amount := encrypt_amount(NEW.amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_encrypt_transaction_update ON transactions;
CREATE TRIGGER trg_encrypt_transaction_update
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_transaction_update();

-- Trigger para goals: encripta ao inserir
CREATE OR REPLACE FUNCTION encrypt_goal_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.encrypted_target_amount := encrypt_amount(NEW.target_amount);
  NEW.encrypted_current_amount := encrypt_amount(NEW.current_amount);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_encrypt_goal_insert ON goals;
CREATE TRIGGER trg_encrypt_goal_insert
  BEFORE INSERT ON goals
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_goal_insert();

-- Trigger para goals: encripta ao atualizar
CREATE OR REPLACE FUNCTION encrypt_goal_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.target_amount IS DISTINCT FROM OLD.target_amount THEN
    NEW.encrypted_target_amount := encrypt_amount(NEW.target_amount);
  END IF;
  IF NEW.current_amount IS DISTINCT FROM OLD.current_amount THEN
    NEW.encrypted_current_amount := encrypt_amount(NEW.current_amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_encrypt_goal_update ON goals;
CREATE TRIGGER trg_encrypt_goal_update
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_goal_update();