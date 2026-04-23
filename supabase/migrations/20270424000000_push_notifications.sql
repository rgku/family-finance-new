-- Push Notifications Subscriptions Table
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  budget_80_percent BOOLEAN DEFAULT true,
  budget_100_percent BOOLEAN DEFAULT true,
  goal_achieved BOOLEAN DEFAULT true,
  recurring_reminder BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT false,
  inactivity_reminder BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user 
ON push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user 
ON notification_preferences(user_id);

-- Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can access own data
DROP POLICY IF EXISTS "Users can access own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can access own push subscriptions" 
ON push_subscriptions FOR ALL 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can access own notification preferences" ON notification_preferences;
CREATE POLICY "Users can access own notification preferences" 
ON notification_preferences FOR ALL 
USING (user_id = auth.uid());

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create preferences on user signup
DROP TRIGGER IF EXISTS on_user_created_preferences ON auth.users;
CREATE TRIGGER on_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();
