-- Monthly Report Cron Job
-- Execute this in Supabase SQL Editor
-- Runs daily at 10:00 UTC, checks each user's billing_cycle_day

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly report check (runs daily, function checks billing_cycle_day per user)
-- Uses secrets from vault for secure auth
DO $$
BEGIN
  -- Remove existing job if any
  PERFORM cron.unschedule('monthly-report-check');
EXCEPTION WHEN OTHERS THEN
  -- Ignore if job doesn't exist
END
$$;

SELECT cron.schedule(
  'monthly-report-check',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/monthly-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer " || current_setting('app.settings.service_role_key') || ""}'::jsonb,
    body:='{}'::jsonb
  )
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'monthly-report-check';

-- Add monthly_summary to notification_preferences if not exists
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS monthly_summary BOOLEAN DEFAULT true;

-- Add email_report_opt_out as alternative (some users prefer not to receive emails)
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS email_report_opt_out BOOLEAN DEFAULT false;

-- Comment explaining the flow:
-- 1. pg_cron triggers the Edge Function at 10:00 UTC daily
-- 2. Edge Function checks each user's billing_cycle_day
-- 3. If today = billing_cycle_day + 1, sends the monthly report email
-- 4. Edge Function respects notification_preferences.monthly_summary setting