-- ============================================
-- SECURITY MIGRATION
-- FamFlow Database Security Enhancements
-- Execute this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENABLE PGSQL EXTENSION
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  family_id UUID,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage audit log" ON audit_log;
CREATE POLICY "Admins can manage audit log" ON audit_log
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND profiles.role = 'owner')
  );

-- Indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_family ON audit_log(family_id, created_at DESC);

-- ============================================
-- 3. ENCRYPTION FUNCTIONS
-- ============================================

-- Generate encryption key (run once and save the key securely!)
-- SELECT pgp_sym_encrypt('secret', current_setting('app.encryption_key', true));

-- Function to encrypt text fields
CREATE OR REPLACE FUNCTION encrypt_text(value TEXT)
RETURNS TEXT AS $$
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  RETURN encode(
    pgp_sym_encrypt(
      value,
      'REMOVED_FALLBACK_KEY'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt text fields
CREATE OR REPLACE FUNCTION decrypt_text(value TEXT)
RETURNS TEXT AS $$
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(
    decode(value, 'base64'),
    'REMOVED_FALLBACK_KEY'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to encrypt numeric amounts
CREATE OR REPLACE FUNCTION encrypt_amount(value DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  RETURN encode(
    pgp_sym_encrypt(
      value::TEXT,
      'REMOVED_FALLBACK_KEY'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt numeric amounts
CREATE OR REPLACE FUNCTION decrypt_amount(value TEXT)
RETURNS DECIMAL AS $$
BEGIN
  IF value IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(
    decode(value, 'base64'),
    'REMOVED_FALLBACK_KEY'
  )::DECIMAL;
EXCEPTION WHEN OTHERS THEN
  RETURN value::DECIMAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. MASKING FUNCTIONS
-- ============================================

-- Function to mask email addresses (j***@gmail.com)
CREATE OR REPLACE FUNCTION mask_email(email TEXT)
RETURNS TEXT AS $$
BEGIN
  IF email IS NULL OR email = '' THEN RETURN NULL; END IF;
  
  IF position('@' in email) > 2 THEN
    RETURN overlay(email placing '***' from 2 for position('@' in email) - 2);
  END IF;
  
  RETURN email;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to mask names (J*** D**)
CREATE OR REPLACE FUNCTION mask_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF name IS NULL OR name = '' THEN RETURN NULL; END IF;
  
  -- Split by space and mask each part
  RETURN array_to_string(
    array_agg(
      upper(substring(part from 1 for 1)) || '***'
    )
  , ' ')
  FROM unnest(string_to_array(name, ' ')) AS part;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to mask phone numbers
CREATE OR REPLACE FUNCTION mask_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  IF phone IS NULL OR phone = '' THEN RETURN NULL; END IF;
  
  -- Keep first 3 and last 2 digits
  RETURN substring(phone, 1, 3) || '****' || substring(phone, length(phone)-1, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 5. ADD ENCRYPTED COLUMNS
-- ============================================

-- Transactions: Add encrypted amount column
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS encrypted_amount TEXT;

-- Transactions: Add encrypted description column
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS encrypted_description TEXT;

-- Goals: Add encrypted amount columns
ALTER TABLE goals ADD COLUMN IF NOT EXISTS encrypted_target_amount TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS encrypted_current_amount TEXT;

-- Family members: Add masked email column
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS masked_email TEXT;

-- ============================================
-- 6. VIEWS WITH MASKED DATA
-- ============================================

-- View for safe transaction access (for admin dashboards)
CREATE OR REPLACE VIEW transactions_safe AS
SELECT 
  id,
  user_id,
  family_id,
  encrypted_description AS description,
  encrypted_amount AS amount,
  type,
  category,
  date,
  created_at
FROM transactions
WHERE user_id = auth.uid();

-- View for safe family members (for member lists)
CREATE OR REPLACE VIEW family_members_safe AS
SELECT 
  id,
  family_id,
  user_id,
  mask_name(name) AS name,
  mask_email(email) AS email,
  role,
  status,
  masked_email,
  created_at
FROM family_members
WHERE family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid());

-- ============================================
-- 7. STRENGTHEN RLS POLICIES
-- ============================================

-- Ensure transaction policies are strict
DROP POLICY IF EXISTS "strict_transactions_insert" ON transactions;
CREATE POLICY "strict_transactions_insert" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "strict_transactions_update" ON transactions;
CREATE POLICY "strict_transactions_update" ON transactions
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "strict_transactions_delete" ON transactions;
CREATE POLICY "strict_transactions_delete" ON transactions
  FOR DELETE USING (user_id = auth.uid());

-- Ensure goal policies are strict
DROP POLICY IF EXISTS "strict_goals_insert" ON goals;
CREATE POLICY "strict_goals_insert" ON goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "strict_goals_update" ON goals;
CREATE POLICY "strict_goals_update" ON goals
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "strict_goals_delete" ON goals;
CREATE POLICY "strict_goals_delete" ON goals
  FOR DELETE USING (user_id = auth.uid());

-- Ensure budget policies are strict
DROP POLICY IF EXISTS "strict_budgets_insert" ON budgets;
CREATE POLICY "strict_budgets_insert" ON budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "strict_budgets_update" ON budgets;
CREATE POLICY "strict_budgets_update" ON budgets
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "strict_budgets_delete" ON budgets;
CREATE POLICY "strict_budgets_delete" ON budgets
  FOR DELETE USING (user_id = auth.uid());

-- Family members: Restrict updates to owners only
DROP POLICY IF EXISTS "strict_family_members_update" ON family_members;
CREATE POLICY "strict_family_members_update" ON family_members
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- 8. SETUP ENCRYPTION KEY (DEVELOPMENT)
-- ============================================

-- For development only - set a default key
-- In production, generate a secure key: openssl rand -base64 32
DO $$
BEGIN
  BEGIN
    PERFORM set_config('app.encryption_key', 'REMOVED_FALLBACK_KEY', false);
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if setting fails (key might be set globally)
    NULL;
  END;
END $$;

-- ============================================
-- 9. AUDIT TRIGGER FUNCTION
-- ============================================

-- Drop triggers first (to allow function recreation)
DROP TRIGGER IF EXISTS audit_transactions ON transactions;
DROP TRIGGER IF EXISTS audit_goals ON goals;
DROP TRIGGER IF EXISTS audit_budgets ON budgets;
DROP TRIGGER IF EXISTS audit_family_members ON family_members;

-- Drop and recreate function
DROP FUNCTION IF EXISTS audit_trigger();

CREATE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id UUID;
BEGIN
  BEGIN
    SELECT family_id INTO v_family_id 
    FROM profiles 
    WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_family_id := NULL;
  END;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (user_id, family_id, table_name, record_id, action, new_values)
    VALUES (auth.uid(), v_family_id, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (user_id, family_id, table_name, record_id, action, old_values, new_values)
    VALUES (auth.uid(), v_family_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (user_id, family_id, table_name, record_id, action, old_values)
    VALUES (auth.uid(), v_family_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. APPLY AUDIT TRIGGERS
-- ============================================

CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_goals
  AFTER INSERT OR UPDATE OR DELETE ON goals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_budgets
  AFTER INSERT OR UPDATE OR DELETE ON budgets
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_family_members
  AFTER INSERT OR UPDATE OR DELETE ON family_members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();