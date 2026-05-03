-- Update bernardo's billing_cycle_day to 25 so he gets email today
UPDATE profiles 
SET billing_cycle_day = 25 
WHERE full_name ILIKE '%bernardo%' OR email ILIKE '%bernardo%';

-- Verify the update
SELECT id, full_name, email, billing_cycle_day 
FROM profiles 
WHERE full_name ILIKE '%bernardo%' OR email ILIKE '%bernardo%';