# 🚀 Deploy Guide - Notificações

## ✅ ESTADO ATUAL

### **Funcionais (100% Implementadas):**
- ✅ Budget 80%
- ✅ Budget 100%
- ✅ Meta Atingida
- ✅ Push Notifications (OneSignal)

### **Suspensas (Aguardam Implementação):**
- ⏸️ Lembrete de Recorrentes
- ⏸️ Resumo Semanal
- ⏸️ Lembrete de Inatividade

**Nota:** As notificações suspensas foram removidas da UI para não confundir os utilizadores. Ver `NOTIFICATIONS_STATUS.md` para detalhes.

---

## 📋 **O Que Está Implementado**

### **Database:**
- ✅ Tabela `notifications` criada
- ✅ Função `create_notification()` RPC
- ✅ Triggers automáticos (budgets, goals)
- ✅ Tabela `notification_preferences`

### **UI:**
- ✅ Página `/dashboard/alerts` com toggles funcionais
- ✅ Bell com navegação ao clicar
- ✅ Polling (5s) + Realtime subscriptions
- ✅ Badges de não lidas

### **Edge Functions (Criadas mas não Deployáveis):**
- ⏸️ `process-recurring` (código mantido para futuro)
- ⏸️ `weekly-summary` (código mantido para futuro)
- ⏸️ `inactivity-reminder` (código mantido para futuro)

### **Cron Jobs (Criados mas Inativos):**
- ⏸️ `recurring-reminder-daily` (0 9 * * *)
- ⏸️ `weekly-summary-sunday` (0 18 * * 0)
- ⏸️ `inactivity-reminder-daily` (0 10 * * *)

---

## ⚠️ **LIMITAÇÃO ATUAL**

**Problema:** O projeto Supabase está no **plano free antigo** que não suporta Edge Functions.

**Impacto:**
- ❌ Edge Functions não podem ser deployadas
- ❌ Cron jobs não funcionam (não têm funções para chamar)
- ❌ Notificações automáticas (recurring, weekly, inactivity) não funcionam

**Soluções Futuras:**
1. **Vercel Cron** (Recomendado - $0)
2. **Supabase Pro** ($25/mês)
3. **GitHub Actions** (Grátis)

Ver `NOTIFICATIONS_STATUS.md` para detalhes das opções.

---

## 📦 **DEPLOY DO QUE ESTÁ FUNCIONAL**

### **Não é necessário deploy!**

Tudo o que está funcional já está implementado e a funcionar:
- ✅ Budget alerts (database triggers)
- ✅ Goal alerts (database triggers)
- ✅ Notificações in-app
- ✅ Navegação ao clicar
- ✅ Realtime updates

**Só precisas de fazer deploy se quiseres implementar as notificações suspensas.**

---

## 🚀 **DEPLOY FUTURO (Quando Implementar Suspensas)**

### **Opção 1: Vercel Cron (Recomendado)**

**Passos:**
1. Criar API routes em `/api/*`
2. Configurar `vercel.json` com crons
3. Re-adicionar secções na UI
4. Deploy no Vercel

**Ver `NOTIFICATIONS_STATUS.md` para guia completo.**

---

### **Opção 2: Supabase Pro**

**Passos:**
1. Upgrade para Pro Plan ($25/mês)
2. Deploy Edge Functions:
   ```bash
   npx supabase functions deploy process-recurring
   npx supabase functions deploy weekly-summary
   npx supabase functions deploy inactivity-reminder
   ```
3. Re-adicionar secções na UI

---

### **Opção 3: GitHub Actions**

**Passos:**
1. Criar repositório separado
2. Criar scripts Node.js
3. Configurar workflows com crons
4. Re-adicionar secções na UI

---

## 🧪 **TESTES (Funcional Atual)**

### **Teste 1: Budget 80%**
1. Criar orçamento de 100€
2. Adicionar transação de 80€
3. ✅ Ver notificação na campainha

### **Teste 2: Budget 100%**
1. Adicionar mais 25€ (total 105€)
2. ✅ Ver notificação na campainha

### **Teste 3: Meta Atingida**
1. Criar meta de 1000€
2. Atualizar para 1000€
3. ✅ Ver notificação na campainha

### **Teste 4: Navegação**
1. Clica numa notificação
2. ✅ Navega para página correta

### **Teste 5: Realtime**
1. Abre console (F12)
2. Cria transação
3. ✅ Ver logs de realtime

---

## 📊 **MONITORING**

### **Ver Notificações Criadas:**
```sql
SELECT 
  type,
  title,
  created_at,
  read
FROM notifications
ORDER BY created_at DESC
LIMIT 20;
```

### **Ver Triggers:**
```sql
SELECT 
  tgname as trigger_name, 
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname IN ('on_budget_threshold', 'on_goal_achieved');
```

### **Ver Cron Jobs (Inativos):**
```sql
SELECT * FROM cron.job;
```

---

## 📝 **FICHEIROS MODIFICADOS**

### **Funcionais:**
- ✅ `src/app/dashboard/alerts/page.tsx` - UI (apenas notificações funcionais)
- ✅ `src/components/NotificationBell.tsx` - Navegação ao clicar
- ✅ `src/hooks/DataProvider.tsx` - Budget alerts logic
- ✅ `src/hooks/useNotifications.ts` - Polling + Realtime
- ✅ `supabase/migrations/20270425000000_inapp_notifications.sql` - Triggers

### **Suspensos (Código Mantido):**
- ⏸️ `supabase/functions/process-recurring/index.ts`
- ⏸️ `supabase/functions/weekly-summary/index.ts`
- ⏸️ `supabase/functions/inactivity-reminder/index.ts`
- ⏸️ `supabase/migrations/20270503000000_notification_cron_jobs.sql`

---

## ✅ **CHECKLIST FINAL**

### **Atual (Funcional):**
- [x] Budget alerts funcionais
- [x] Goal alerts funcionais
- [x] Navegação ao clicar
- [x] Realtime updates
- [x] UI limpa (apenas funcional)

### **Futuro (Quando Implementar):**
- [ ] Escolher plataforma (Vercel/Supabase/GitHub)
- [ ] Implementar scripts/funções
- [ ] Configurar schedules
- [ ] Re-adicionar na UI
- [ ] Testar
- [ ] Deploy

---

## 📞 **SUPORTE**

**Documentação:**
- `NOTIFICATIONS_STATUS.md` - Estado detalhado das notificações
- `PUSH_DEBUG_GUIDE.md` - Debug de push notifications
- `NOTIFICATIONS_FIX.md` - Histórico de correções

**SQL Útil:**
- `supabase/notifications-utility.sql` - Queries de gestão
- `supabase/reset-budget-alerts.sql` - Reset para testes

---

**Última atualização:** 2026-04-23
**Status:** ✅ Funcional (4 notificações), ⏸️ Suspensas (3 notificações)
