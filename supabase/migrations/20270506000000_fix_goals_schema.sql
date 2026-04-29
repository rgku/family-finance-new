-- ============================================
-- Fix goals table schema for encryption
-- ============================================

-- Add plain_target_amount if not exists
ALTER TABLE goals ADD COLUMN IF NOT EXISTS plain_target_amount DECIMAL(12, 2);

-- Add plain_current_amount if not exists
ALTER TABLE goals ADD COLUMN IF NOT EXISTS plain_current_amount DECIMAL(12, 2);

-- Add encrypted_target_amount if not exists
ALTER TABLE goals ADD COLUMN IF NOT EXISTS encrypted_target_amount TEXT;

-- Add encrypted_current_amount if not exists
ALTER TABLE goals ADD COLUMN IF NOT EXISTS encrypted_current_amount TEXT;

-- Add icon if not exists
ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add goal_type if not exists
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'savings' CHECK (goal_type IN ('savings', 'expense'));

-- Add last_contribution_date if not exists
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_contribution_date TIMESTAMPTZ;

-- Copy data from target_amount to plain_target_amount if plain is null
UPDATE goals 
SET plain_target_amount = target_amount 
WHERE plain_target_amount IS NULL AND target_amount IS NOT NULL;

-- Copy data from current_amount to plain_current_amount if plain is null
UPDATE goals 
SET plain_current_amount = current_amount 
WHERE plain_current_amount IS NULL AND current_amount IS NOT NULL;

-- Recreate view to ensure it works
DROP VIEW IF EXISTS goals_decrypted;

CREATE OR REPLACE VIEW goals_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  name,
  COALESCE(
    NULLIF(encrypted_target_amount, '')::DECIMAL(12, 2),
    plain_target_amount,
    target_amount,
    0
  ) AS target_amount,
  COALESCE(
    NULLIF(encrypted_current_amount, '')::DECIMAL(12, 2),
    plain_current_amount,
    current_amount,
    0
  ) AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at,
  last_contribution_date
FROM goals;

-- Verify the view works
SELECT 
  'View goals_decrypted' AS test,
  COUNT(*) AS row_count
FROM goals_decrypted;
