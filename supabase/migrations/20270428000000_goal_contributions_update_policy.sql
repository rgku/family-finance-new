-- ============================================
-- Add UPDATE policy for goal_contributions
-- Fixes: edit contribution not working
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goal_contributions') THEN
    -- Drop existing update policy if exists
    DROP POLICY IF EXISTS "Users can update own goal contributions" ON goal_contributions;
    
    -- Create UPDATE policy
    CREATE POLICY "Users can update own goal contributions" ON goal_contributions
      FOR UPDATE USING (user_id = auth.uid());
    
    RAISE NOTICE 'UPDATE policy created for goal_contributions';
  ELSE
    RAISE NOTICE 'goal_contributions table not found';
  END IF;
END $$;