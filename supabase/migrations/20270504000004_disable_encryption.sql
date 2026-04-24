-- ============================================
-- MIGRATION: Desativar encriptação e usar dados em claro
-- Resolve problema de mismatch de chaves
-- ============================================

-- 1. Adicionar colunas plain (se não existirem)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS plain_amount DECIMAL(12, 2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS plain_description TEXT;

ALTER TABLE goals ADD COLUMN IF NOT EXISTS plain_target_amount DECIMAL(12, 2);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS plain_current_amount DECIMAL(12, 2);

-- 2. Migração de transactions
-- Atualizar plain_amount: usar encrypted_amount se for número, ou descriptar
DO $$
DECLARE
  rec RECORD;
  decrypted_amount DECIMAL;
  decrypted_desc TEXT;
BEGIN
  FOR rec IN SELECT id, encrypted_amount, encrypted_description FROM transactions LOOP
    BEGIN
      -- Tentar descriptar se começar com 'ww0E' (formato encriptado)
      IF rec.encrypted_amount LIKE 'ww0E%' THEN
        decrypted_amount := decrypt_amount(rec.encrypted_amount::TEXT);
        decrypted_desc := decrypt_text(rec.encrypted_description::TEXT);
      ELSE
        -- Já é valor plain
        decrypted_amount := rec.encrypted_amount::DECIMAL;
        decrypted_desc := rec.encrypted_description;
      END IF;
      
      -- Atualizar colunas plain
      UPDATE transactions 
      SET plain_amount = decrypted_amount, 
          plain_description = decrypted_desc
      WHERE id = rec.id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar, tentar usar como valor plain
      UPDATE transactions 
      SET plain_amount = rec.encrypted_amount::DECIMAL,
          plain_description = rec.encrypted_description
      WHERE id = rec.id;
    END;
  END LOOP;
END $$;

-- 3. Migração de goals
DO $$
DECLARE
  rec RECORD;
  decrypted_target DECIMAL;
  decrypted_current DECIMAL;
BEGIN
  FOR rec IN SELECT id, encrypted_target_amount, encrypted_current_amount FROM goals LOOP
    BEGIN
      IF rec.encrypted_target_amount LIKE 'ww0E%' THEN
        decrypted_target := decrypt_amount(rec.encrypted_target_amount::TEXT);
        decrypted_current := decrypt_amount(rec.encrypted_current_amount::TEXT);
      ELSE
        decrypted_target := COALESCE(rec.encrypted_target_amount::DECIMAL, 0);
        decrypted_current := COALESCE(rec.encrypted_current_amount::DECIMAL, 0);
      END IF;
      
      UPDATE goals 
      SET plain_target_amount = decrypted_target,
          plain_current_amount = decrypted_current
      WHERE id = rec.id;
      
    EXCEPTION WHEN OTHERS THEN
      UPDATE goals 
      SET plain_target_amount = COALESCE(rec.encrypted_target_amount::DECIMAL, 0),
          plain_current_amount = COALESCE(rec.encrypted_current_amount::DECIMAL, 0)
      WHERE id = rec.id;
    END;
  END LOOP;
END $$;

-- 4. Verificar resultados
SELECT 
  'transactions' AS table_name,
  COUNT(*) AS total,
  COUNT(plain_amount) AS with_plain_amount
FROM transactions
UNION ALL
SELECT 
  'goals' AS table_name,
  COUNT(*) AS total,
  COUNT(plain_target_amount) AS with_plain_amount
FROM goals;