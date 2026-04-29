-- ============================================
-- Fix goals table - Complete schema repair
-- ============================================

-- 1. Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trg_encrypt_goal_insert ON goals;
DROP TRIGGER IF EXISTS trg_encrypt_goal_update ON goals;
DROP FUNCTION IF EXISTS encrypt_goal_insert() CASCADE;
DROP FUNCTION IF EXISTS encrypt_goal_update() CASCADE;

-- 2. Drop old columns if they exist (clean slate)
ALTER TABLE goals DROP COLUMN IF EXISTS target_amount;
ALTER TABLE goals DROP COLUMN IF EXISTS current_amount;
ALTER TABLE goals DROP COLUMN IF EXISTS encrypted_target_amount;
ALTER TABLE goals DROP COLUMN IF EXISTS encrypted_current_amount;
ALTER TABLE goals DROP COLUMN IF EXISTS plain_target_amount;
ALTER TABLE goals DROP COLUMN IF EXISTS plain_current_amount;

-- 3. Recreate columns with correct types
ALTER TABLE goals ADD COLUMN plain_target_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE goals ADD COLUMN plain_current_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE goals ADD COLUMN encrypted_target_amount TEXT;
ALTER TABLE goals ADD COLUMN encrypted_current_amount TEXT;

-- 4. Ensure other columns exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'savings';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT 'savings';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_contribution_date TIMESTAMPTZ;

-- 5. Add check constraint for goal_type
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_goal_type_check;
ALTER TABLE goals ADD CONSTRAINT goals_goal_type_check CHECK (goal_type IN ('savings', 'expense'));

-- 6. Recreate view
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

-- 7. Recreate encrypt functions
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

-- 8. Recreate triggers
CREATE TRIGGER trg_encrypt_goal_insert
  BEFORE INSERT ON goals
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_goal_insert();

CREATE TRIGGER trg_encrypt_goal_update
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_goal_update();

-- 9. Test the view
SELECT 
  'View goals_decrypted created successfully' AS status,
  COUNT(*) AS row_count
FROM goals_decrypted;

-- 10. Test insert
INSERT INTO goals (user_id, name, plain_target_amount, plain_current_amount, icon, goal_type)
VALUES (auth.uid(), 'Test Goal', 1000, 0, 'savings', 'savings');

SELECT 
  'Test insert' AS status,
  id,
  name,
  target_amount,
  current_amount
FROM goals_decrypted
WHERE name = 'Test Goal';

-- Clean up test
DELETE FROM goals WHERE name = 'Test Goal';
