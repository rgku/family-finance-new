-- ============================================
-- Add UPDATE policy for goals table
-- Fixes: cannot update goal current_amount
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goals') THEN
    -- Drop existing update policy if exists
    DROP POLICY IF EXISTS "Users can update own goals" ON goals;
    
    -- Create UPDATE policy
    CREATE POLICY "Users can update own goals" ON goals
      FOR UPDATE USING (user_id = auth.uid());
    
    RAISE NOTICE 'UPDATE policy created for goals';
  ELSE
    RAISE NOTICE 'goals table not found';
  END IF;
END $$;