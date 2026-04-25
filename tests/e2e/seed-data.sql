-- Seed de Dados de Teste para E2E
-- Executar antes dos testes E2E no ambiente de desenvolvimento/staging
-- 
-- Uso: 
--   1. Conectar ao Supabase via SQL Editor
--   2. Executar este script
--   3. Usar as credenciais abaixo nos testes

-- ============================================
-- 1. Criar utilizador de teste
-- ============================================

-- Email: test@famflow.app
-- Password: Test1234!
-- IMPORTANTE: A password é hashada pelo Supabase Auth

-- ============================================
-- 2. Dados de exemplo para transações
-- ============================================

INSERT INTO transactions (
  user_id,
  description,
  amount,
  type,
  category,
  date,
  created_at
) VALUES
  -- Receitas
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Salário Mensal',
    3000.00,
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '1 month',
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Freelance Projeto',
    500.00,
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '15 days',
    NOW()
  ),
  
  -- Despesas - Alimentação
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Continente',
    85.50,
    'expense',
    'Alimentação',
    CURRENT_DATE - INTERVAL '10 days',
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Pingo Doce',
    42.30,
    'expense',
    'Alimentação',
    CURRENT_DATE - INTERVAL '5 days',
    NOW()
  ),
  
  -- Despesas - Transporte
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Combustível Galp',
    60.00,
    'expense',
    'Transporte',
    CURRENT_DATE - INTERVAL '7 days',
    NOW()
  ),
  
  -- Despesas - Casa
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Renda Mensal',
    800.00,
    'expense',
    'Casa',
    CURRENT_DATE - INTERVAL '1 day',
    NOW()
  ),
  
  -- Despesas - Lazer
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Netflix',
    12.99,
    'expense',
    'Lazer',
    CURRENT_DATE - INTERVAL '3 days',
    NOW()
  ),
  
  -- Despesas - Saúde
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Farmácia',
    25.50,
    'expense',
    'Saúde',
    CURRENT_DATE - INTERVAL '2 days',
    NOW()
  );

-- ============================================
-- 3. Metas de Poupança
-- ============================================

INSERT INTO goals (
  user_id,
  name,
  target_amount,
  current_amount,
  icon,
  goal_type,
  deadline,
  created_at
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Viagem de Verão',
    2000.00,
    750.00,
    'flight',
    'savings',
    CURRENT_DATE + INTERVAL '6 months',
    NOW() - INTERVAL '2 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Fundo de Emergência',
    5000.00,
    1200.00,
    'savings',
    'savings',
    CURRENT_DATE + INTERVAL '1 year',
    NOW() - INTERVAL '3 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Carro Novo',
    15000.00,
    3500.00,
    'directions_car',
    'savings',
    CURRENT_DATE + INTERVAL '2 years',
    NOW() - INTERVAL '6 months'
  );

-- ============================================
-- 4. Orçamentos Mensais
-- ============================================

INSERT INTO budgets (
  user_id,
  category,
  limit,
  spent,
  month
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Alimentação',
    400.00,
    127.80,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Transporte',
    200.00,
    60.00,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Lazer',
    150.00,
    12.99,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Saúde',
    100.00,
    25.50,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Casa',
    1000.00,
    800.00,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  );

-- ============================================
-- 5. Notificações de Exemplo
-- ============================================

INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  is_read,
  created_at
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Orçamento de Alimentação',
    'Atingiste 32% do teu orçamento de Alimentação este mês.',
    'budget_alert',
    false,
    NOW() - INTERVAL '1 day'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Meta Viagem de Verão',
    'Parabéns! Atingiste 37.5% da tua meta de poupança.',
    'goal_progress',
    false,
    NOW() - INTERVAL '2 days'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'Bem-vindo ao FamFlow',
    'Começa a acompanhar as tuas finanças hoje mesmo!',
    'welcome',
    true,
    NOW() - INTERVAL '1 month'
  );

-- ============================================
-- 6. Perfil do Utilizador (se não existir)
-- ============================================

INSERT INTO profiles (
  id,
  email,
  full_name,
  billing_cycle_day,
  currency,
  created_at
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'test@famflow.app'),
    'test@famflow.app',
    'Utilizador Teste',
    1,
    'EUR',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Utilizador Teste',
  billing_cycle_day = 1,
  currency = 'EUR';

-- ============================================
-- Resumo dos Dados Criados
-- ============================================
-- 
-- Utilizador: test@famflow.app
-- Password: Test1234!
--
-- Transações: 8 (2 receitas, 6 despesas)
-- Metas: 3 (Viagem, Emergência, Carro)
-- Orçamentos: 5 categorias
-- Notificações: 3 (2 não lidas, 1 lida)
--
-- Saldo estimado: ~2500 EUR
-- ============================================
