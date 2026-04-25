# 🔔 Debug de Notificações - Guia Completo

## Problema Reportado
- Passou dos 85% e notificação não disparou
- Push do browser não aparece
- Só aparece com Ctrl+Shift+R (hard refresh)

---

## ✅ Correções Aplicadas

### 1. Logging Detalhado no DataProvider
- Adicionado logging completo para debug
- Mostra percentage, spent, limit
- Indica se alerta já foi enviado

### 2. Polling + Realtime
- Polling: 5 segundos
- Realtime: Instantâneo via Supabase Realtime

---

## 🧪 Testes de Debug

### **Teste 1: Verificar Subscrição OneSignal**

Abre o console do browser (F12) e executa:

```javascript
// Verificar estado OneSignal
const state = {
  isSubscribed: await OneSignal.isSubscribed(),
  isPushEnabled: await OneSignal.isPushEnabled(),
  playerId: await OneSignal.getUserId(),
};
console.log('OneSignal State:', state);

// Verificar subscrição no database
const { data, error } = await supabase
  .from('onesignal_subscriptions')
  .select('*')
  .eq('user_id', supabase.auth.getUser().then(u => u.data.user?.id))
  .single();
console.log('Database Subscription:', data);
```

---

### **Teste 2: Verificar Budget Alerts**

1. **Abre a app**
2. **Abre o console (F12)**
3. **Cria uma transação** de teste
4. **Procura no console:**
```
[BudgetAlerts] Category: X | Spent: Y | Limit: Z | Percentage: 85.0%
[BudgetAlerts] Threshold reached: 80%
[BudgetAlerts] Sending notification for 80% threshold
✅ [BudgetAlerts] In-app notification created successfully
```

---

### **Teste 3: Verificar Notificações no Database**

```sql
-- Ver últimas notificações criadas
SELECT 
  id,
  user_id,
  title,
  body,
  type,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;

-- Ver budget alerts enviados
SELECT 
  user_id,
  category,
  threshold_percent,
  alert_type,
  last_sent
FROM budget_alerts
ORDER BY last_sent DESC
LIMIT 10;

-- Ver subscrições OneSignal
SELECT 
  user_id,
  onesignal_player_id,
  subscription_state,
  created_at
FROM onesignal_subscriptions
ORDER BY created_at DESC;
```

---

## 🔍 Possíveis Causas do Problema

### **Causa 1: Alerta Já Foi Enviado**

Se já passaste dos 80% antes e o alerta foi enviado, **não envia novamente** este mês.

**Solução:**
```sql
-- Reset budget alerts para teste
UPDATE budget_alerts 
SET last_sent = NULL 
WHERE user_id = 'TEU_USER_ID';
```

---

### **Causa 2: OneSignal Não Subscrito**

**Verificar:**
1. Vai a `/dashboard/alerts`
2. Vê se o toggle "Push Notifications" está ON
3. Vê se aparece "Subscrito" com Player ID

**Se não estiver subscrito:**
- Clica em "Ativar Notificações"
- Aceita as permissões do browser

---

### **Causa 3: Transações Não Estão a Ser Contadas**

**Verificar:**
```sql
-- Ver transações deste mês
SELECT 
  category,
  SUM(CAST(decrypt_amount(encrypted_amount) AS DECIMAL)) as total_spent
FROM transactions_decrypted
WHERE user_id = 'TEU_USER_ID'
  AND type = 'expense'
  AND DATE(date) >= DATE_TRUNC('month', NOW())
GROUP BY category;
```

---

### **Causa 4: Budget Não Existe para Este Mês**

**Verificar:**
```sql
-- Ver budgets deste mês
SELECT 
  id,
  category,
  limit_amount,
  month
FROM budgets
WHERE user_id = 'TEU_USER_ID'
  AND month >= DATE_TRUNC('month', NOW())
  AND month < DATE_TRUNC('month', NOW() + INTERVAL '1 month');
```

---

## 🚀 Teste Completo

### **Passo 1: Limpar Alerts Anteriores**
```sql
UPDATE budget_alerts 
SET last_sent = NULL 
WHERE user_id = 'TEU_USER_ID';
```

### **Passo 2: Criar Orçamento de Teste**
```sql
INSERT INTO budgets (user_id, category, month, limit_amount)
VALUES (
  'TEU_USER_ID',
  'Teste',
  DATE_TRUNC('month', NOW()),
  100
);
```

### **Passo 3: Criar Transação de 85€**
```sql
INSERT INTO transactions (user_id, type, category, amount, description, date)
VALUES (
  'TEU_USER_ID',
  'expense',
  'Teste',
  85,
  'Teste notificação 85%',
  NOW()
);
```

### **Passo 4: Verificar Console**
- Abre F12
- Procura por `[BudgetAlerts]`
- Deves ver:
  ```
  [BudgetAlerts] Category: Teste | Spent: 85 | Limit: 100 | Percentage: 85.0%
  [BudgetAlerts] Threshold reached: 80%
  [BudgetAlerts] Sending notification for 80% threshold
  ✅ [BudgetAlerts] In-app notification created successfully
  ```

### **Passo 5: Verificar Notificações**
```sql
SELECT * FROM notifications 
WHERE user_id = 'TEU_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📋 Checklist de Verificação

- [ ] OneSignal subscrito (Player ID existe)
- [ ] Budget existe para este mês
- [ ] Transação foi criada na categoria correta
- [ ] Percentage >= 80%
- [ ] Alerta ainda não foi enviado este mês
- [ ] Console mostra logs `[BudgetAlerts]`
- [ ] Notificação aparece no database
- [ ] Notificação aparece na UI (sem refresh)

---

## 🐛 Se Ainda Não Funcionar

### **Logs a Verificar:**

1. **Console do Browser:**
   - `[useNotifications]` - Fetch e realtime
   - `[BudgetAlerts]` - Lógica de alerts
   - `[OneSignal]` - Estado da subscrição

2. **Database:**
   - Tabela `notifications` - Notificações criadas?
   - Tabela `budget_alerts` - Alertas marcados como enviados?
   - Tabela `onesignal_subscriptions` - Subscrição ativa?

3. **Network Tab:**
   - Request para `/rest/v1/notifications` - OK?
   - Request para `/functions/v1/send-push` - OK ou falha esperada?

---

## ✅ Resultado Esperado

**Ao criar transação que atinge 80%:**

1. ✅ Console: `[BudgetAlerts] Threshold reached: 80%`
2. ✅ Console: `✅ [BudgetAlerts] In-app notification created successfully`
3. ✅ Database: Nova linha em `notifications`
4. ✅ UI: Badge vermelho aparece em ≤5 segundos
5. ✅ Browser: Push notification (se subscrito)

**Se isto não acontecer, partilha os logs do console!**
