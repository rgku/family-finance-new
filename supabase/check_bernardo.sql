-- ============================================
-- CHECK BERNARDO'S DATA
-- ============================================

-- 1. Check bernardo's billing_cycle_day
SELECT id, full_name, email, billing_cycle_day 
FROM profiles 
WHERE full_name ILIKE '%bernaldo%';

-- 2. Check transactions in the period (day 25 Mar to 24 Apr)
SELECT COUNT(*) as total_transactions,
       SUM(CASE WHEN type = 'income' THEN amount::numeric ELSE 0 END) as total_income,
       SUM(CASE WHEN type = 'expense' THEN amount::numeric ELSE 0 END) as total_expenses
FROM transactions_decrypted 
WHERE user_id = (SELECT id FROM profiles WHERE full_name ILIKE '%bernaldo%' LIMIT 1)
AND date >= '2026-03-25'
AND date <= '2026-04-24';

-- 3. Check notification preferences
SELECT * FROM notification_preferences 
WHERE user_id = (SELECT id FROM profiles WHERE full_name ILIKE '%bernaldo%' LIMIT 1);