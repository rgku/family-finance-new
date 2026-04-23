-- ============================================
-- NOTIFICAÇÕES - CORREÇÃO COMPLETA
-- ============================================
-- Executa isto no Supabase SQL Editor para ativar
-- notificações in-app automáticas para budgets e metas
-- ============================================

-- ============================================
-- 1. ATUALIZAR FUNÇÃO notify_budget_threshold()
-- ============================================
-- Drop trigger first (depends on function)
DROP TRIGGER IF EXISTS on_budget_threshold ON budgets;

-- Drop old function
DROP FUNCTION IF EXISTS notify_budget_threshold();

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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_budget_threshold ON budgets;
CREATE TRIGGER on_budget_threshold
  AFTER INSERT OR UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION notify_budget_threshold();

-- ============================================
-- 2. ATUALIZAR FUNÇÃO notify_goal_achieved()
-- ============================================
DROP TRIGGER IF EXISTS on_goal_achieved ON goals;
DROP FUNCTION IF EXISTS notify_goal_achieved();

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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_goal_achieved ON goals;
CREATE TRIGGER on_goal_achieved
  AFTER INSERT OR UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION notify_goal_achieved();

-- ============================================
-- 3. ADICIONAR COLUNAS EM FALTA (budget_alerts)
-- ============================================
ALTER TABLE budget_alerts 
ADD COLUMN IF NOT EXISTS alert_type TEXT CHECK (alert_type IN ('warning', 'exceeded'));

ALTER TABLE budget_alerts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE budget_alerts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 4. VERIFICAR
-- ============================================
-- Run this to verify triggers exist:
SELECT 
  tgname as trigger_name, 
  tgrelid::regclass as table_name,
  tgfoid::regprocedure as function_name
FROM pg_trigger
WHERE tgname IN ('on_budget_threshold', 'on_goal_achieved');

-- Check budget_alerts columns:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'budget_alerts'
ORDER BY ordinal_position;
