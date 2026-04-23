-- ============================================
-- VERIFICAR SUBSCRIÇÃO ONESSIGNAL
-- ============================================
-- Executa isto no Supabase SQL Editor

-- 1. Verificar subscrição atual
SELECT 
  user_id,
  onesignal_player_id,
  subscription_state,
  browser_name,
  created_at,
  updated_at
FROM onesignal_subscriptions
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb'
ORDER BY created_at DESC;

-- 2. Verificar notificações enviadas (push + in-app)
SELECT 
  title,
  body,
  type,
  created_at
FROM notifications
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar budget alerts
SELECT 
  category,
  threshold_percent,
  alert_type,
  last_sent,
  enabled
FROM budget_alerts
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb'
ORDER BY last_sent DESC;

-- 4. Atualizar subscription_state para 'active' (se necessário)
UPDATE onesignal_subscriptions
SET subscription_state = 'active',
    updated_at = NOW()
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb'
  AND onesignal_player_id IS NOT NULL;

-- 5. Se NÃO tens player_id, limpa e tenta novamente
-- DELETE FROM onesignal_subscriptions 
-- WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb';
