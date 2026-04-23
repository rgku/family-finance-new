# OneSignal Push Notifications - Setup Guide

## 📋 Pré-requisitos

- Conta OneSignal (grátis)
- Supabase project
- Browser moderno (Chrome, Firefox, Edge, Safari)

---

## 🚀 Passo 1: Criar Conta OneSignal

1. Vai a [https://onesignal.com](https://onesignal.com)
2. Clica em **"Sign Up"** (ou login com Google/GitHub)
3. Confirma o teu email

---

## 📱 Passo 2: Criar App Web Push

1. No dashboard OneSignal, clica em **"Add App"**
2. Seleciona **"Website"**
3. Escolhe **"Custom Integration"** (mais controlo)
4. Preenche:
   - **App Name**: `FamFlow`
   - **Region**: `European Union (Frankfurt)` - GDPR compliant
5. Clica em **"Create"**

---

## 🔑 Passo 3: Obter Credenciais

Na página do teu app OneSignal:

1. **App Settings** → **Keys & IDs**
2. Copia:
   - **App ID** → `YOUR_APP_ID`
   - **REST API Key** → `YOUR_REST_API_KEY`

---

## 📝 Passo 4: Adicionar ao `.env.local`

Abre `family-finance-app/.env.local`:

```env
# OneSignal
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONESIGNAL_REST_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Substitui pelos teus valores!**

---

## 🗄️ Passo 5: Executar Migration no Supabase

1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleciona o teu projeto
3. Vai a **SQL Editor**
4. Clica em **"New Query"**
5. Copia e cola o conteúdo de:
   ```
   supabase/migrations/20270427000000_onesignal_integration.sql
   ```
6. Clica em **"Run"**

---

## 🚀 Passo 6: Deploy da Edge Function

No terminal:

```bash
cd family-finance-app

# Login no Supabase (se ainda não estás)
npx supabase login

# Link ao teu projeto
npx supabase link --project-ref pqsjmavtkcrnorjemasq

# Set secrets
npx supabase secrets set ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
npx supabase secrets set ONESIGNAL_REST_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Deploy da função
npx supabase functions deploy send-push
```

---

## 🧪 Passo 7: Testar

1. **Reinicia o servidor**:
   ```bash
   npm run dev
   ```

2. **Abre a app**: http://localhost:3000

3. **Vai a `/dashboard/alerts`**

4. **Clica em "Ativar Notificações"**

5. **Permite no browser**

6. **Deves ver**:
   - ✅ Toggle fica "Ativas"
   - ✅ Ícone de notificações verde
   - ✅ Mensagem "Notificações push ativadas!"

---

## 🎯 Passo 8: Configurar Domínios (Produção)

No OneSignal Dashboard:

1. **App Settings** → **Web Push**
2. **Site Settings**
3. Adiciona:
   - **Site URL**: `https://famflow.app` (ou teu domínio)
   - **Allowed Domains**: `*.famflow.app`

---

## 🔧 Troubleshooting

### Erro: "OneSignal App ID not configured"
- ✅ Verifica se `ONESIGNAL_APP_ID` está no `.env.local`
- ✅ Reinicia o servidor (`Ctrl+C` → `npm run dev`)

### Erro: "User not subscribed to push notifications"
- ✅ Verifica se a migration foi executada no Supabase
- ✅ Verifica se o utilizador tem registo em `onesignal_subscriptions`

### Push não chega
- ✅ Verifica se `ONESIGNAL_REST_API_KEY` está correta
- ✅ Verifica logs da Edge Function:
  ```bash
  npx supabase functions logs send-push
  ```

### Erro CORS
- ✅ Verifica se os headers CORS estão corretos na Edge Function
- ✅ Em dev, usa sempre localhost:3000

---

## 📊 Como Funciona

### Fluxo de Subscrição:
```
1. User clica "Ativar Notificações"
   ↓
2. OneSignal SDK pede permissão
   ↓
3. Browser mostra popup de permissão
   ↓
4. User permite
   ↓
5. OneSignal gera Player ID único
   ↓
6. Player ID guardado no Supabase
   ↓
7. Push notifications ativas!
```

### Fluxo de Notificação:
```
1. Evento trigger (ex: budget 100%)
   ↓
2. App cria notificação in-app
   ↓
3. Chama Edge Function `send-push`
   ↓
4. Edge Function chama OneSignal API
   ↓
5. OneSignal envia push para o browser
   ↓
6. User recebe notificação (mesmo com browser fechado!)
```

---

## 🎯 Tipos de Notificações

| Tipo | Trigger | Preferência |
|------|---------|-------------|
| Orçamento 80% | Budget atinge 80% | `budget_80_percent` |
| Orçamento 100% | Budget esgotado | `budget_100_percent` |
| Meta Atingida | Goal completada | `goal_achieved` |
| Recorrentes | Transação recorrente | `recurring_reminder` |
| Resumo Semanal | Domingo 08:00 UTC | `weekly_summary` |
| Inatividade | 7 dias sem transações | `inactivity_reminder` |

---

## ✅ Checklist Final

- [ ] Conta OneSignal criada
- [ ] App Web Push configurado
- [ ] Credenciais no `.env.local`
- [ ] Migration executada no Supabase
- [ ] Edge Function deploy
- [ ] Testado em localhost
- [ ] Domínio de produção configurado

---

## 📚 Links Úteis

- [OneSignal Docs](https://documentation.onesignal.com/)
- [OneSignal API Reference](https://documentation.onesignal.com/reference/rest-api-overview)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Dúvidas?** Consulta a documentação oficial ou abre issue no GitHub! 🚀
