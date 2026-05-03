-- Check current billing_cycle_day values
SELECT id, billing_cycle_day 
FROM profiles 
WHERE billing_cycle_day IS NOT NULL
ORDER BY billing_cycle_day;