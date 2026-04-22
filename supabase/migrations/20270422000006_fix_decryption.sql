-- ============================================
-- FIX DECRYPTION FUNCTIONS
-- Remove newlines before decoding
-- ============================================

CREATE OR REPLACE FUNCTION decrypt_amount(value TEXT)
RETURNS DECIMAL AS $$
DECLARE
  clean_value TEXT;
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  RETURN pgp_sym_decrypt(
    decode(clean_value, 'base64'),
    'REMOVED_FALLBACK_KEY'
  )::DECIMAL;
EXCEPTION WHEN OTHERS THEN
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_text(value TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_value TEXT;
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  RETURN pgp_sym_decrypt(
    decode(clean_value, 'base64'),
    'REMOVED_FALLBACK_KEY'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test
SELECT 
  decrypt_amount(encrypted_amount) AS amount,
  decrypt_text(encrypted_description) AS description
FROM transactions
LIMIT 5;
