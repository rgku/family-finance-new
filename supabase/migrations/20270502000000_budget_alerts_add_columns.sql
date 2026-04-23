-- Add missing columns to budget_alerts table
-- Execute this in Supabase SQL Editor

-- Add alert_type column
ALTER TABLE budget_alerts 
ADD COLUMN IF NOT EXISTS alert_type TEXT CHECK (alert_type IN ('warning', 'exceeded'));

-- Add is_active column  
ALTER TABLE budget_alerts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add updated_at column
ALTER TABLE budget_alerts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_category 
ON budget_alerts(user_id, category);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_threshold 
ON budget_alerts(threshold_percent);

-- Add comment
COMMENT ON COLUMN budget_alerts.alert_type IS 'Type of alert: warning (80%) or exceeded (100%)';
COMMENT ON COLUMN budget_alerts.is_active IS 'Whether this alert is still active';

-- Update updated_at on row change
CREATE OR REPLACE FUNCTION update_budget_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_budget_alerts_updated_at ON budget_alerts;
CREATE TRIGGER update_budget_alerts_updated_at
  BEFORE UPDATE ON budget_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_alerts_updated_at();
