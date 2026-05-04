-- ========================================
-- DIAGNÓSTICO: Utilizador c12527c1-3b4f-49aa-88fb-840e18cd1239
-- ========================================
-- Executa estas queries no SQL Editor do Supabase
-- para diagnosticar problema de adição de transações

-- 1. VERIFICAR SE O USER EXISTE NO AUTH
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  phone_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239';

-- 2. VERIFICAR SE EXISTE PROFILE
SELECT 
  id,
  email,
  family_id,
  billing_cycle_day,
  created_at,
  updated_at
FROM public.profiles
WHERE id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239';

-- 3. VERIFICAR SE A FAMÍLIA EXISTE (se tiver family_id)
SELECT 
  f.id,
  f.name,
  f.created_at,
  COUNT(DISTINCT m.user_id) as member_count
FROM public.families f
LEFT JOIN public.family_members m ON m.family_id = f.id
WHERE f.id = (SELECT family_id FROM public.profiles WHERE id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239')
GROUP BY f.id, f.name, f.created_at;

-- 4. VERIFICAR SE CONSEGUE INSERIR TRANSAÇÕES (TESTE DIRETO)
-- Este teste tenta inserir uma transação de teste
INSERT INTO public.transactions (
  user_id,
  family_id,
  description,
  amount,
  type,
  category,
  date
) VALUES (
  'c12527c1-3b4f-49aa-88fb-840e18cd1239',
  (SELECT family_id FROM public.profiles WHERE id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239'),
  'TESTE - Podes apagar',
  0.01,
  'expense',
  'Outros',
  CURRENT_DATE
)
RETURNING id, user_id, family_id, description;

-- 5. VERIFICAR SE A TRANSAÇÃO FOI CRIADA
SELECT 
  id,
  user_id,
  family_id,
  description,
  amount,
  type,
  category,
  date,
  created_at
FROM public.transactions
WHERE user_id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239'
ORDER BY created_at DESC
LIMIT 5;

-- 6. VERIFICAR RLS - O USER CONSEGUE LER AS SUAS TRANSAÇÕES?
SELECT 
  current_setting('request.jwt.claims')::json->>'sub' as current_user,
  COUNT(*) as total_transactions,
  MAX(created_at) as last_transaction
FROM public.transactions
WHERE user_id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239';

-- 7. VERIFICAR SE HÁ ERROS DE INSERÇÃO COM POLICIES
-- Tenta inserir com RLS ativo (pode falhar se policies estiverem mal)
DO $$
DECLARE
  v_family_id UUID;
  v_result UUID;
BEGIN
  SELECT family_id INTO v_family_id 
  FROM public.profiles 
  WHERE id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239';
  
  INSERT INTO public.transactions (
    user_id,
    family_id,
    description,
    amount,
    type,
    category,
    date
  ) VALUES (
    'c12527c1-3b4f-49aa-88fb-840e18cd1239',
    v_family_id,
    'TESTE RLS - Podes apagar',
    0.01,
    'expense',
    'Outros',
    CURRENT_DATE
  ) RETURNING id INTO v_result;
  
  RAISE NOTICE 'Inserção bem sucedida! ID: %', v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERRO AO INSERIR: % - %', SQLERRM, SQLSTATE;
END $$;

-- 8. VERIFICAR POLICIES ATIVAS NA TABELA TRANSACTIONS
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
WHERE tablename = 'transactions'
ORDER BY policyname;

-- 9. VERIFICAR SE O USER TEM PERMISSÃO DE INSERT
SELECT 
  r.rolname as role_name,
  CASE 
    WHEN has_table_privilege(r.rolname, 'public.transactions', 'INSERT') 
    THEN '✅ INSERT permitido'
    ELSE '❌ INSERT negado'
  END as insert_privilege,
  CASE 
    WHEN has_table_privilege(r.rolname, 'public.transactions', 'SELECT') 
    THEN '✅ SELECT permitido'
    ELSE '❌ SELECT negado'
  END as select_privilege
FROM pg_roles r
WHERE r.rolname IN ('authenticated', 'anon', 'service_role');

-- 10. LIMPAR TRANSAÇÕES DE TESTE (após diagnóstico)
-- DELETE FROM public.transactions 
-- WHERE description LIKE 'TESTE%' 
-- AND user_id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239';

-- ========================================
-- RESULTADOS ESPERADOS:
-- ========================================
-- ✅ Query 1: User deve existir com email_confirmed_at != NULL
-- ✅ Query 2: Profile deve existir com family_id != NULL
-- ✅ Query 3: Família deve existir (se tiver family_id)
-- ✅ Query 4/7: Inserção deve retornar um ID
-- ✅ Query 5: Transação deve aparecer na lista
-- ✅ Query 8: Policies devem incluir INSERT para 'authenticated'
-- ========================================
