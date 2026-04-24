-- ============================================
-- MIGRATION: Data Retention Policy
-- Execute in Supabase SQL Editor
-- ============================================

-- 1. Tabela de configuração de retenção
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  action TEXT CHECK (action IN ('DELETE', 'ARCHIVE', 'ANONYMIZE')) DEFAULT 'DELETE',
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Inserir políticas padrão
INSERT INTO data_retention_policies (table_name, retention_days, action) VALUES
  ('audit_log', 365, 'DELETE'),
  ('user_rate_limits', 1, 'DELETE'),
  ('rate_limits', 1, 'DELETE'),
  ('subscription_events', 90, 'DELETE')
ON CONFLICT (table_name) DO NOTHING;

-- 3. Enable RLS na tabela de policies
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage retention policies" ON data_retention_policies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- 4. Função de purge genérica
CREATE OR REPLACE FUNCTION purge_old_data(p_table_name TEXT DEFAULT NULL)
RETURNS TABLE (
  table_name TEXT,
  rows_deleted BIGINT,
  action TEXT
) AS $$
DECLARE
  policy_record RECORD;
  delete_query TEXT;
  result_count BIGINT;
BEGIN
  FOR policy_record IN 
    SELECT * FROM data_retention_policies
    WHERE enabled = true
      AND (p_table_name IS NULL OR table_name = p_table_name)
  LOOP
    IF policy_record.action = 'DELETE' THEN
      delete_query := format(
        'DELETE FROM %I WHERE created_at < NOW() - INTERVAL ''%s days''',
        policy_record.table_name,
        policy_record.retention_days
      );
      
      EXECUTE delete_query;
      GET DIAGNOSTICS result_count = ROW_COUNT;
      
      UPDATE data_retention_policies
      SET last_run = NOW()
      WHERE table_name = policy_record.table_name;
      
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função de cleanup manual
CREATE OR REPLACE FUNCTION run_cleanup()
RETURNS VOID AS $$
BEGIN
  -- Cleanup rate limits
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '15 minutes';
  
  -- Cleanup user rate limits
  DELETE FROM user_rate_limits WHERE window_start < NOW() - INTERVAL '15 minutes';
  
  -- Cleanup audit log (mais de 1 ano)
  DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '365 days';
  
  RAISE NOTICE 'Cleanup executado com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. View para monitorizar retenção
CREATE OR REPLACE VIEW retention_status AS
SELECT 
  table_name,
  retention_days,
  action,
  enabled,
  last_run,
  CASE 
    WHEN last_run IS NULL THEN 'Never'
    WHEN last_run < NOW() - INTERVAL '2 days' THEN 'Overdue'
    ELSE 'OK'
  END AS status
FROM data_retention_policies
ORDER BY table_name;

-- 7. View para sizes das tabelas
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
  schemaname,
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) AS total_size,
  pg_total_relation_size(schemaname||'.'||relname) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
  AND relname NOT LIKE 'pg_%'
  AND relname NOT LIKE 'sql_%'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- Testar
SELECT * FROM retention_status;
SELECT * FROM table_sizes;