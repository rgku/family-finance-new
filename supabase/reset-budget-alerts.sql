-- ============================================
-- RESET BUDGET ALERTS PARA TESTE
-- ============================================
-- Executa isto para permitir que os alerts
-- sejam enviados novamente este mês
-- ============================================

-- Opção 1: Reset TODOS os alerts deste mês
UPDATE budget_alerts 
SET last_sent = NULL
WHERE last_sent >= DATE_TRUNC('month', NOW());

-- Opção 2: Reset alerts de uma categoria específica
UPDATE budget_alerts 
SET last_sent = NULL
WHERE category = 'Alimentação'  -- Muda para a tua categoria
  AND last_sent >= DATE_TRUNC('month', NOW());

-- Opção 3: Reset APENAS para um threshold específico
UPDATE budget_alerts 
SET last_sent = NULL
WHERE threshold_percent = 80  -- ou 100
  AND last_sent >= DATE_TRUNC('month', NOW());

-- Opção 4: Ver alerts atuais
SELECT 
  user_id,
  category,
  threshold_percent,
  alert_type,
  last_sent,
  enabled
FROM budget_alerts
ORDER BY last_sent DESC;

-- Opção 5: Delete alerts (para teste completo)
-- DELETE FROM budget_alerts 
-- WHERE user_id = 'TEU_USER_ID';
