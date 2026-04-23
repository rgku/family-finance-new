-- Migration: Audit and fix RLS policies
-- Run this in Supabase SQL Editor

-- Function to check if RLS is enabled
CREATE OR REPLACE FUNCTION is_rls_enabled(table_name text)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO result
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = table_name AND n.nspname = 'public';
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count policies
CREATE OR REPLACE FUNCTION count_policies(table_name text)
RETURNS INTEGER AS $$
DECLARE
  result INTEGER;
BEGIN
  SELECT COUNT(*) INTO result
  FROM pg_policies WHERE tablename = table_name AND schemaname = 'public';
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Table: notification_setting - Add RLS if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notification_setting' AND table_schema = 'public'
  ) THEN
    CREATE TABLE IF NOT EXISTS notification_setting (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can select notification_setting'
    AND tablename = 'notification_setting'
  ) THEN
    ALTER TABLE notification_setting ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can select notification_setting" ON notification_setting
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert notification_setting" ON notification_setting
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update notification_setting" ON notification_setting
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete notification_setting" ON notification_setting
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: family_requests - Ensure RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'family_requests' AND table_schema = 'public'
  ) THEN
    -- Check if RLS is enabled
    IF NOT is_rls_enabled('family_requests') THEN
      ALTER TABLE family_requests ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Add policy if missing
    IF count_policies('family_requests') = 0 THEN
      CREATE POLICY "Users can manage family_requests" ON family_requests
        FOR ALL USING (auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM family_members 
          WHERE family_id = family_requests.family_id 
          AND user_id = auth.uid() 
          AND role = 'owner'
        ));
    END IF;
  END IF;
END $$;

-- Table: budget_alerts - Ensure policies exist
DO $$
BEGIN
  IF count_policies('budget_alerts') = 0 THEN
    CREATE POLICY "Users can select budget_alerts" ON budget_alerts
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert budget_alerts" ON budget_alerts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update budget_alerts" ON budget_alerts
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete budget_alerts" ON budget_alerts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: recurring_transactions - Ensure policies exist
DO $$
BEGIN
  IF count_policies('recurring_transactions') = 0 THEN
    CREATE POLICY "Users can select recurring_transactions" ON recurring_transactions
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert recurring_transactions" ON recurring_transactions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update recurring_transactions" ON recurring_transactions
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete recurring_transactions" ON recurring_transactions
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: onesignal_subscriptions - Add policy if missing
DO $$
BEGIN
  IF count_policies('onesignal_subscriptions') = 0 THEN
    ALTER TABLE onesignal_subscriptions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can manage own onesignal" ON onesignal_subscriptions
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: audit_log - Read-only for users
DO $$
BEGIN
  IF count_policies('audit_log') = 0 THEN
    CREATE POLICY "Users can select own audit logs" ON audit_log
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Table: subscription_events - Ensure policies
DO $$
BEGIN
  IF count_policies('subscription_events') = 0 THEN
    CREATE POLICY "Users can select own subscription events" ON subscription_events
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Service can insert subscription events" ON subscription_events
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Grant execute to extension functions
GRANT EXECUTE ON FUNCTION is_rls_enabled(text) TO service_role;
GRANT EXECUTE ON FUNCTION count_policies(text) TO service_role;