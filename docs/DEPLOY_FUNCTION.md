# 🚀 Deploy Script - process-recurring

## Opção A: Login Automático (Recomendado)

1. **Executa este comando no terminal:**
   ```bash
   cd "C:\Users\rgku\Documents\App\Projecto Antigravity\family-finance-new\family-finance-app"
   npx supabase login
   ```

2. **O browser vai abrir automaticamente** - faz login com a tua conta Supabase

3. **Depois do login, executa:**
   ```bash
   npx supabase link --project-ref pqsjmavtkcrnorjemasq
   ```

4. **Finalmente, faz deploy:**
   ```bash
   npx supabase functions deploy process-recurring
   ```

---

## Opção B: Usar Token Manualmente

1. **Vai a:** https://supabase.com/dashboard/account/tokens

2. **Copia o teu access token**

3. **Executa:**
   ```bash
   npx supabase login --token TEU_TOKEN_AQUI
   ```

4. **Link ao projeto:**
   ```bash
   npx supabase link --project-ref pqsjmavtkcrnorjemasq
   ```

5. **Deploy:**
   ```bash
   npx supabase functions deploy process-recurring
   ```

---

## Opção C: Dashboard UI (Sem CLI)

1. **Vai para:** https://supabase.com/dashboard/project/pqsjmavtkcrnorjemasq/functions

2. **Clica em "New Function"**

3. **Nome:** `process-recurring`

4. **Copia o conteúdo do ficheiro:** `supabase/functions/process-recurring/index.ts`

5. **Cola no editor do Dashboard**

6. **Adiciona Environment Variables:**
   - `SUPABASE_URL` = `https://pqsjmavtkcrnorjemasq.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (encontras em Project Settings → API)

7. **Clica em "Deploy"**

---

## ✅ Verificar Deploy

Depois do deploy, a função deve estar disponível em:
```
https://pqsjmavtkcrnorjemasq.supabase.co/functions/v1/process-recurring
```

Podes testar no Dashboard da função com:
- Method: POST
- Body: `{}`
- Headers: Content-Type: application/json

Resposta esperada:
```json
{
  "success": true,
  "processed": 0,
  "created": 0,
  "notified": 0
}
```

---

**Depois de completar, avisa para prosseguir com o cron job!**
