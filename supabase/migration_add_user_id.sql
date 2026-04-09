-- ============================================
-- MIGRATION: Add user_id to existing tables
-- Run this in Supabase SQL Editor to migrate existing data
-- ============================================

-- 1. Add user_id column to transactions (if not exists)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Add user_id column to goals (if not exists)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Add user_id column to budgets (if not exists)
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 4. Create unique constraint for budgets if not exists
-- Note: This may fail if there are existing duplicates, handle accordingly

-- 5. Update existing data - set user_id to the first user for demo purposes
-- WARNING: This is for demo only - in production you'd handle this differently
-- UPDATE transactions SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE goals SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
-- UPDATE budgets SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- 6. Make user_id NOT NULL (after updating existing data)
ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE budgets ALTER COLUMN user_id SET NOT NULL;