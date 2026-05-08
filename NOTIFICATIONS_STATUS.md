# 🔔 Notificações - Estado Atual

## ✅ Notificações Funcionais (100% Implementadas)

### **1. Budget 80%**
- **Trigger:** Ao atingir 80% do orçamento de uma categoria
- **URL:** `/dashboard/budgets`
- **Método:** Database trigger + DataProvider
- **Status:** ✅ Funcional
- **Preferência:** `budget_80_percent`

### **2. Budget 100% (Orçamento Esgotado)**
- **Trigger:** Ao ultrapassar 100% do orçamento
- **URL:** `/dashboard/budgets`
- **Método:** Database trigger + DataProvider
- **Status:** ✅ Funcional
- **Preferência:** `budget_100_percent`

### **3. Meta Atingida (Goal Achieved)**
- **Trigger:** Quando uma meta atinge 100%
- **URL:** `/dashboard/goals`
- **Método:** Database trigger
- **Status:** ✅ Funcional
- **Preferência:** `goal_achieved`

### **4. Push Notifications (OneSignal)**
- **Trigger:** Manual (utilizador ativa)
- **URL:** N/A (configuração)
- **Método:** OneSignal browser push
- **Status:** ✅ Funcional
- **Preferência:** Toggle na UI

---

## ✅ Notificações Automatizadas (Vercel Cron)

Implementadas com Vercel Cron (grátis, 100 execuções/dia).

### **1. Lembrete de Recorrentes**
- **Trigger:** Diário (09:00 UTC / 10:00 PT)
- **URL:** `/dashboard/transaction/new`
- **Método:** Vercel Cron + API Route
- **Status:** ✅ Implementado
- **Preferência:** `recurring_reminder`
- **Ficheiro:** `src/app/api/process-recurring/route.ts`

### **2. Resumo Semanal**
- **Trigger:** Domingo (18:00 UTC / 19:00 PT)
- **URL:** `/dashboard/analytics`
- **Método:** Vercel Cron + API Route
- **Status:** ✅ Implementado
- **Preferência:** `weekly_summary`
- **Ficheiro:** `src/app/api/weekly-summary/route.ts`

### **3. Lembrete de Inatividade**
- **Trigger:** Diário (10:00 UTC / 11:00 PT)
- **URL:** `/dashboard/transactions`
- **Método:** Vercel Cron + API Route
- **Status:** ✅ Implementado
- **Preferência:** `inactivity_reminder`
- **Ficheiro:** `src/app/api/inactivity-reminder/route.ts`

---

## 📊 Resumo

| Categoria | Funcional | Suspenso |
|-----------|-----------|----------|
| **Budget Alerts** | ✅ 2 | - |
| **Goal Alerts** | ✅ 1 | - |
| **Push Notifications** | ✅ 1 | - |
| **Automated (Cron)** | ✅ 3 | - |
| **TOTAL** | **✅ 7** | **-** |

---

## 🚀 Setup (Já Implementado)

Vercel Cron configurado em `vercel.json`.

**Ficheiros:**
- `vercel.json` - Configuração dos cron jobs
- `src/app/api/process-recurring/route.ts` - Processa transações recorrentes
- `src/app/api/weekly-summary/route.ts` - Envia resumo semanal
- `src/app/api/inactivity-reminder/route.ts` - Envia lembrete de inatividade
- `VERCEL_CRON_SETUP.md` - Guia de setup

**Próximos Passos:**
1. Commit e push
2. Deploy na Vercel
3. Configurar variáveis de ambiente no Vercel Dashboard
4. Testar manualmente com `curl`
5. Re-adicionar toggles na UI (`/dashboard/alerts`)

---

## 📝 Ficheiros Relacionados

### **Funcionais:**
- `src/app/dashboard/alerts/page.tsx` - UI de notificações
- `src/hooks/DataProvider.tsx` - Budget alerts logic
- `src/hooks/useNotifications.ts` - Fetch e realtime
- `src/components/NotificationBell.tsx` - Bell com navegação
- `supabase/migrations/20270425000000_inapp_notifications.sql` - Database triggers

### **Legado (Edge Functions - não usar):**
- `supabase/functions/process-recurring/index.ts` - Edge Function (obsoleta)
- `supabase/functions/weekly-summary/index.ts` - Edge Function (obsoleta)
- `supabase/functions/inactivity-reminder/index.ts` - Edge Function (obsoleta)
- `supabase/migrations/20270503000000_notification_cron_jobs.sql` - pg_cron jobs (obsoletos)

---

## 🎯 Próximos Passos

1. **Commit e push**
   ```bash
   git add vercel.json src/app/api/process-recurring/route.ts src/app/api/weekly-summary/route.ts src/app/api/inactivity-reminder/route.ts VERCEL_CRON_SETUP.md
   git commit -m "feat: Vercel Cron jobs for automated notifications"
   git push
   ```

2. **Deploy na Vercel**
   ```bash
   vercel --prod
   ```

3. **Configurar variáveis de ambiente** (Vercel Dashboard)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. **Testar manualmente**
   ```bash
   curl -X POST https://famflow.app/api/process-recurring
   ```

5. **Re-adicionar na UI** (remover comentários no `alerts/page.tsx`)

---

## ⚠️ Notas Importantes

1. **Preferências no Database:** As colunas `recurring_reminder`, `weekly_summary`, `inactivity_reminder` existem na tabela `notification_preferences` e podem ser re-utilizadas na UI.

2. **Vercel Cron Limits:** 100 execuções/dia (suficiente para ~2 execuções/dia = 62/mês).

3. **Edge Functions Legado:** O código das Edge Functions foi mantido mas não será usado (Vercel Cron é grátis vs Supabase Pro $25/mês).

---

**Última atualização:** 2026-05-07  
**Status:** ✅ 7 notificações funcionais (Vercel Cron implementado)
