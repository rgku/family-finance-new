-- ========================================
-- FIX: Criar profile em falta para utilizador
-- ========================================
-- Utilizador: c12527c1-3b4f-49aa-88fb-840e18cd1239
-- Problema: Profile não existe na tabela profiles

-- 1. CRIAR PROFILE PARA O UTILIZADOR
INSERT INTO public.profiles (
  id,
  family_id,
  billing_cycle_day
) VALUES (
  'c12527c1-3b4f-49aa-88fb-840e18cd1239',
  NULL,  -- Sem família por enquanto
  1      -- Ciclo de faturação: dia 1 (mês civil)
)
ON CONFLICT (id) DO NOTHING;

-- 2. VERIFICAR SE FOI CRIADO
SELECT 
  id,
  family_id,
  billing_cycle_day,
  created_at
FROM public.profiles
WHERE id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239';

-- 3. (OPCIONAL) CRIAR FAMÍLIA PARA O UTILIZADOR
-- Descomenta se quiseres que o utilizador tenha uma família
/*
INSERT INTO public.families (name, created_at)
VALUES ('Família de raquelmachado.fba@gmail.com', NOW())
RETURNING id;

-- Depois associa a família ao profile
UPDATE public.profiles
SET family_id = (SELECT id FROM public.families ORDER BY created_at DESC LIMIT 1)
WHERE id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239';
*/

-- 4. VERIFICAR TRANSAÇÕES DO UTILIZADOR
SELECT 
  id,
  description,
  amount,
  type,
  category,
  date,
  family_id,
  created_at
FROM public.transactions
WHERE user_id = 'c12527c1-3b4f-49aa-88fb-840e18cd1239'
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- EXPECTATIVA:
-- ========================================
-- ✅ Profile criado com sucesso
-- ✅ billing_cycle_day = 1 (mês civil)
-- ✅ family_id = NULL (pode ser atualizado depois)
-- ✅ Utilizador consegue adicionar transações
-- ========================================
