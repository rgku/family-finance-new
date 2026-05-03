-- ============================================
-- CRITICAL SECURITY FIX: VIEWS + DATA CLEANUP
-- Run this IMMEDIATELY in Supabase SQL Editor
-- ============================================

-- 1. VERIFY CURRENT STATE
SELECT 'BEFORE FIX: Transactions without family_id' AS check, COUNT(*) AS count 
FROM transactions WHERE family_id IS NULL;

SELECT 'BEFORE FIX: Goals without family_id' AS check, COUNT(*) AS count 
FROM goals WHERE family_id IS NULL;

-- 2. UPDATE ALL RECORDS WITH NULL FAMILY_ID
-- Link data to family via user's profile
UPDATE transactions t
SET family_id = p.family_id
FROM profiles p
WHERE t.user_id = p.id 
  AND t.family_id IS NULL 
  AND p.family_id IS NOT NULL;

UPDATE goals g
SET family_id = p.family_id
FROM profiles p
WHERE g.user_id = p.id 
  AND g.family_id IS NULL 
  AND p.family_id IS NOT NULL;

UPDATE budgets b
SET family_id = p.family_id
FROM profiles p
WHERE b.user_id = p.id 
  AND b.family_id IS NULL 
  AND p.family_id IS NOT NULL;

-- 3. DELETE ORPHANED DATA (no family_id and no profile with family)
-- These are dangerous - delete them or assign to a default family
DELETE FROM transactions
WHERE family_id IS NULL 
  AND user_id NOT IN (SELECT id FROM profiles WHERE family_id IS NOT NULL);

DELETE FROM goals
WHERE family_id IS NULL 
  AND user_id NOT IN (SELECT id FROM profiles WHERE family_id IS NOT NULL);

DELETE FROM budgets
WHERE family_id IS NULL 
  AND user_id NOT IN (SELECT id FROM profiles WHERE family_id IS NOT NULL);

-- 4. RECREATE VIEWS WITH STRICT FAMILY FILTERING
-- Views bypass RLS, so we MUST filter explicitly

DROP VIEW IF EXISTS transactions_decrypted;
CREATE OR REPLACE VIEW transactions_decrypted AS
SELECT 
  t.id,
  t.user_id,
  t.family_id,
  decrypt_text(t.encrypted_description) AS description,
  decrypt_amount(t.encrypted_amount) AS amount,
  t.type,
  t.category,
  t.date,
  t.created_at
FROM transactions t
WHERE t.family_id IS NOT NULL
  AND t.family_id = (
    SELECT p.family_id 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    LIMIT 1
  );

DROP VIEW IF EXISTS goals_decrypted;
CREATE OR REPLACE VIEW goals_decrypted AS
SELECT 
  g.id,
  g.user_id,
  g.family_id,
  g.name,
  decrypt_amount(g.encrypted_target_amount) AS target_amount,
  decrypt_amount(g.encrypted_current_amount) AS current_amount,
  g.deadline,
  g.icon,
  g.goal_type,
  g.created_at
FROM goals g
WHERE g.family_id IS NOT NULL
  AND g.family_id = (
    SELECT p.family_id 
    FROM profiles p 
    WHERE p.id = auth.uid() 
    LIMIT 1
  );

-- 5. VERIFY FIX
SELECT 'AFTER FIX: Transactions without family_id' AS check, COUNT(*) AS count 
FROM transactions WHERE family_id IS NULL;

SELECT 'AFTER FIX: Goals without family_id' AS check, COUNT(*) AS count 
FROM goals WHERE family_id IS NULL;

SELECT 'AFTER FIX: Sample transactions_decrypted' AS check, 
       COUNT(*) AS visible_rows,
       COUNT(DISTINCT family_id) AS distinct_families
FROM transactions_decrypted;

-- 6. VERIFY VIEWS ARE SECURE
SELECT 'View definition check' AS check, 
       pg_get_viewdef('transactions_decrypted'::regclass, true) AS definition;
