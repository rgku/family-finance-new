-- ============================================
-- MIGRATION: User-based Rate Limiting
-- Execute INTEIRO no Supabase SQL Editor
-- ============================================

-- 1. Criar tabela PRIMEIRO
CREATE TABLE IF NOT EXISTS user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action, window_start)
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user 
  ON user_rate_limits(user_id, action, window_start DESC);

CREATE INDEX IF NOT EXISTS idx_user_rate_limits_cleanup 
  ON user_rate_limits(window_start);

-- 3. Enable RLS
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS
DROP POLICY IF EXISTS "Users can view own rate limits" ON user_rate_limits;
CREATE POLICY "Users can view own rate limits" 
  ON user_rate_limits
  FOR SELECT 
  USING (user_id = auth.uid());

-- 5. Função de cleanup PRIMEIRO
DROP FUNCTION IF EXISTS cleanup_user_rate_limits();
CREATE OR REPLACE FUNCTION cleanup_user_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM user_rate_limits 
  WHERE window_start < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função de rate limit
DROP FUNCTION IF EXISTS check_user_rate_limit(UUID, TEXT, INTEGER, INTEGER);
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
      COALESCE(EXTRACT(EPOCH FROM (reset_time - NOW()))::INTEGER, 0);
  ELSE
    INSERT INTO user_rate_limits (user_id, action, count, window_start)
    VALUES (p_user_id, p_action, 1, NOW())
    ON CONFLICT (user_id, action, window_start) 
    DO UPDATE SET count = user_rate_limits.count + 1;
    
    RETURN QUERY SELECT 
      TRUE::BOOLEAN,
      (p_max_requests - COALESCE(current_count, 0) - 1)::INTEGER,
      (p_window_minutes * 60)::INTEGER;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7. Função utilitária para policies
DROP FUNCTION IF EXISTS is_rate_limited(TEXT, INTEGER, INTEGER);
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
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE; -- Se falhar, permitir (fail open)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Testar
SELECT 'Table created' AS status;