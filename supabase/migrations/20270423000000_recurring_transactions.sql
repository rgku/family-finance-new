-- Recurring Transactions Table
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  day_of_month INT CHECK (day_of_month BETWEEN 1 AND 28),
  auto_create BOOLEAN DEFAULT false,
  last_created DATE,
  next_run DATE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_user_enabled 
ON recurring_transactions(user_id, enabled);

CREATE INDEX IF NOT EXISTS idx_recurring_next_run 
ON recurring_transactions(next_run, enabled);

-- Row Level Security
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Users can access own recurring transactions
DROP POLICY IF EXISTS "Users can access own recurring transactions" ON recurring_transactions;
CREATE POLICY "Users can access own recurring transactions" 
ON recurring_transactions FOR ALL 
USING (user_id = auth.uid());
