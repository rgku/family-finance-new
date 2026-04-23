-- In-App Notifications Table
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, read, created_at DESC);

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can access own notifications
DROP POLICY IF EXISTS "Users can access own notifications" ON notifications;
CREATE POLICY "Users can access own notifications" 
ON notifications FOR ALL 
USING (user_id = auth.uid());

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_url TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, body, url, type)
  VALUES (p_user_id, p_title, p_body, p_url, p_type)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Budget 80% threshold
CREATE OR REPLACE FUNCTION notify_budget_threshold()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_spent DECIMAL(12,2);
  v_percent INTEGER;
  v_month_start DATE;
  v_month_end DATE;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id FROM budgets WHERE id = NEW.id;
  
  -- Calculate month start and end
  v_month_start := DATE_TRUNC('month', NEW.month);
  v_month_end := (DATE_TRUNC('month', NEW.month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Calculate spent from transactions for this category and month
  SELECT COALESCE(SUM(amount), 0) INTO v_spent
  FROM transactions
  WHERE user_id = v_user_id
    AND type = 'expense'
    AND category = NEW.category
    AND DATE(date) BETWEEN v_month_start AND v_month_end;
  
  -- Calculate percentage
  v_percent := ROUND((v_spent / NULLIF(NEW.limit_amount, 0)) * 100);
  
  -- Notify at 80%
  IF v_percent >= 80 AND v_percent < 100 THEN
    PERFORM create_notification(
      v_user_id,
      'Orçamento quase esgotado',
      FORMAT('Atingiste %d%% do orçamento para %s', v_percent, NEW.category),
      '/dashboard/budgets',
      'budget_80_percent'
    );
  END IF;
  
  -- Notify at 100%
  IF v_percent >= 100 THEN
    PERFORM create_notification(
      v_user_id,
      'Orçamento esgotado!',
      FORMAT('Ultrapassaste o limite do orçamento para %s (%d%%)', NEW.category, v_percent),
      '/dashboard/budgets',
      'budget_100_percent'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Goal achieved
CREATE OR REPLACE FUNCTION notify_goal_achieved()
RETURNS TRIGGER AS $$
DECLARE
  v_current DECIMAL(12,2);
  v_target DECIMAL(12,2);
  v_old_current DECIMAL(12,2) := 0;
BEGIN
  -- Decrypt current_amount and target_amount
  v_current := decrypt_amount(NEW.encrypted_current_amount)::DECIMAL;
  v_target := decrypt_amount(NEW.encrypted_target_amount)::DECIMAL;
  
  -- Get old current amount if exists
  IF OLD IS NOT NULL THEN
    v_old_current := decrypt_amount(OLD.encrypted_current_amount)::DECIMAL;
  END IF;
  
  -- Check if goal just reached 100% (only notify once when crossing threshold)
  IF v_current >= v_target AND v_old_current < v_target THEN
    PERFORM create_notification(
      NEW.user_id,
      '🎉 Meta Atingida!',
      FORMAT('Parabéns! Completaste a tua meta "%s"', NEW.name),
      '/dashboard/goals',
      'goal_achieved'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
