-- Enable pg_cron extension for scheduled jobs
-- Execute this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule recurring transactions processing daily at 09:00 UTC
SELECT cron.schedule(
  'process-recurring-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/process-recurring',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer REPLACE_WITH_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  )
  $$
);

-- Verify the job was created
SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('process-recurring-daily');
