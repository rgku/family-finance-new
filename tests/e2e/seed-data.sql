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

-- Email: rang1kuwr@hotmail.com
-- Password: Test1234!
-- IMPORTANTE: A password é hashada pelo Supabase Auth

-- ============================================
-- 2. Dados de exemplo para transações
-- ============================================

INSERT INTO transactions (
  user_id,
  encrypted_description,
  encrypted_amount,
  type,
  category,
  date,
  created_at
) VALUES
  -- Receitas
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Salário Mensal'),
    encrypt_amount(3000.00),
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '1 month',
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Freelance Projeto'),
    encrypt_amount(500.00),
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '15 days',
    NOW()
  ),
  
  -- Despesas - Alimentação
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Continente'),
    encrypt_amount(85.50),
    'expense',
    'Alimentação',
    CURRENT_DATE - INTERVAL '10 days',
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Pingo Doce'),
    encrypt_amount(42.30),
    'expense',
    'Alimentação',
    CURRENT_DATE - INTERVAL '5 days',
    NOW()
  ),
  
  -- Despesas - Transporte
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Combustível Galp'),
    encrypt_amount(60.00),
    'expense',
    'Transporte',
    CURRENT_DATE - INTERVAL '7 days',
    NOW()
  ),
  
  -- Despesas - Casa
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Renda Mensal'),
    encrypt_amount(800.00),
    'expense',
    'Casa',
    CURRENT_DATE - INTERVAL '1 day',
    NOW()
  ),
  
  -- Despesas - Lazer
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Netflix'),
    encrypt_amount(12.99),
    'expense',
    'Lazer',
    CURRENT_DATE - INTERVAL '3 days',
    NOW()
  ),
  
  -- Despesas - Saúde
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Farmácia'),
    encrypt_amount(25.50),
    'expense',
    'Saúde',
    CURRENT_DATE - INTERVAL '2 days',
    NOW()
  ),
  
  -- Histórico de transações (para analytics ter dados de múltiplos meses)
  -- Mês -2
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Salário Mensal'),
    encrypt_amount(3000.00),
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '2 months',
    NOW() - INTERVAL '2 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Mercado'),
    encrypt_amount(120.00),
    'expense',
    'Alimentação',
    CURRENT_DATE - INTERVAL '2 months',
    NOW() - INTERVAL '2 months'
  ),
  -- Mês -3
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Salário Mensal'),
    encrypt_amount(3000.00),
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '3 months',
    NOW() - INTERVAL '3 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Conta Luz'),
    encrypt_amount(65.00),
    'expense',
    'Casa',
    CURRENT_DATE - INTERVAL '3 months',
    NOW() - INTERVAL '3 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Uber'),
    encrypt_amount(35.00),
    'expense',
    'Transporte',
    CURRENT_DATE - INTERVAL '3 months',
    NOW() - INTERVAL '3 months'
  ),
  -- Mês -4
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Salário Mensal'),
    encrypt_amount(2800.00),
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '4 months',
    NOW() - INTERVAL '4 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Restaurante'),
    encrypt_amount(45.00),
    'expense',
    'Alimentação',
    CURRENT_DATE - INTERVAL '4 months',
    NOW() - INTERVAL '4 months'
  ),
  -- Mês -5
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Salário Mensal'),
    encrypt_amount(2800.00),
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '5 months',
    NOW() - INTERVAL '5 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Spotify'),
    encrypt_amount(9.99),
    'expense',
    'Lazer',
    CURRENT_DATE - INTERVAL '5 months',
    NOW() - INTERVAL '5 months'
  ),
  -- Mês -6
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Salário Mensal'),
    encrypt_amount(2800.00),
    'income',
    'Salário',
    CURRENT_DATE - INTERVAL '6 months',
    NOW() - INTERVAL '6 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    encrypt_text('Farmácia'),
    encrypt_amount(18.00),
    'expense',
    'Saúde',
    CURRENT_DATE - INTERVAL '6 months',
    NOW() - INTERVAL '6 months'
  );

-- ============================================
-- 3. Metas de Poupança
-- ============================================

INSERT INTO goals (
  user_id,
  name,
  encrypted_target_amount,
  encrypted_current_amount,
  icon,
  goal_type,
  deadline,
  created_at
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Viagem de Verão',
    encrypt_amount(2000.00),
    encrypt_amount(750.00),
    'flight',
    'savings',
    CURRENT_DATE + INTERVAL '6 months',
    NOW() - INTERVAL '2 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Fundo de Emergência',
    encrypt_amount(5000.00),
    encrypt_amount(1200.00),
    'savings',
    'savings',
    CURRENT_DATE + INTERVAL '1 year',
    NOW() - INTERVAL '3 months'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Carro Novo',
    encrypt_amount(15000.00),
    encrypt_amount(3500.00),
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
  month,
  limit_amount
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Alimentação',
    DATE_TRUNC('month', CURRENT_DATE),
    400.00
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Transporte',
    DATE_TRUNC('month', CURRENT_DATE),
    200.00
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Lazer',
    DATE_TRUNC('month', CURRENT_DATE),
    150.00
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Saúde',
    DATE_TRUNC('month', CURRENT_DATE),
    100.00
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Casa',
    DATE_TRUNC('month', CURRENT_DATE),
    1000.00
  )
ON CONFLICT (user_id, category, month) DO UPDATE SET
  limit_amount = EXCLUDED.limit_amount;

-- ============================================
-- 5. Notificações de Exemplo
-- ============================================

INSERT INTO notifications (
  user_id,
  title,
  body,
  type,
  read,
  created_at
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Orçamento de Alimentação',
    'Atingiste 32% do teu orçamento de Alimentação este mês.',
    'budget_alert',
    false,
    NOW() - INTERVAL '1 day'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Meta Viagem de Verão',
    'Parabéns! Atingiste 37.5% da tua meta de poupança.',
    'goal_progress',
    false,
    NOW() - INTERVAL '2 days'
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
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
  full_name,
  billing_cycle_day,
  created_at
) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'rang1kuwr@hotmail.com'),
    'Utilizador Teste',
    1,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = 'Utilizador Teste',
  billing_cycle_day = 1;

-- ============================================
-- Resumo dos Dados Criados
-- ============================================
-- 
-- Utilizador: rang1kuwr@hotmail.com
-- Password: Test1234!
--
-- Transações: 20 (8 receitas, 12 despesas - histórico de 6 meses)
-- Metas: 3 (Viagem, Emergência, Carro)
-- Orçamentos: 5 categorias
-- Notificações: 3 (2 não lidas, 1 lida)
--
-- Saldo estimado: ~7000+ EUR
-- ============================================
