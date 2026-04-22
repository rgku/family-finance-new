-- ============================================
-- DROP old encryption triggers
-- The target_amount and current_amount columns no longer exist
-- Encryption is now done manually by add_goal_contribution
-- ============================================

-- Drop triggers that reference old columns
DROP TRIGGER IF EXISTS trg_encrypt_transaction_insert ON transactions;
DROP TRIGGER IF EXISTS trg_encrypt_transaction_update ON transactions;
DROP TRIGGER IF EXISTS trg_encrypt_goal_insert ON goals;
DROP TRIGGER IF EXISTS trg_encrypt_goal_update ON goals;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS encrypt_transaction_insert();
DROP FUNCTION IF EXISTS encrypt_transaction_update();
DROP FUNCTION IF EXISTS encrypt_goal_insert();
DROP FUNCTION IF EXISTS encrypt_goal_update();

-- Verify: Should return empty
SELECT 
  trigger_name 
FROM information_schema.triggers 
WHERE event_object_table IN ('transactions', 'goals');