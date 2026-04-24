-- ============================================
-- MIGRATION: Testar e Migrar dados com chave ANTIGA
-- ============================================

-- 1. Testar descriptação com a chave ORIGINAL (fallback)
DO $$
DECLARE
  test_val TEXT := 'ww0EBwMC8H18F527FEVs0jUBkzsZdJ4D/Ala0jKYyAribz4NcKZtOMzGJjF9C4WDPt3plTOarZdyIoG/Af/oE8JggIJEiA==';
  decrypted_val TEXT;
BEGIN
  decrypted_val := pgp_sym_decrypt(
    decode(replace(replace(test_val, E'\n', ''), E'\r', ''), 'base64'),
    'famflow-dev-encryption-key-2024-change-in-production!!'
  );
  RAISE NOTICE 'TESTE DECRYPT: %', decrypted_val;
END $$;

-- 2. Criar função temporária para descriptar com chave antiga
CREATE OR REPLACE FUNCTION decrypt_with_old_key(value TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_value TEXT;
BEGIN
  IF value IS NULL OR value = '' THEN RETURN NULL; END IF;
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  RETURN pgp_sym_decrypt(decode(clean_value, 'base64'), 'famflow-dev-encryption-key-2024-change-in-production!!');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_amount_old(value TEXT)
RETURNS DECIMAL AS $$
DECLARE
  clean_value TEXT;
BEGIN
  IF value IS NULL OR value = '' THEN RETURN NULL; END IF;
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  RETURN pgp_sym_decrypt(decode(clean_value, 'base64'), 'famflow-dev-encryption-key-2024-change-in-production!!')::DECIMAL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ver quantos dados estão encriptados vs plain
SELECT 
  'Transactions com ww0E (encriptados)' AS status,
  COUNT(*) AS count
FROM transactions 
WHERE encrypted_description LIKE 'ww0E%';

SELECT 
  'Transactions plain' AS status,
  COUNT(*) AS count
FROM transactions 
WHERE encrypted_description NOT LIKE 'ww0E%' 
  AND encrypted_description IS NOT NULL;

-- 4. Fazer update das transações com valor plain
UPDATE transactions 
SET 
  plain_amount = encrypted_amount::DECIMAL,
  plain_description = encrypted_description
WHERE encrypted_amount NOT LIKE 'ww0E%'
  AND plain_amount IS NULL;

-- 5. Fazer update das transações encriptadas (se descriptar funcionar)
UPDATE transactions 
SET 
  plain_amount = decrypt_amount_old(encrypted_amount),
  plain_description = decrypt_with_old_key(encrypted_description)
WHERE encrypted_amount LIKE 'ww0E%'
  AND plain_amount IS NULL;

-- 6. Verificar resultados
SELECT COUNT(*) as migrated_transactions FROM transactions WHERE plain_amount IS NOT NULL;