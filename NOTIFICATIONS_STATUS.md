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

## ⏸️ Notificações Suspensas (Aguardam Implementação)

Estas notificações **não estão disponíveis** na UI porque requerem infraestrutura adicional.

### **1. Lembrete de Recorrentes**
- **Trigger:** Diário (09:00 UTC)
- **URL:** `/dashboard/transaction/new`
- **Método Necessário:** Cron job + Edge Function ou Vercel
- **Status:** ⏸️ Suspenso
- **Preferência:** `recurring_reminder` (removida da UI)
- **Implementação Futura:** Vercel Cron ou Supabase Pro

### **2. Resumo Semanal**
- **Trigger:** Domingo (18:00 UTC)
- **URL:** `/dashboard/analytics`
- **Método Necessário:** Cron job + Edge Function ou Vercel
- **Status:** ⏸️ Suspenso
- **Preferência:** `weekly_summary` (removida da UI)
- **Implementação Futura:** Vercel Cron ou Supabase Pro

### **3. Lembrete de Inatividade**
- **Trigger:** 3 dias sem transações (10:00 UTC)
- **URL:** `/dashboard/transactions`
- **Método Necessário:** Cron job + Edge Function ou Vercel
- **Status:** ⏸️ Suspenso
- **Preferência:** `inactivity_reminder` (removida da UI)
- **Implementação Futura:** Vercel Cron ou Supabase Pro

---

## 📊 Resumo

| Categoria | Funcional | Suspenso |
|-----------|-----------|----------|
| **Budget Alerts** | ✅ 2 | - |
| **Goal Alerts** | ✅ 1 | - |
| **Push Notifications** | ✅ 1 | - |
| **Automated (Cron)** | - | ⏸️ 3 |
| **TOTAL** | **✅ 4** | **⏸️ 3** |

---

## 🚀 Como Reativar Notificações Suspensas

### **Opção 1: Vercel Cron (Recomendado - $0)**

**Requisitos:**
- Conta Vercel
- Variáveis de ambiente configuradas

**Implementação:**
1. Criar API routes `/api/process-recurring`, `/api/weekly-summary`, `/api/inactivity-reminder`
2. Configurar `vercel.json` com crons
3. Re-adicionar secções na página `/dashboard/alerts`

**Custo:** Gratis (100 execuções/dia, suficiente para ~2/dia)

---

### **Opção 2: Supabase Pro ($25/mês)**

**Requisitos:**
- Upgrade para Pro Plan
- Edge Functions deploy

**Implementação:**
1. Fazer upgrade no Supabase Dashboard
2. Deploy das Edge Functions (`process-recurring`, `weekly-summary`, `inactivity-reminder`)
3. Cron jobs já estão criados no pg_cron
4. Re-adicionar secções na página `/dashboard/alerts`

**Custo:** $25/mês

---

### **Opção 3: GitHub Actions (Grátis)**

**Requisitos:**
- Repositório GitHub separado
- Scripts Node.js

**Implementação:**
1. Criar repositório `famflow-notifications`
2. Criar workflows com cron triggers
3. Scripts Node.js que conectam ao Supabase
4. Re-adicionar secções na página `/dashboard/alerts`

**Custo:** Gratis (2000 minutos/mês)

---

## 📝 Ficheiros Relacionados

### **Funcionais:**
- `src/app/dashboard/alerts/page.tsx` - UI de notificações
- `src/hooks/DataProvider.tsx` - Budget alerts logic
- `src/hooks/useNotifications.ts` - Fetch e realtime
- `src/components/NotificationBell.tsx` - Bell com navegação
- `supabase/migrations/20270425000000_inapp_notifications.sql` - Database triggers

### **Suspensos (para futuro):**
- `supabase/functions/process-recurring/index.ts` - Edge Function (não deployável)
- `supabase/functions/weekly-summary/index.ts` - Edge Function (não deployável)
- `supabase/functions/inactivity-reminder/index.ts` - Edge Function (não deployável)
- `supabase/migrations/20270503000000_notification_cron_jobs.sql` - Cron jobs (inativos)

---

## 🎯 Próximos Passos (Quando Implementar)

1. **Escolher plataforma:** Vercel vs Supabase Pro vs GitHub Actions
2. **Implementar scripts/funções**
3. **Configurar schedules**
4. **Testar manualmente**
5. **Re-adicionar na UI** (remover comentários no `alerts/page.tsx`)
6. **Deploy e monitorização**

---

## ⚠️ Notas Importantes

1. **Preferências no Database:** As colunas `recurring_reminder`, `weekly_summary`, `inactivity_reminder` ainda existem na tabela `notification_preferences`, mas não são usadas na UI.

2. **Cron Jobs:** Os cron jobs foram criados no pg_cron mas não funcionam porque as Edge Functions não podem ser deployadas no plano free.

3. **Código Mantido:** Todo o código das notificações suspensas foi mantido para facilitar implementação futura.

4. **UI Limpa:** A página de alerts mostra apenas funcionalidades que funcionam 100%.

---

**Última atualização:** 2026-04-23
**Status:** ✅ 4 notificações funcionais, ⏸️ 3 suspensas
