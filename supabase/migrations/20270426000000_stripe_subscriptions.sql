-- Stripe Subscriptions Schema
-- Execute this in Supabase SQL Editor

-- Add subscription columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'unpaid', 'canceled', 'trialing')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Subscription history table
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription 
ON profiles(stripe_customer_id, subscription_status);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user 
ON subscription_events(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can access own events
DROP POLICY IF EXISTS "Users can access own subscription events" ON subscription_events;
CREATE POLICY "Users can access own subscription events" 
ON subscription_events FOR SELECT 
USING (user_id = auth.uid());

-- Function to update plan based on price_id
CREATE OR REPLACE FUNCTION update_plan_from_price()
RETURNS TRIGGER AS $$
DECLARE
  v_plan TEXT;
BEGIN
  -- Map price_id to plan
  IF NEW.stripe_price_id LIKE '%price_premium%' THEN
    v_plan := 'premium';
  ELSIF NEW.stripe_price_id LIKE '%price_family%' THEN
    v_plan := 'family';
  ELSE
    v_plan := 'free';
  END IF;
  
  UPDATE profiles 
  SET plan = v_plan
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle subscription status changes
CREATE OR REPLACE FUNCTION handle_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription is canceled or unpaid, revert to free
  IF NEW.subscription_status IN ('canceled', 'unpaid') THEN
    UPDATE profiles 
    SET plan = 'free'
    WHERE stripe_subscription_id = NEW.stripe_subscription_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update plan
DROP TRIGGER IF EXISTS update_plan_on_price_change ON profiles;
CREATE TRIGGER update_plan_on_price_change
  AFTER UPDATE OF stripe_price_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_from_price();

-- Trigger to handle status changes
DROP TRIGGER IF EXISTS handle_subscription_status ON profiles;
CREATE TRIGGER handle_subscription_status
  AFTER UPDATE OF subscription_status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_status_change();
