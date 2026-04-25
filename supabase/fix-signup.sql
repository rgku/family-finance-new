-- ============================================
-- FIX SIGNUP - Corrigir erro "Database error saving new user"
-- Executar no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Testar a função handle_new_user() - Ver se existe e está a funcionar
-- ============================================

-- Ver se o trigger existe
SELECT tgname AS trigger_name, tgfoid::regprocedure AS function_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Testar a função 직접
SELECT public.handle_new_user() 
LIMIT 1;

-- ============================================
-- 2. Recriar a função handle_new_user() com tratamento de erros
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert, but don't fail if already exists
  INSERT INTO public.profiles (id, full_name, avatar_url, role, tier, member_limit)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'avatar_url',
    'owner',
    'free',
    5
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Garantir que o trigger está ativo
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. Testar novamente
-- ============================================

SELECT 'Trigger recreado com sucesso' AS resultado;

-- Verificar triggers ativos em auth.users
SELECT tgname AS trigger_name 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
AND tgname LIKE '%user%';