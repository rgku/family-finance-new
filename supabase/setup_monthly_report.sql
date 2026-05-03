-- ============================================
-- MONTHLY REPORT SETUP - Execute this in SQL Editor
-- ============================================
-- Go to: Supabase Dashboard > SQL Editor > Run this

-- 1. Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the job (runs daily at 10:00 UTC)
-- Check if job exists first, if not, create it
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

-- 3. Add columns
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS monthly_summary BOOLEAN DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS email_report_opt_out BOOLEAN DEFAULT false;

-- 4. Verify
SELECT * FROM cron.job WHERE jobname = 'monthly-report-check';

-- 3. Add columns to notification_preferences if not exists
ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS monthly_summary BOOLEAN DEFAULT true;

ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS email_report_opt_out BOOLEAN DEFAULT false;

-- 4. Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'monthly-report-check';

-- ============================================
-- RESEND API SETUP
-- ============================================
-- 1. Create account at https://resend.com
-- 2. Add API key in Supabase Dashboard:
--    Settings > Edge Functions > Manage secrets
--    Key: RESEND_API_KEY
--    Value: re_xxxxxxxxxxxxx
-- 3. Also add:
--    Key: RESEND_FROM_EMAIL  
--    Value: FamFlow <noreply@famflow.app>
--    Key: APP_URL
--    Value: https://famflow.app