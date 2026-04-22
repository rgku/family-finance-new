-- ============================================
-- BACKUP BEFORE DROPPING COLUMNS
-- Run this FIRST in Supabase SQL Editor
-- ============================================

-- 1. Create backup tables
DROP TABLE IF EXISTS transactions_backup;
DROP TABLE IF EXISTS goals_backup;

CREATE TABLE transactions_backup AS 
SELECT * FROM transactions;

CREATE TABLE goals_backup AS 
SELECT * FROM goals;

-- 2. Verify backups
SELECT 'transactions_backup' AS table_name, COUNT(*) AS row_count FROM transactions_backup
UNION ALL
SELECT 'goals_backup' AS table_name, COUNT(*) AS row_count FROM goals_backup;

-- 3. Verify data integrity (compare counts)
SELECT 'transactions' AS table_name, COUNT(*) AS row_count FROM transactions
UNION ALL
SELECT 'transactions_backup' AS table_name, COUNT(*) AS row_count FROM transactions_backup
UNION ALL
SELECT 'goals' AS table_name, COUNT(*) AS row_count FROM goals
UNION ALL
SELECT 'goals_backup' AS table_name, COUNT(*) AS row_count FROM goals_backup;
