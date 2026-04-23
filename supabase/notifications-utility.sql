-- ============================================
-- UTILITÁRIO DE NOTIFICAÇÕES
-- ============================================
-- Comandos para gerir notificações e alerts
-- ============================================

-- 1. RESET BUDGET ALERTS (permite re-enviar)
-- ============================================
-- Usa isto se corrigiste uma transação e queres receber o alerta novamente

-- Reset TODOS os alerts
UPDATE budget_alerts SET last_sent = NULL;

-- Reset alerts de uma categoria específica
UPDATE budget_alerts 
SET last_sent = NULL
WHERE category = 'Alimentação';

-- Reset apenas threshold 80%
UPDATE budget_alerts 
SET last_sent = NULL
WHERE threshold_percent = 80;

-- Reset alerts deste mês
UPDATE budget_alerts 
SET last_sent = NULL
WHERE last_sent >= DATE_TRUNC('month', NOW());


-- 2. VERIFICAR ESTADO ATUAL
-- ============================================

-- Ver budget alerts enviados
SELECT 
  category,
  threshold_percent,
  alert_type,
  last_sent,
  enabled
FROM budget_alerts
ORDER BY last_sent DESC;

-- Ver notificações recentes
SELECT 
  title,
  body,
  type,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Ver budgets e percentagem atual
SELECT 
  b.category,
  b.limit_amount,
  COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) as spent,
  ROUND((COALESCE(SUM(CAST(t.amount AS DECIMAL)), 0) / b.limit_amount) * 100, 1) as percentage
FROM budgets b
LEFT JOIN transactions_decrypted t 
  ON t.category = b.category 
  AND t.type = 'expense'
  AND t.date >= b.month
  AND t.date < (b.month + INTERVAL '1 month')
WHERE b.user_id = auth.uid()
GROUP BY b.id, b.category, b.limit_amount, b.month
ORDER BY percentage DESC;


-- 3. CRIAR NOTIFICAÇÃO DE TESTE MANUAL
-- ============================================

-- Criar notificação manual
SELECT create_notification(
  auth.uid(),
  '🧪 Notificação de Teste',
  'Esta é uma notificação de teste criada manualmente',
  '/dashboard/alerts',
  'test'
);

-- Verificar se foi criada
SELECT * FROM notifications 
WHERE type = 'test' 
ORDER BY created_at DESC 
LIMIT 1;


-- 4. LIMPAR NOTIFICAÇÕES
-- ============================================

-- Limpar notificações antigas (> 30 dias)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Limpar TODAS as notificações
-- DELETE FROM notifications;

-- Marcar todas como lidas
UPDATE notifications SET read = true WHERE user_id = auth.uid();


-- 5. VERIFICAR SUBSCRIÇÃO ONESSIGNAL
-- ============================================

SELECT 
  user_id,
  onesignal_player_id,
  subscription_state,
  device_type,
  created_at
FROM onesignal_subscriptions
ORDER BY created_at DESC;


-- 6. DEBUG COMPLETO
-- ============================================
-- Executa isto para ver o estado completo

SELECT 'BUDGET ALERTS' as section, COUNT(*) as count FROM budget_alerts WHERE user_id = auth.uid()
UNION ALL
SELECT 'NOTIFICATIONS', COUNT(*) FROM notifications WHERE user_id = auth.uid()
UNION ALL
SELECT 'UNREAD NOTIFICATIONS', COUNT(*) FROM notifications WHERE user_id = auth.uid() AND read = false
UNION ALL
SELECT 'ONESIGNAL SUBSCRIPTIONS', COUNT(*) FROM onesignal_subscriptions WHERE user_id = auth.uid()
UNION ALL
SELECT 'BUDGETS THIS MONTH', COUNT(*) FROM budgets WHERE user_id = auth.uid() AND month >= DATE_TRUNC('month', NOW());
