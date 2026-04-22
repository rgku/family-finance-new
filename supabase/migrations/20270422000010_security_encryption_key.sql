-- ============================================
-- MIGRATION: Security - Move encryption key to environment
-- Fixes: Hardcoded encryption key in SQL functions
-- ============================================

-- ============================================
-- Option A: Use current_setting with fallback (for development)
-- ============================================

-- Recreate encrypt functions with environment variable support
CREATE OR REPLACE FUNCTION encrypt_amount(value DECIMAL)
RETURNS TEXT AS $$
DECLARE
  key_value TEXT;
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  
  -- Get key from environment or use fallback
  key_value := COALESCE(
    NULLIF(current_setting('app.encryption_key', true), ''),
    'REMOVED_FALLBACK_KEY'
  );
  
  RETURN replace(
    encode(
      pgp_sym_encrypt(
        value::TEXT,
        key_value
      ),
      'base64'
    ),
    E'\n', ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_amount(value TEXT)
RETURNS DECIMAL AS $$
DECLARE
  clean_value TEXT;
  key_value TEXT;
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  
  key_value := COALESCE(
    NULLIF(current_setting('app.encryption_key', true), ''),
    'REMOVED_FALLBACK_KEY'
  );
  
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  RETURN pgp_sym_decrypt(
    decode(clean_value, 'base64'),
    key_value
  )::DECIMAL;
EXCEPTION WHEN OTHERS THEN
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION encrypt_text(value TEXT)
RETURNS TEXT AS $$
DECLARE
  key_value TEXT;
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  
  key_value := COALESCE(
    NULLIF(current_setting('app.encryption_key', true), ''),
    'REMOVED_FALLBACK_KEY'
  );
  
  RETURN replace(
    encode(
      pgp_sym_encrypt(
        value,
        key_value
      ),
      'base64'
    ),
    E'\n', ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_text(value TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_value TEXT;
  key_value TEXT;
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  
  key_value := COALESCE(
    NULLIF(current_setting('app.encryption_key', true), ''),
    'REMOVED_FALLBACK_KEY'
  );
  
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  RETURN pgp_sym_decrypt(
    decode(clean_value, 'base64'),
    key_value
  );
EXCEPTION WHEN OTHERS THEN
  RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Option B: For production, store key in Supabase Vault
-- Run this in Supabase Dashboard > Database > Vault
-- Or use: SELECT vault.create_secret('your-64-char-key', 'encryption_key');
-- ============================================

-- ============================================
-- Verify functions work
-- ============================================
SELECT 
  encrypt_amount(100) AS test_encrypt,
  decrypt_amount(encrypt_amount(100)) AS test_decrypt;

-- ============================================
-- NOTE FOR PRODUCTION DEPLOYMENT:
-- 1. Generate a secure key: openssl rand -base64 32
-- 2. Store in Supabase: Settings > Database > Vault
-- 3. Or set via environment variable in Supabase dashboard
-- 4. Remove the fallback key in production!
-- ============================================