-- ========================================
-- FIX: Criar profile automaticamente para novos utilizadores
-- ========================================

-- 1. CRIAR FUNÇÃO QUE CRIA PROFILE AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (id, billing_cycle_day, created_at)
  VALUES (
    NEW.id,
    1,  -- Default: mês civil (dia 1)
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CRIAR TRIGGER NO AUTH.USERS
-- Nota: Este trigger é criado na schema auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. VERIFICAR SE A FUNÇÃO FOI CRIADA
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 4. VERIFICAR SE O TRIGGER FOI CRIADO
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 5. TESTAR - CRIAR UM NOVO PROFILE PARA UTILIZADORES EXISTENTES SEM PROFILE
-- (Isto corrige utilizadores já existentes que não têm profile)
INSERT INTO public.profiles (id, billing_cycle_day, created_at)
SELECT 
  u.id,
  1,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. VERIFICAR QUANTOS PROFILES FORAM CRIADOS
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as profiles_created,
  COUNT(*) - COUNT(p.id) as missing_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;

-- ========================================
-- EXPECTATIVA:
-- ========================================
-- ✅ Trigger criado com sucesso
-- ✅ Função handle_new_user() criada
-- ✅ Todos os utilizadores existentes agora têm profile
-- ✅ Novos utilizadores vão ter profile automaticamente
-- ========================================
