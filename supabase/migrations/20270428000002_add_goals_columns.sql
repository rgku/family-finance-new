-- ============================================
-- Add missing columns to goals table
-- Fixes: column goals.current_amount does not exist
-- ============================================

-- Add current_amount column if it doesn't exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_amount DECIMAL(12, 2) DEFAULT 0;

-- Add last_contribution_date column if it doesn't exist  
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_contribution_date TIMESTAMPTZ;

-- Add family_id column if it doesn't exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'goals';