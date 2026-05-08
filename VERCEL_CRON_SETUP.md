# 🚀 Vercel Cron Setup

## Visão Geral

Vercel Cron permite executar API routes automaticamente em horários específicos.

## Cron Jobs Configurados

| Job | Schedule | Horário (UTC) | Horário (PT) |
|-----|----------|---------------|--------------|
| `process-recurring` | `0 9 * * *` | 09:00 | 10:00 |
| `inactivity-reminder` | `0 10 * * *` | 10:00 | 11:00 |
| `weekly-summary` | `0 18 * * 0` | 18:00 (Domingo) | 19:00 (Domingo) |

## Configuração

### 1. Variáveis de Ambiente (Vercel Dashboard)

No Vercel Dashboard do teu projeto, adiciona:

```
NEXT_PUBLIC_SUPABASE_URL=https://pqsjmavtkcrnorjemasq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<tua_service_role_key>
CRON_SECRET=<gerar_segredo_unico>
```

**Obter Service Role Key:**
1. Vai para https://supabase.com/dashboard/project/pqsjmavtkcrnorjemasq/settings/api
2. Copia a "service_role" key (não a "anon" key!)

**Gerar CRON_SECRET:**
```bash
# Gera um segredo único
openssl rand -hex 32
```

Ou usa este (já gerado): `IVpW9y02Bm45jAlD7hTsaJCLgQd8PiK1`

### 2. Deploy

```bash
# Commit e push
git add vercel.json src/app/api/process-recurring/route.ts src/app/api/weekly-summary/route.ts src/app/api/inactivity-reminder/route.ts
git commit -m "feat: Add Vercel Cron jobs for notifications"
git push

# Deploy na Vercel
vercel --prod
```

### 3. Verificar Cron Jobs

No Vercel Dashboard:
1. Vai para **Settings** → **Cron Jobs**
2. Devias ver 3 jobs listados

## Testar Manualmente

### Localmente

```bash
# Testar process-recurring
curl -X POST http://localhost:3000/api/process-recurring

# Testar weekly-summary
curl -X POST http://localhost:3000/api/weekly-summary

# Testar inactivity-reminder
curl -X POST http://localhost:3000/api/inactivity-reminder
```

### Produção (Vercel)

```bash
curl -X POST https://famflow.app/api/process-recurring
curl -X POST https://famflow.app/api/weekly-summary
curl -X POST https://famflow.app/api/inactivity-reminder
```

## Logs

### Vercel Dashboard

1. Vai para **Analytics** → **Logs**
2. Filtra por path: `/api/process-recurring`

### CLI

```bash
vercel logs <deployment-url> --follow
```

## Limites (Vercel Free)

- **100 execuções/dia** (chega para ~2 execuções/dia)
- **Max duration:** 60 segundos (configurado em `vercel.json`)
- **Timeout:** 60 segundos

## Troubleshooting

### Cron não executa

1. Verifica se **Cron Jobs** está ativo no Vercel Dashboard
2. Confirma variáveis de ambiente configuradas
3. Check logs: `vercel logs`

### Erro "Missing SUPABASE_SERVICE_ROLE_KEY"

Adiciona a variável de ambiente no Vercel Dashboard:
- **Settings** → **Environment Variables**

### Função timeout

Aumenta `maxDuration` em `vercel.json` (máx 60s no free tier)

## Reativar na UI

Depois de testado, re-adicionar em `/dashboard/alerts`:

- [ ] Recurring reminders toggle
- [ ] Weekly summary toggle
- [ ] Inactivity reminder toggle

## Links Úteis

- [Vercel Cron Docs](https://vercel.com/docs/cron-jobs)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://supabase.com/dashboard/project/pqsjmavtkcrnorjemasq)
