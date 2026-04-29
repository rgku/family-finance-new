-- ============================================
-- Add missing plain_* columns to goals table
-- ============================================

-- Add plain_target_amount if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'plain_target_amount'
  ) THEN
    ALTER TABLE goals ADD COLUMN plain_target_amount DECIMAL(12, 2) DEFAULT 0;
  END IF;
END $$;

-- Add plain_current_amount if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'goals' AND column_name = 'plain_current_amount'
  ) THEN
    ALTER TABLE goals ADD COLUMN plain_current_amount DECIMAL(12, 2) DEFAULT 0;
  END IF;
END $$;

-- Drop old view
DROP VIEW IF EXISTS goals_decrypted CASCADE;

-- Recreate view with plain_* columns
CREATE OR REPLACE VIEW goals_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  name,
  COALESCE(NULLIF(encrypted_target_amount, '')::DECIMAL(12, 2), plain_target_amount, 0) AS target_amount,
  COALESCE(NULLIF(encrypted_current_amount, '')::DECIMAL(12, 2), plain_current_amount, 0) AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at,
  last_contribution_date
FROM goals;

-- Recreate encrypt functions if they don't exist
CREATE OR REPLACE FUNCTION encrypt_goal_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plain_target_amount IS NOT NULL THEN
    NEW.encrypted_target_amount := encrypt_amount(NEW.plain_target_amount);
  END IF;
  IF NEW.plain_current_amount IS NOT NULL THEN
    NEW.encrypted_current_amount := encrypt_amount(NEW.plain_current_amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION encrypt_goal_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plain_target_amount IS DISTINCT FROM OLD.plain_target_amount THEN
    NEW.encrypted_target_amount := encrypt_amount(NEW.plain_target_amount);
  END IF;
  IF NEW.plain_current_amount IS DISTINCT FROM OLD.plain_current_amount THEN
    NEW.encrypted_current_amount := encrypt_amount(NEW.plain_current_amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS trg_encrypt_goal_insert ON goals;
CREATE TRIGGER trg_encrypt_goal_insert
  BEFORE INSERT ON goals
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_goal_insert();

DROP TRIGGER IF EXISTS trg_encrypt_goal_update ON goals;
CREATE TRIGGER trg_encrypt_goal_update
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_goal_update();

-- Verify
SELECT 'Migration completed!' AS status, COUNT(*) AS total_goals FROM goals;
