-- ============================================
-- FIX ENCRYPTION FUNCTIONS (no newlines)
-- ============================================

CREATE OR REPLACE FUNCTION encrypt_amount(value DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  RETURN replace(
    encode(
      pgp_sym_encrypt(
        value::TEXT,
        'REMOVED_FALLBACK_KEY'
      ),
      'base64'
    ),
    E'\n', ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION encrypt_text(value TEXT)
RETURNS TEXT AS $$
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  RETURN replace(
    encode(
      pgp_sym_encrypt(
        value,
        'REMOVED_FALLBACK_KEY'
      ),
      'base64'
    ),
    E'\n', ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test encrypt/decrypt roundtrip
SELECT 
  encrypt_amount(100.50) AS encrypted,
  decrypt_amount(encrypt_amount(100.50)) AS decrypted;
