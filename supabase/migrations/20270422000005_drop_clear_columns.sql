-- ============================================
-- DROP CLEAR-TEXT COLUMNS
-- WARNING: This is irreversible without a backup!
-- ============================================

-- Drop clear-text columns from transactions
ALTER TABLE transactions DROP COLUMN IF EXISTS amount;
ALTER TABLE transactions DROP COLUMN IF EXISTS description;

-- Drop clear-text columns from goals
ALTER TABLE goals DROP COLUMN IF EXISTS target_amount;
ALTER TABLE goals DROP COLUMN IF EXISTS current_amount;

-- Verify remaining columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
AND column_name IN ('amount', 'description', 'encrypted_amount', 'encrypted_description')
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'goals' 
AND column_name IN ('target_amount', 'current_amount', 'encrypted_target_amount', 'encrypted_current_amount')
ORDER BY column_name;
