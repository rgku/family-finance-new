-- OneSignal Integration
-- Run this in Supabase SQL Editor to enable push notifications

-- Create onesignal_subscriptions table
CREATE TABLE IF NOT EXISTS onesignal_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  onesignal_player_id TEXT NOT NULL,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  subscription_state TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onesignal_subscriptions_user_id ON onesignal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_onesignal_subscriptions_player_id ON onesignal_subscriptions(onesignal_player_id);

-- Enable RLS
ALTER TABLE onesignal_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON onesignal_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON onesignal_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON onesignal_subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON onesignal_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON onesignal_subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON onesignal_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON onesignal_subscriptions;
CREATE POLICY "Users can delete own subscriptions"
  ON onesignal_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to cleanup on user delete
CREATE OR REPLACE FUNCTION cleanup_onesignal_subscription()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM onesignal_subscriptions WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS cleanup_onesignal_on_user_delete ON auth.users;
CREATE TRIGGER cleanup_onesignal_on_user_delete
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_onesignal_subscription();

-- Comment
COMMENT ON TABLE onesignal_subscriptions IS 'OneSignal push notification subscriptions';
