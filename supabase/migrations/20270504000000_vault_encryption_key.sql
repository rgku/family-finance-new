-- ============================================
-- MIGRATION: Update Encryption Key to Production
-- Execute in Supabase SQL Editor
-- ============================================

-- Recriar encrypt_amount com nova chave
CREATE OR REPLACE FUNCTION encrypt_amount(value DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  RETURN replace(
    encode(pgp_sym_encrypt(value::TEXT, 'EvdeXBMcg9l1iOFjFzBz9ovTFeGW0Hbw8pWIyfezBOk='), 'base64'),
    E'\n', ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar decrypt_amount com nova chave
CREATE OR REPLACE FUNCTION decrypt_amount(value TEXT)
RETURNS DECIMAL AS $$
DECLARE
  clean_value TEXT;
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  RETURN pgp_sym_decrypt(decode(clean_value, 'base64'), 'EvdeXBMcg9l1iOFjFzBz9ovTFeGW0Hbw8pWIyfezBOk=')::DECIMAL;
EXCEPTION WHEN OTHERS THEN RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar encrypt_text com nova chave
CREATE OR REPLACE FUNCTION encrypt_text(value TEXT)
RETURNS TEXT AS $$
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  RETURN replace(
    encode(pgp_sym_encrypt(value, 'EvdeXBMcg9l1iOFjFzBz9ovTFeGW0Hbw8pWIyfezBOk='), 'base64'),
    E'\n', ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar decrypt_text com nova chave
CREATE OR REPLACE FUNCTION decrypt_text(value TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_value TEXT;
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  RETURN pgp_sym_decrypt(decode(clean_value, 'base64'), 'EvdeXBMcg9l1iOFjFzBz9ovTFeGW0Hbw8pWIyfezBOk=');
EXCEPTION WHEN OTHERS THEN RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar
SELECT 
  'Teste OK' AS status,
  decrypt_amount(encrypt_amount(100)) AS amount_test,
  decrypt_text(encrypt_text('Olá Mundo')) AS text_test;