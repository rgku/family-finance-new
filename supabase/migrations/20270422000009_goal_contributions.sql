-- ============================================
-- MIGRATION: goal_contributions for monthly tracking
-- Fixes: current_amount cumulative without history
-- ============================================

-- 1. Add missing columns to goals table if they don't exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_contribution_date TIMESTAMPTZ;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL;

-- 2. Create goal_contributions table (without family_id to avoid dependency issues)
CREATE TABLE IF NOT EXISTS goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  month DATE NOT NULL,  -- First day of month for easy filtering
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS for goal_contributions
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- RLS policies for goal_contributions
DROP POLICY IF EXISTS "Users can access own goal contributions" ON goal_contributions;
CREATE POLICY "Users can access own goal contributions" ON goal_contributions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own goal contributions" ON goal_contributions;
CREATE POLICY "Users can insert own goal contributions" ON goal_contributions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own goal contributions" ON goal_contributions;
CREATE POLICY "Users can delete own goal contributions" ON goal_contributions
  FOR DELETE USING (user_id = auth.uid());

-- 4. Create index for faster monthly queries
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_month ON goal_contributions(month);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_month ON goal_contributions(user_id, month);

-- 5. Create function to add contribution
CREATE OR REPLACE FUNCTION add_goal_contribution(
  p_goal_id UUID,
  p_amount DECIMAL(12, 2)
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_current DECIMAL;
BEGIN
  -- Get current goal info (only user_id and current_amount)
  SELECT user_id, decrypt_amount(encrypted_current_amount)::DECIMAL
  INTO v_user_id, v_current
  FROM goals 
  WHERE id = p_goal_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;
  
  -- Insert contribution record
  INSERT INTO goal_contributions (goal_id, user_id, amount, contribution_date, month)
  VALUES (
    p_goal_id, 
    v_user_id, 
    p_amount, 
    CURRENT_DATE, 
    DATE_TRUNC('month', CURRENT_DATE)
  );
  
  -- Update goal current_amount and last_contribution_date
  UPDATE goals 
  SET 
    encrypted_current_amount = encrypt_amount((v_current + p_amount)::TEXT),
    last_contribution_date = NOW()
  WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create view for monthly goal progress
DROP VIEW IF EXISTS goal_cumulative_progress CASCADE;
DROP VIEW IF EXISTS goal_monthly_progress CASCADE;
CREATE VIEW goal_monthly_progress AS
SELECT 
  g.id AS goal_id,
  g.user_id,
  g.name,
  DATE_TRUNC('month', gc.contribution_date)::DATE AS month,
  g.goal_type,
  g.icon,
  g.deadline,
  decrypt_amount(g.encrypted_target_amount)::DECIMAL AS target_amount,
  SUM(gc.amount) AS monthly_contribution,
  COUNT(gc.id) AS num_contributions
FROM goals g
LEFT JOIN goal_contributions gc ON g.id = gc.goal_id
GROUP BY g.id, g.user_id, g.name, DATE_TRUNC('month', gc.contribution_date), g.goal_type, g.icon, g.deadline, g.encrypted_target_amount
ORDER BY g.id, month;

-- 7. Create view for cumulative goal progress per month
DROP VIEW IF EXISTS goal_cumulative_progress;
CREATE VIEW goal_cumulative_progress AS
SELECT 
  goal_id,
  user_id,
  name,
  month,
  target_amount,
  goal_type,
  icon,
  deadline,
  monthly_contribution,
  SUM(monthly_contribution) OVER (
    PARTITION BY goal_id 
    ORDER BY month
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_amount,
  CASE 
    WHEN target_amount > 0 THEN 
      (SUM(monthly_contribution) OVER (PARTITION BY goal_id ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) / target_amount * 100)
    ELSE 0
  END AS progress_percent
FROM goal_monthly_progress
WHERE monthly_contribution > 0 OR month IS NOT NULL
ORDER BY goal_id, month;

-- ============================================
-- NOTE: Update DataProvider to use goal_contributions
-- The app should call add_goal_contribution() when adding savings to a goal
-- And read from goal_cumulative_progress for monthly totals
-- ============================================