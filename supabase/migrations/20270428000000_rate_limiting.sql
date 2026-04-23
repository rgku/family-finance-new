-- Migration: Add rate limiting table and function
-- Run this in Supabase SQL Editor

-- Create rate_limits table for persistent rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip VARCHAR(45) NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups  
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits(ip, window_start);

-- Enable RLS (but will be bypassed by security definer function)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow all operations - the function runs with SECURITY DEFINER
-- which bypasses RLS when accessing this table
CREATE POLICY "Allow all via function" ON rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to check and increment rate limit
-- SECURITY DEFINER makes it run as function owner, bypassing RLS
CREATE OR REPLACE FUNCTION check_rate_limit(p_ip VARCHAR)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER) 
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  current_count INTEGER;
  rec RECORD;
BEGIN
  -- Clean up old entries (older than 15 minutes)
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '15 minutes';
  
  -- Check existing record
  SELECT count INTO current_count 
  FROM rate_limits 
  WHERE ip = p_ip AND window_start > NOW() - INTERVAL '15 minutes'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND OR current_count IS NULL OR current_count < 5 THEN
    INSERT INTO rate_limits (ip, count, window_start) 
    VALUES (p_ip, 1, NOW());
    
    RETURN QUERY SELECT TRUE::BOOLEAN, (5 - COALESCE(current_count, 0))::INTEGER;
  END IF;
  
  RETURN QUERY SELECT FALSE::BOOLEAN, 0::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Create function to cleanup old rate limits (for cron job)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS VOID AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql;