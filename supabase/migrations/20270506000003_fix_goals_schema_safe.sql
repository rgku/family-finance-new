-- ============================================
-- Fix goals table - SAFE migration with data backup
-- ============================================

-- 1. Create temporary backup table with ALL data
CREATE TEMP TABLE goals_backup AS
SELECT * FROM goals;

-- 2. Drop view first (depends on columns)
DROP VIEW IF EXISTS goals_decrypted CASCADE;

-- 3. Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trg_encrypt_goal_insert ON goals;
DROP TRIGGER IF EXISTS trg_encrypt_goal_update ON goals;
DROP FUNCTION IF EXISTS encrypt_goal_insert() CASCADE;
DROP FUNCTION IF EXISTS encrypt_goal_update() CASCADE;

-- 4. Drop old columns (data is backed up)
ALTER TABLE goals DROP COLUMN IF EXISTS target_amount CASCADE;
ALTER TABLE goals DROP COLUMN IF EXISTS current_amount CASCADE;
ALTER TABLE goals DROP COLUMN IF EXISTS encrypted_target_amount CASCADE;
ALTER TABLE goals DROP COLUMN IF EXISTS encrypted_current_amount CASCADE;
ALTER TABLE goals DROP COLUMN IF EXISTS plain_target_amount CASCADE;
ALTER TABLE goals DROP COLUMN IF EXISTS plain_current_amount CASCADE;

-- 5. Recreate columns with correct types
ALTER TABLE goals ADD COLUMN plain_target_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE goals ADD COLUMN plain_current_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE goals ADD COLUMN encrypted_target_amount TEXT;
ALTER TABLE goals ADD COLUMN encrypted_current_amount TEXT;

-- 6. Ensure other columns exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'savings';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'savings';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_contribution_date TIMESTAMPTZ;

-- 7. Restore data from backup
-- Copy old target_amount to plain_target_amount
UPDATE goals g
SET plain_target_amount = COALESCE(b.target_amount, b.plain_target_amount, 0)
FROM goals_backup b
WHERE g.id = b.id;

-- Copy old current_amount to plain_current_amount
UPDATE goals g
SET plain_current_amount = COALESCE(b.current_amount, b.plain_current_amount, 0)
FROM goals_backup b
WHERE g.id = b.id;

-- Copy other fields from backup
UPDATE goals g
SET 
  icon = COALESCE(b.icon, 'savings'),
  goal_type = COALESCE(b.goal_type, 'savings'),
  last_contribution_date = b.last_contribution_date
FROM goals_backup b
WHERE g.id = b.id;

-- 8. Add check constraint for goal_type
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;
ALTER TABLE goals ADD CONSTRAINT goals_goal_type_check CHECK (goal_type IN ('savings', 'expense'));

-- 9. Recreate view
CREATE OR REPLACE VIEW goals_decrypted AS
SELECT 
  id,
  user_id,
  family_id,
  name,
  COALESCE(
    NULLIF(encrypted_target_amount, '')::DECIMAL(12, 2),
    plain_target_amount,
    0
  ) AS target_amount,
  COALESCE(
    NULLIF(encrypted_current_amount, '')::DECIMAL(12, 2),
    plain_current_amount,
    0
  ) AS current_amount,
  deadline,
  icon,
  goal_type,
  created_at,
  last_contribution_date
FROM goals;

-- 10. Recreate encrypt functions
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

-- 11. Recreate triggers
CREATE TRIGGER trg_encrypt_goal_insert
  BEFORE INSERT ON goals
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_goal_insert();

CREATE TRIGGER trg_encrypt_goal_update
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_goal_update();

-- 12. Verify data was preserved
SELECT 
  'Migration completed successfully!' AS status,
  (SELECT COUNT(*) FROM goals) AS total_goals,
  (SELECT COUNT(*) FROM goals_backup) AS backed_up_goals;

-- 13. Show sample data to verify
SELECT 
  'Sample data verification' AS test,
  id,
  name,
  plain_target_amount,
  plain_current_amount,
  icon,
  goal_type
FROM goals
LIMIT 5;

-- 14. Clean up temp table (auto-dropped on session end anyway)
DROP TABLE IF EXISTS goals_backup;
