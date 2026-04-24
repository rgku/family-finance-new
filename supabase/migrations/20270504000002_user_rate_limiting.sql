-- ============================================
-- MIGRATION: User-based Rate Limiting
-- Execute in Supabase SQL Editor
-- ============================================

-- 1. Criar tabela de rate limits por utilizador
CREATE TABLE IF NOT EXISTS user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action, window_start)
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user 
  ON user_rate_limits(user_id, action, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_user_rate_limits_cleanup 
  ON user_rate_limits(window_start);

-- 3. Enable RLS
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS
CREATE POLICY "Users can view own rate limits" 
  ON user_rate_limits
  FOR SELECT 
  USING (user_id = auth.uid());

-- 5. Função para verificar rate limit
CREATE OR REPLACE FUNCTION check_user_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_in_seconds INTEGER)
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  current_count INTEGER;
  reset_time TIMESTAMPTZ;
BEGIN
  -- Clean up old entries
  DELETE FROM user_rate_limits 
  WHERE window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check current count
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM user_rate_limits
  WHERE user_id = p_user_id 
    AND action = p_action
    AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  IF current_count >= p_max_requests THEN
    SELECT MIN(window_start) + (p_window_minutes || ' minutes')::INTERVAL 
    INTO reset_time
    FROM user_rate_limits
    WHERE user_id = p_user_id AND action = p_action;
    
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      0::INTEGER,
      EXTRACT(EPOCH FROM (reset_time - NOW()))::INTEGER;
  ELSE
    INSERT INTO user_rate_limits (user_id, action, count, window_start)
    VALUES (p_user_id, p_action, 1, NOW())
    ON CONFLICT (user_id, action, window_start) 
    DO UPDATE SET count = user_rate_limits.count + 1;
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,
      (p_max_requests - current_count - 1)::INTEGER,
      (p_window_minutes * 60)::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Função utilitária para usar em policies
CREATE OR REPLACE FUNCTION is_rate_limited(
  p_action TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT NOT allowed INTO result
  FROM check_user_rate_limit(auth.uid(), p_action, p_max_requests, p_window_minutes);
  RETURN COALESCE(result, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função de cleanup
CREATE OR REPLACE FUNCTION cleanup_user_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM user_rate_limits 
  WHERE window_start < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql;

-- 8. Aplicar rate limiting em transactions
DROP POLICY IF EXISTS "strict_transactions_insert" ON transactions;
CREATE POLICY "strict_transactions_insert" ON transactions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT is_rate_limited('transaction_create', 100, 1)
  );

-- Testar
SELECT 
  'Rate limit test' AS test,
  check_user_rate_limit(auth.uid(), 'test_action', 10, 1);