-- ============================================
-- MIGRATION: Add Missing Audit Triggers
-- Execute in Supabase SQL Editor
-- ============================================

-- 1. Audit trigger para profiles
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- 2. Audit trigger para families
CREATE TRIGGER audit_families
  AFTER INSERT OR UPDATE OR DELETE ON families
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- 3. Audit trigger para categories
CREATE TRIGGER audit_categories
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- 4. Audit trigger para budget_alerts
CREATE TRIGGER audit_budget_alerts
  AFTER INSERT OR UPDATE OR DELETE ON budget_alerts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- 5. Audit trigger para notifications
CREATE TRIGGER audit_notifications
  AFTER INSERT OR UPDATE OR DELETE ON notifications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- 6. Audit trigger para recurring_transactions (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recurring_transactions') THEN
    CREATE TRIGGER audit_recurring_transactions
      AFTER INSERT OR UPDATE OR DELETE ON recurring_transactions
      FOR EACH ROW EXECUTE FUNCTION audit_trigger();
  END IF;
END $$;

-- 7. Audit trigger para onesignal_subscriptions (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'onesignal_subscriptions') THEN
    CREATE TRIGGER audit_onesignal_subscriptions
      AFTER INSERT OR UPDATE OR DELETE ON onesignal_subscriptions
      FOR EACH ROW EXECUTE FUNCTION audit_trigger();
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
  tgname AS trigger_name,
  relname AS table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE tgname LIKE 'audit_%'
ORDER BY relname;