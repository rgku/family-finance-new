-- ============================================
-- VERIFICAR BUDGETS E RLS POLICIES
-- ============================================

-- 1. Verificar se budgets existem para o utilizador
SELECT 
  id,
  category,
  limit_amount,
  month,
  created_at
FROM budgets
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar estrutura da tabela budgets
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'budgets'
ORDER BY ordinal_position;

-- 3. Verificar RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'budgets';

-- 4. Verificar se RLS está ativo
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'budgets';

-- 5. Criar budget de teste (se não existir)
INSERT INTO budgets (user_id, category, month, limit_amount)
VALUES (
  '0c46d5ba-bf36-49c1-84e6-6a95d52369bb',
  'Lazer',
  DATE_TRUNC('month', NOW()),
  200
)
ON CONFLICT (user_id, category, month) 
DO UPDATE SET limit_amount = 200
RETURNING *;

-- 6. Testar query simplificada
SELECT * FROM budgets 
WHERE user_id = '0c46d5ba-bf36-49c1-84e6-6a95d52369bb'
  AND category = 'Lazer'
  AND month >= '2026-04-01'
  AND month < '2026-05-01';
