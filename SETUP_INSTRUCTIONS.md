# 🚀 Setup Instructions - FamFlow Premium

## Step 1: Execute Database Migrations

### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Copy the content of `supabase/migrations/20270423000000_recurring_transactions.sql`
3. Paste and click "Run"
4. Verify success message

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_ID

# Push migrations
npx supabase db push
```

---

## Step 2: Deploy Edge Functions

### Deploy process-recurring function:

```bash
# Navigate to functions directory
cd supabase/functions/process-recurring

# Deploy
npx supabase functions deploy process-recurring
```

### Set required secrets:

```bash
npx supabase functions secrets set \
  SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

---

## Step 3: Set Up Cron Job

Execute this SQL in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule recurring transactions processing daily at 09:00 UTC
SELECT cron.schedule(
  'process-recurring-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_ID.supabase.co/functions/v1/process-recurring',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  )
  $$
);
```

**Replace:**
- `YOUR_PROJECT_ID` with your Supabase project ID
- `YOUR_SERVICE_ROLE_KEY` with your service role key

---

## Step 4: Test the Setup

### Test Recurring Transactions:

1. Go to `/dashboard/recurring` in your app
2. Click "+ Nova Recorrência"
3. Fill in the form:
   - Description: "Netflix Test"
   - Amount: 15.99
   - Type: Despesa
   - Category: Lazer
   - Frequency: Mensal
   - Day: 15
   - Auto-create: Enabled
   - Start date: Today
4. Click "Criar Recorrência"
5. Verify it appears in the list

### Test Manual Trigger:

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/process-recurring \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "processed": 1,
  "created": 1,
  "notified": 0
}
```

### Verify Transaction Created:

1. Go to `/dashboard/transactions`
2. Look for "Netflix Test" transaction with today's date

---

## Step 5: Test CSV Import

### Download sample CSV:

**Revolut format:**
```csv
Data,Descrição,Valor,Categoria
2026-04-20,Netflix Portugal,€-15.99,Lazer
2026-04-19,Continente,€-85.50,Alimentação
2026-04-18,Salário,€1500.00,Renda
```

### Test Import:

1. Go to `/dashboard/settings/import`
2. Select "Revolut" from bank selector
3. Upload the CSV file
4. Verify preview shows 3 transactions
5. Click "Importar"
6. Check transactions appear in `/dashboard/transactions`

---

## Step 6: Verify Build

```bash
npm run build
```

Should complete without errors.

---

## ✅ Checklist

- [ ] Database migration executed
- [ ] Edge function deployed
- [ ] Cron job scheduled
- [ ] Recurring transaction created successfully
- [ ] Manual trigger tested
- [ ] Transaction auto-creation verified
- [ ] CSV import tested
- [ ] Build successful

---

## 🐛 Troubleshooting

### Cron job not running:

Check pg_cron is enabled:
```sql
SELECT * FROM cron.job;
```

### Edge function returns 500:

Check logs in Supabase Dashboard → Edge Functions → Logs

### CSV import fails:

Verify CSV format matches the selected bank preset. Check browser console for errors.

---

## 📞 Need Help?

Check `IMPLEMENTATION_LOG.md` for detailed progress and known issues.

**Last Updated:** April 22, 2026
