-- ============================================
-- FAMILY FINANCE APP - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create families table (if not exists)
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add family_id to profiles (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_id UUID;
ALTER TABLE profiles ADD CONSTRAINT fk_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL;

-- Add role column (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';

-- Enable RLS on families
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can create families" ON families;
CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Family members can view families" ON families;
CREATE POLICY "Family members can view families" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- ============================================
-- SEED DEFAULT CATEGORIES
-- ============================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add family_id column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('owner', 'partner')) DEFAULT 'owner';

-- 3. Families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Categories (predefined + custom)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  keywords TEXT[],
  is_system BOOLEAN DEFAULT false,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE
);

-- 5. Transactions table - ADD user_id
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Goals table - ADD user_id
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  deadline DATE,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Budgets table - ADD user_id
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  month DATE NOT NULL,
  limit_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Transactions: Users can only access their own transactions
DROP POLICY IF EXISTS "Family can access transactions" ON transactions;
CREATE POLICY "Users can access own transactions" ON transactions
  FOR ALL USING (user_id = auth.uid());

-- Goals: Users can only access their own goals
DROP POLICY IF EXISTS "Family can access goals" ON goals;
CREATE POLICY "Users can access own goals" ON goals
  FOR ALL USING (user_id = auth.uid());

-- Budgets: Users can only access their own budgets
DROP POLICY IF EXISTS "Family can access budgets" ON budgets;
CREATE POLICY "Users can access own budgets" ON budgets
  FOR ALL USING (user_id = auth.uid());

-- Categories: Users can access their family's categories
DROP POLICY IF EXISTS "Family can access categories" ON categories;
CREATE POLICY "Users can access categories" ON categories
  FOR ALL USING (
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- Families: Members can view their family
DROP POLICY IF EXISTS "Family members can view families" ON families;
CREATE POLICY "Family members can view families" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

-- Families: Authenticated users can create families
DROP POLICY IF EXISTS "Users can create families" ON families;
CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- SEED DEFAULT CATEGORIES
-- ============================================

INSERT INTO categories (name, icon, keywords, is_system) VALUES
  ('Moradia', 'home', ARRAY['aluguel', 'condomínio', 'luz', 'água', 'iptu', 'energia'], true),
  ('Alimentação', 'restaurant', ARRAY['supermercado', 'mercado', 'comida', 'restaurante', 'lanchonete', 'padaria'], true),
  ('Transporte', 'directions_car', ARRAY['combustível', 'gasolina', 'uber', '99', 'taxi', 'ônibus', 'metro', 'estacionamento'], true),
  ('Lazer', 'movie', ARRAY['netflix', 'spotify', 'cinema', 'show', 'bar', 'lazer', 'praia'], true),
  ('Saúde', 'local_hospital', ARRAY['farmácia', 'médico', 'hospital', 'consulta', 'exame', 'plano de saúde'], true),
  ('Educação', 'school', ARRAY['escola', 'universidade', 'curso', 'livro', 'material'], true),
  ('Renda', 'work', ARRAY['salário', 'freela', 'provento', 'aluguel recebido'], true),
  ('Outros', 'more_horiz', ARRAY[]::text[], true)
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Generate invite code
-- ============================================

CREATE OR REPLACE FUNCTION generate_family_invite_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
BEGIN
  code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  RETURN code;
END;
$$ LANGUAGE plpgsql;