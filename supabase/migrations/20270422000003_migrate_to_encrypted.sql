-- ============================================
-- MIGRATE DATA TO ENCRYPTED COLUMNS
-- Run this AFTER setting the encryption key
-- This migrates existing clear-text data to encrypted columns
-- ============================================

-- IMPORTANT: Make a backup first!
-- Run: CREATE TABLE transactions_backup AS SELECT * FROM transactions;

-- ============================================
-- 1. MIGRATE TRANSACTIONS
-- ============================================

-- Migrate amount to encrypted_amount
UPDATE transactions
SET encrypted_amount = encrypt_amount(amount)
WHERE encrypted_amount IS NULL;

-- Migrate description to encrypted_description
UPDATE transactions
SET encrypted_description = encrypt_text(description)
WHERE encrypted_description IS NULL;

-- Verify migration
SELECT 
  COUNT(*) AS total,
  COUNT(encrypted_amount) AS encrypted_amount,
  COUNT(encrypted_description) AS encrypted_description
FROM transactions;

-- ============================================
-- 2. MIGRATE GOALS
-- ============================================

-- Migrate target_amount to encrypted_target_amount
UPDATE goals
SET encrypted_target_amount = encrypt_amount(target_amount)
WHERE encrypted_target_amount IS NULL;

-- Migrate current_amount to encrypted_current_amount
UPDATE goals
SET encrypted_current_amount = encrypt_amount(current_amount)
WHERE encrypted_current_amount IS NULL;

-- Verify migration
SELECT 
  COUNT(*) AS total,
  COUNT(encrypted_target_amount) AS encrypted_target,
  COUNT(encrypted_current_amount) AS encrypted_current
FROM goals;

-- ============================================
-- 3. MIGRATE FAMILY MEMBERS
-- ============================================

-- Migrate email to masked_email (not encrypted, just masked for display)
UPDATE family_members
SET masked_email = mask_email(email)
WHERE masked_email IS NULL;

-- Verify migration
SELECT 
  COUNT(*) AS total,
  COUNT(masked_email) AS masked_emails
FROM family_members;

-- ============================================
-- 4. VERIFY ALL MIGRATIONS
-- ============================================

-- Check for any records still needing migration
SELECT 
  'transactions' AS table_name,
  COUNT(*) FILTER (WHERE encrypted_amount IS NULL OR encrypted_description IS NULL) AS needs_migration
FROM transactions
UNION ALL
SELECT 
  'goals' AS table_name,
  COUNT(*) FILTER (WHERE encrypted_target_amount IS NULL OR encrypted_current_amount IS NULL) AS needs_migration
FROM goals
UNION ALL
SELECT 
  'family_members' AS table_name,
  COUNT(*) FILTER (WHERE masked_email IS NULL) AS needs_migration
FROM family_members;

-- ============================================
-- 5. CREATE INDEXES FOR ENCRYPTED COLUMNS
-- ============================================

-- Note: You cannot index encrypted columns directly
-- If you need to search, use the encrypted values
CREATE INDEX IF NOT EXISTS idx_transactions_encrypted_family 
  ON transactions(family_id, encrypted_amount) WHERE encrypted_amount IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_goals_encrypted_family 
  ON goals(family_id, encrypted_target_amount) WHERE encrypted_target_amount IS NOT NULL;

-- ============================================
-- 6. ROLLBACK (if needed)
-- ============================================

-- To rollback, restore from backup:
-- INSERT INTO transactions SELECT * FROM transactions_backup;
-- DROP TABLE transactions_backup;