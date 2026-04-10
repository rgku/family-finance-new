-- Family Members System
-- Run this SQL in your Supabase SQL Editor

-- 1. Add family_id to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- 2. Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'view_only')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  invite_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create budget_alerts table
CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  threshold_percent INTEGER NOT NULL DEFAULT 80 CHECK (threshold_percent BETWEEN 50 AND 100),
  alert_type TEXT NOT NULL DEFAULT 'warning' CHECK (alert_type IN ('warning', 'exceeded')),
  notify_email BOOLEAN DEFAULT true,
  notify_in_app BOOLEAN DEFAULT true,
  last_sent TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user ON budget_alerts(user_id);

-- 5. Enable RLS
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for family_members
CREATE POLICY "Users can view family members" ON family_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert family members" ON family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own family members" ON family_members
  FOR UPDATE USING (user_id = auth.uid());

-- 7. RLS Policies for budget_alerts
CREATE POLICY "Users can view own budget alerts" ON budget_alerts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own budget alerts" ON budget_alerts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own budget alerts" ON budget_alerts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own budget alerts" ON budget_alerts
  FOR DELETE USING (user_id = auth.uid());

-- 8. Add tier column for payments (will be used later)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'family')),
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 9. Add member_count limit by tier
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS member_limit INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN tier = 'free' THEN 1
    WHEN tier = 'plus' THEN 5
    WHEN tier = 'family' THEN 10
    ELSE 1
  END
) STORED;

COMMENT ON COLUMN profiles.tier IS 'Subscription tier: free, plus, family';
COMMENT ON COLUMN profiles.member_limit IS 'Maximum family members allowed based on tier';