# 🔔 Debug Push Notifications - Browser

## Problema
- ✅ Notificação in-app aparece na campainha
- ❌ Push notification no browser não aparece

---

## 📋 Verificações

### **1. Verificar Subscrição OneSignal**

**Abre o console (F12) e executa:**

```javascript
// Verifica estado OneSignal
console.log('=== ONESIGNAL STATE ===');
console.log('isSubscribed:', await OneSignal.isSubscribed());
console.log('isPushEnabled:', await OneSignal.isPushEnabled());
console.log('playerId:', await OneSignal.getUserId());
```

**Resultado esperado:**
```
isSubscribed: true
isPushEnabled: true
playerId: "0d22df21-24d2-4e25-933c-469515e5962f" (ou similar)
```

**Se for `false` ou `null`:**
1. Vai a `/dashboard/alerts`
2. Clica em "Ativar Notificações"
3. Aceita as permissões do browser

---

### **2. Verificar Database**

**Executa no Supabase SQL Editor:**

```sql
-- Verificar subscrição
SELECT 
  user_id,
  onesignal_player_id,
  subscription_state,
  browser_name,
  updated_at
FROM onesignal_subscriptions
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb';
```

**Resultado esperado:**
- `onesignal_player_id`: **NÃO nulo**
- `subscription_state`: **'active'**

**Se estiver 'inactive' ou player_id nulo:**
```sql
-- Atualizar para active
UPDATE onesignal_subscriptions
SET subscription_state = 'active',
    updated_at = NOW()
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb'
  AND onesignal_player_id IS NOT NULL;

-- OU limpar e tentar novamente
DELETE FROM onesignal_subscriptions 
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb';
-- Depois reativa em /dashboard/alerts
```

---

### **3. Testar Push Manual**

**Cria uma notificação de teste:**

```sql
-- Criar notificação manual
SELECT create_notification(
  '0c46d5ba-bf36-49c1-84e6-6a95d52369bb',
  '🧪 Teste Push',
  'Esta é uma notificação de teste',
  '/dashboard/alerts',
  'test_push'
);
```

**Depois executa a Edge Function manualmente:**

```bash
# No terminal (ou usa Postman/Insomnia)
curl -X POST 'https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/send-push' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "0c46d5ba-bf36-49c1-84e6-6a95d52369bb",
    "title": "🧪 Teste Push Manual",
    "body": "Teste direto da Edge Function",
    "type": "test_manual"
  }'
```

---

### **4. Verificar Permissões do Browser**

**Chrome/Edge:**
1. Clica no 🔒 (cadeado) na barra de URL
2. Verifica se **Notificações** está como "Permitir"
3. Se estiver "Bloquear", muda para "Permitir"

**Firefox:**
1. Clica no 🔒 (cadeado) na barra de URL
2. Clica em "Limpar permissões"
3. Recarrega a página e aceita novamente

---

### **5. Verificar Console Logs**

**Quando crias uma transação que ativa budget alert, deves ver:**

```
[BudgetAlerts] Category: Lazer | Spent: 146 | Limit: 170 | Percentage: 85.9%
[BudgetAlerts] Sending notification for 80% threshold
✅ [BudgetAlerts] In-app notification created successfully
✅ [BudgetAlerts] Push notification sent successfully  <-- DEVE APARECER
[BudgetAlerts] Alert marked as sent
```

**Se não vires "Push notification sent successfully":**
- A Edge Function não está a ser chamada
- Ou está a falhar silenciosamente

---

## 🔍 Problemas Comuns

### **Problema 1: Edge Function Não Existe**

**Sintoma:**
```
Push notification skipped: Function not found
```

**Solução:**
A Edge Function `send-push` precisa de ser deployada. Se o teu plano Supabase não suporta Edge Functions, **push notifications não vão funcionar**.

**Verifica:**
```bash
npx supabase functions list --project-ref lqxvfpqplvvyegyzvqjo
```

**Se não listar `send-push`:**
- Plano free antigo não suporta Edge Functions
- Alternativa: Usa apenas in-app notifications (já funciona)
- OU faz upgrade para plano Pro

---

### **Problema 2: OneSignal Credentials em Falta**

**Sintoma:**
```
OneSignal not configured
```

**Solução:**
As variáveis de ambiente precisam de estar configuradas no Supabase:

1. `ONESIGNAL_APP_ID` = `YOUR_ONESIGNAL_APP_ID`
2. `ONESIGNAL_REST_API_KEY` = `YOUR_ONESIGNAL_REST_API_KEY`

**Verifica no Supabase Dashboard:**
- Project Settings → Edge Functions → Secrets

---

### **Problema 3: Player ID Não Guardado**

**Sintoma:**
```
User not subscribed to push notifications
```

**Solução:**
1. Verifica se `onesignal_player_id` existe no database
2. Se não existir, limpa e reativa:

```sql
DELETE FROM onesignal_subscriptions 
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb';
```

Depois:
1. Recarrega a página (F5)
2. Vai a `/dashboard/alerts`
3. Clica em "Ativar Notificações"
4. Aceita as permissões

---

## ✅ Checklist Final

- [ ] OneSignal.isSubscribed() = true
- [ ] OneSignal.getUserId() = player ID (não nulo)
- [ ] Database: subscription_state = 'active'
- [ ] Database: onesignal_player_id não nulo
- [ ] Browser: Permissões de notificação = Permitir
- [ ] Console: "Push notification sent successfully"
- [ ] Edge Function: `send-push` existe e está deployada
- [ ] OneSignal: API key configurada no Supabase

---

## 🧪 Teste Rápido

**Cria uma transação de teste:**

1. Categoria: Lazer (já tem budget)
2. Valor: 10€
3. Abre o console (F12)
4. Verifica os logs

**Deves ver:**
```
✅ [BudgetAlerts] In-app notification created successfully
✅ [BudgetAlerts] Push notification sent successfully
[useNotifications] Realtime INSERT detected
[useNotifications] Fetched X notifications
[NotificationBell] notifications: X unread: Y
```

**E no browser:**
- 🔔 Notificação push aparece no canto superior direito

---

## 📞 Se Ainda Não Funcionar

**Partilha:**
1. Output do passo 1 (OneSignal state)
2. Output do passo 2 (Database subscription)
3. Logs do console quando crias transação
4. Estado das permissões do browser

**Assim podemos identificar exatamente onde está o problema!**
