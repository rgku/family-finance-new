# 🔔 Correção de Notificações - Instruções

## Problemas Resolvidos

1. ✅ **Dropdown do botão de notificações** - Agora aparece completo (não é cortado)
2. ✅ **Notificações in-app** - Agora são criadas automaticamente no database
3. ✅ **Push + In-app** - Edge Function `send-push` agora cria ambos os tipos de notificação

---

## 📋 Passos para Ativar Notificações Automáticas

### **Passo 1: Atualizar a Função `notify_budget_threshold()`**

Executa no **Supabase SQL Editor**:

```sql
-- Drop old function
DROP FUNCTION IF EXISTS notify_budget_threshold();

-- Create updated function with correct spent calculation
CREATE OR REPLACE FUNCTION notify_budget_threshold()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_spent DECIMAL(12,2);
  v_percent INTEGER;
  v_month_start DATE;
  v_month_end DATE;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id FROM budgets WHERE id = NEW.id;
  
  -- Calculate month start and end
  v_month_start := DATE_TRUNC('month', NEW.month);
  v_month_end := (DATE_TRUNC('month', NEW.month) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  -- Calculate spent from transactions for this category and month
  SELECT COALESCE(SUM(amount), 0) INTO v_spent
  FROM transactions
  WHERE user_id = v_user_id
    AND type = 'expense'
    AND category = NEW.category
    AND DATE(date) BETWEEN v_month_start AND v_month_end;
  
  -- Calculate percentage
  v_percent := ROUND((v_spent / NULLIF(NEW.limit_amount, 0)) * 100);
  
  -- Notify at 80%
  IF v_percent >= 80 AND v_percent < 100 THEN
    PERFORM create_notification(
      v_user_id,
      'Orçamento quase esgotado',
      FORMAT('Atingiste %d%% do orçamento para %s', v_percent, NEW.category),
      '/dashboard/budgets',
      'budget_80_percent'
    );
  END IF;
  
  -- Notify at 100%
  IF v_percent >= 100 THEN
    PERFORM create_notification(
      v_user_id,
      'Orçamento esgotado!',
      FORMAT('Ultrapassaste o limite do orçamento para %s (%d%%)', NEW.category, v_percent),
      '/dashboard/budgets',
      'budget_100_percent'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update goal notification function (uses encrypted fields)
DROP FUNCTION IF EXISTS notify_goal_achieved();

CREATE OR REPLACE FUNCTION notify_goal_achieved()
RETURNS TRIGGER AS $$
DECLARE
  v_current DECIMAL(12,2);
  v_target DECIMAL(12,2);
  v_old_current DECIMAL(12,2) := 0;
BEGIN
  -- Decrypt current_amount and target_amount
  v_current := decrypt_amount(NEW.encrypted_current_amount)::DECIMAL;
  v_target := decrypt_amount(NEW.encrypted_target_amount)::DECIMAL;
  
  -- Get old current amount if exists
  IF OLD IS NOT NULL THEN
    v_old_current := decrypt_amount(OLD.encrypted_current_amount)::DECIMAL;
  END IF;
  
  -- Check if goal just reached 100% (only notify once when crossing threshold)
  IF v_current >= v_target AND v_old_current < v_target THEN
    PERFORM create_notification(
      NEW.user_id,
      '🎉 Meta Atingida!',
      FORMAT('Parabéns! Completaste a tua meta "%s"', NEW.name),
      '/dashboard/goals',
      'goal_achieved'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### **Passo 2: Criar os Triggers**

Executa no **Supabase SQL Editor**:

```sql
-- Trigger for budget thresholds
DROP TRIGGER IF EXISTS on_budget_threshold ON budgets;
CREATE TRIGGER on_budget_threshold
  AFTER INSERT OR UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION notify_budget_threshold();

-- Trigger for goal achieved
DROP TRIGGER IF EXISTS on_goal_achieved ON goals;
CREATE TRIGGER on_goal_achieved
  AFTER INSERT OR UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION notify_goal_achieved();
```

---

### **Passo 3: Verificar**

```sql
-- Check if triggers exist
SELECT 
  tgname as trigger_name, 
  tgrelid::regclass as table_name,
  tgfoid::regprocedure as function_name
FROM pg_trigger
WHERE tgname IN ('on_budget_threshold', 'on_goal_achieved');
```

**Resultado esperado:**
```
trigger_name        | table_name | function_name
--------------------+------------+------------------------
on_budget_threshold | budgets    | notify_budget_threshold()
on_goal_achieved    | goals      | notify_goal_achieved()
```

---

## 🧪 Testar Notificações

### **Teste 1: Botão de Teste (In-app)**

1. Abre a aplicação
2. Clica no botão 🔔 (canto superior esquerdo)
3. Clica em "🧪 Criar Notificação de Teste"
4. **Resultado:** Notificação aparece na lista

---

### **Teste 2: Budget 80% (Automática)**

1. Cria um orçamento com limite de 100€
2. Adiciona uma transação de 80€ na mesma categoria
3. **Resultado:** 
   - ✅ Notificação in-app aparece na campainha
   - ✅ Push notification aparece no browser

---

### **Teste 3: Meta Atingida (Automática)**

1. Cria uma meta com target de 1000€
2. Atualiza `current_amount` para 1000€
3. **Resultado:** 
   - ✅ Notificação in-app: "🎉 Meta Atingida!"
   - ✅ Push notification no browser

---

## 🔍 Debug

### **Ver notificações no database:**

```sql
SELECT 
  id,
  title,
  body,
  type,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

### **Verificar se user tem subscrição OneSignal:**

```sql
SELECT 
  user_id,
  onesignal_player_id,
  subscription_state,
  created_at
FROM onesignal_subscriptions
WHERE user_id = 'TEU_USER_ID';
```

### **Console do Browser:**

Abre DevTools (F12) e verifica os logs:
```
[useNotifications] Fetching notifications for user: xxx
[useNotifications] Fetched X notifications
[NotificationBell] notifications: X unread: Y
```

---

## 📁 Ficheiros Modificados

| Ficheiro | Mudanças |
|----------|----------|
| `src/components/NotificationBell.tsx` | ✅ Fixed positioning (desktop + mobile)<br>✅ Z-index corrigido<br>✅ Botão de teste |
| `src/hooks/useNotifications.ts` | ✅ Debug logging |
| `src/app/api/test-notification/route.ts` | ✅ **Novo**: API para criar notificações |
| `supabase/functions/send-push/index.ts` | ✅ Agora cria notificação in-app também |
| `supabase/migrations/20270425000000_inapp_notifications.sql` | ✅ Função `notify_budget_threshold()` corrigida |
| `supabase/migrations/20270501000000_notification_triggers.sql` | ✅ **Novo**: Cria os triggers |

---

## ✅ Resumo

**Antes:**
- ❌ Dropdown cortado no desktop
- ❌ Push notification aparecia, mas não in-app
- ❌ Triggers não existiam

**Agora:**
- ✅ Dropdown aparece completo
- ✅ Push + In-app funcionam juntos
- ✅ Triggers criam notificações automaticamente
- ✅ Botão de teste para debug
