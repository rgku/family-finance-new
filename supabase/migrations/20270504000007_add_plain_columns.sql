-- ============================================
-- MIGRATION: Adicionar colunas plain para dados descriptados
-- ============================================

-- Adicionar colunas plain na tabela transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS plain_description TEXT,
ADD COLUMN IF NOT EXISTS plain_amount DECIMAL(12,2);

-- Adicionar colunas plain na tabela goals
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS plain_target_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS plain_current_amount DECIMAL(12,2);

-- Migrar dados encriptados para colunas plain usando a chave antiga
UPDATE transactions 
SET plain_description = encrypted_description, 
    plain_amount = CASE 
      WHEN encrypted_amount ~ '^[0-9.]+$' THEN encrypted_amount::DECIMAL 
      ELSE 0 
    END
WHERE plain_description IS NULL AND encrypted_description IS NOT NULL;

UPDATE goals 
SET plain_target_amount = CASE 
    WHEN encrypted_target_amount ~ '^[0-9.]+$' THEN encrypted_target_amount::DECIMAL 
    ELSE 0 
  END,
  plain_current_amount = CASE 
    WHEN encrypted_current_amount ~ '^[0-9.]+$' THEN encrypted_current_amount::DECIMAL 
    ELSE 0 
  END
WHERE plain_target_amount IS NULL;

-- Permitir NULL nas colunas encrypted (agora são legacy)
ALTER TABLE transactions ALTER COLUMN encrypted_description DROP NOT NULL;
ALTER TABLE transactions ALTER COLUMN encrypted_amount DROP NOT NULL;
ALTER TABLE goals ALTER COLUMN encrypted_target_amount DROP NOT NULL;
ALTER TABLE goals ALTER COLUMN encrypted_current_amount DROP NOT NULL;

-- Verificar resultado
SELECT 'Transactions:' as table_name, count(*) as total, 
       count(plain_description) as with_plain 
FROM transactions;
SELECT 'Goals:' as table_name, count(*) as total,
       count(plain_target_amount) as with_plain 
FROM goals;