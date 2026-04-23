-- ============================================
-- NOTIFICATION CRON JOBS
-- ============================================
-- Enable pg_cron and schedule all notification jobs
-- Execute this in Supabase SQL Editor
-- ============================================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. RECURRING TRANSACTIONS REMINDER
-- ============================================
-- Runs daily at 09:00 UTC

SELECT cron.schedule(
  'recurring-reminder-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/process-recurring',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  )
  $$
);

-- ============================================
-- 2. WEEKLY SUMMARY
-- ============================================
-- Runs every Sunday at 18:00 UTC

SELECT cron.schedule(
  'weekly-summary-sunday',
  '0 18 * * 0',
  $$
  SELECT net.http_post(
    url:='https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/weekly-summary',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  )
  $$
);

-- ============================================
-- 3. INACTIVITY REMINDER
-- ============================================
-- Runs daily at 10:00 UTC

SELECT cron.schedule(
  'inactivity-reminder-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/inactivity-reminder',
    headers:='{"Content-Type": "application/json"}'::jsonb,
    body:='{}'::jsonb
  )
  $$
);

-- ============================================
-- VERIFICATION
-- ============================================
-- Check all scheduled jobs
SELECT 
  jobid,
  schedule,
  command,
  database,
  username
FROM cron.job
ORDER BY jobid;

-- ============================================
-- HELPER QUERIES
-- ============================================

-- To unschedule a job (if needed):
-- SELECT cron.unschedule('recurring-reminder-daily');
-- SELECT cron.unschedule('weekly-summary-sunday');
-- SELECT cron.unschedule('inactivity-reminder-daily');

-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- To disable a job temporarily:
-- UPDATE cron.job SET active = false WHERE jobname = 'recurring-reminder-daily';

-- To re-enable a job:
-- UPDATE cron.job SET active = true WHERE jobname = 'recurring-reminder-daily';
