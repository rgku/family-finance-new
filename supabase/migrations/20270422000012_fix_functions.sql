-- ============================================
-- FIX: Recreate missing functions
-- ============================================

-- 1. Create encrypt_amount function (accepts TEXT, returns TEXT)
CREATE OR REPLACE FUNCTION encrypt_amount(value TEXT)
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

-- 2. Create decrypt_amount function (returns DECIMAL, takes TEXT)
-- Accepts both encrypted base64 OR plain text
CREATE OR REPLACE FUNCTION decrypt_amount(value TEXT)
RETURNS DECIMAL AS $$
DECLARE
  clean_value TEXT;
  key_value TEXT;
  result DECIMAL;
BEGIN
  IF value IS NULL OR value = '' THEN RETURN NULL; END IF;
  
  key_value := COALESCE(
    NULLIF(current_setting('app.encryption_key', true), ''),
    'REMOVED_FALLBACK_KEY'
  );
  
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  
  -- Check if it's a valid base64 encoded PGP message (starts with certain pattern)
  IF clean_value ~* '^[a-zA-Z0-9+/=]+$' AND length(clean_value) > 20 THEN
    -- Try to decrypt as encrypted
    BEGIN
      result := pgp_sym_decrypt(
        decode(clean_value, 'base64'),
        key_value
      )::DECIMAL;
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      -- Fall through to try as plain text
      NULL;
    END;
  END IF;
  
  -- If not encrypted or decryption failed, try as plain number
  BEGIN
    result := clean_value::DECIMAL;
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create encrypt_text function
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

-- 4. Create decrypt_text function
-- Accepts both encrypted base64 OR plain text
CREATE OR REPLACE FUNCTION decrypt_text(value TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_value TEXT;
  key_value TEXT;
  result TEXT;
BEGIN
  IF value IS NULL OR value = '' THEN RETURN NULL; END IF;
  
  key_value := COALESCE(
    NULLIF(current_setting('app.encryption_key', true), ''),
    'REMOVED_FALLBACK_KEY'
  );
  
  clean_value := replace(replace(value, E'\n', ''), E'\r', '');
  
  -- Check if it's a valid base64 encoded PGP message
  IF clean_value ~* '^[a-zA-Z0-9+/=]+$' AND length(clean_value) > 20 THEN
    BEGIN
      result := pgp_sym_decrypt(
        decode(clean_value, 'base64'),
        key_value
      );
      RETURN result;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  
  -- Return as plain text
  RETURN clean_value;
EXCEPTION WHEN OTHERS THEN
  RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create add_goal_contribution function
CREATE OR REPLACE FUNCTION add_goal_contribution(
  p_goal_id UUID,
  p_amount DECIMAL
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_current DECIMAL;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be a positive number';
  END IF;
  
  -- Get current goal info
  SELECT user_id, decrypt_amount(encrypted_current_amount)::DECIMAL
  INTO v_user_id, v_current
  FROM goals 
  WHERE id = p_goal_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;
  
  -- Insert contribution record
  INSERT INTO goal_contributions (goal_id, user_id, amount, contribution_date, month)
  VALUES (
    p_goal_id, 
    v_user_id, 
    p_amount, 
    CURRENT_DATE, 
    DATE_TRUNC('month', CURRENT_DATE)
  );
  
  -- Update goal current_amount and last_contribution_date
  UPDATE goals 
  SET 
    encrypted_current_amount = encrypt_amount((v_current + p_amount)::TEXT),
    last_contribution_date = NOW()
  WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Test functions
SELECT 
  'encrypt_amount(100)=' || encrypt_amount(100) AS test1,
  'decrypt_amount=' || decrypt_amount(encrypt_amount(100)) AS test2,
  'encrypt_text=test=' || encrypt_text('hello') AS test3,
  'decrypt_text=' || decrypt_text(encrypt_text('hello')) AS test4;