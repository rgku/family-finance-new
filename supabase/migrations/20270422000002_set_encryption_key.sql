-- ============================================
-- SET ENCRYPTION KEY
-- Run this ONCE in Supabase SQL Editor
-- IMPORTANT: Save the generated key securely!
-- ============================================

-- Step 1: Set the encryption key permanently using ALTER SYSTEM
-- After running this, Supabase needs to reload config (auto-reloads after a few seconds)
ALTER SYSTEM SET app.encryption_key = '4M1KA9+MMtAwC8biS9F0Vr8O3zQUxjPdetb1ZXScmNE=';

-- Step 2: Reload PostgreSQL configuration
SELECT pg_reload_conf();

-- Step 3: Verify the key is set
SELECT current_setting('app.encryption_key', true) AS encryption_key_status;

-- If you see the key, it's set correctly!
-- If you see NULL, wait a few seconds and try again