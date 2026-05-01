-- ============================================
-- AUTO-SET FAMILY_ID & FIX EXISTING DATA
-- ============================================

-- 1. Trigger to auto-set family_id on insert/update for transactions
CREATE OR REPLACE FUNCTION set_transaction_family_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_id IS NULL THEN
    SELECT family_id INTO NEW.family_id FROM profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_transaction_family_id ON transactions;
CREATE TRIGGER trg_set_transaction_family_id
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_transaction_family_id();

-- 2. Trigger for goals
CREATE OR REPLACE FUNCTION set_goal_family_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_id IS NULL THEN
    SELECT family_id INTO NEW.family_id FROM profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_goal_family_id ON goals;
CREATE TRIGGER trg_set_goal_family_id
  BEFORE INSERT OR UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_goal_family_id();

-- 3. Trigger for budgets
CREATE OR REPLACE FUNCTION set_budget_family_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_id IS NULL THEN
    SELECT family_id INTO NEW.family_id FROM profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_budget_family_id ON budgets;
CREATE TRIGGER trg_set_budget_family_id
  BEFORE INSERT OR UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION set_budget_family_id();

-- 4. Fix existing records with null family_id
UPDATE transactions SET family_id = (SELECT family_id FROM profiles WHERE profiles.id = transactions.user_id)
WHERE family_id IS NULL;

UPDATE goals SET family_id = (SELECT family_id FROM profiles WHERE profiles.id = goals.user_id)
WHERE family_id IS NULL;

UPDATE budgets SET family_id = (SELECT family_id FROM profiles WHERE profiles.id = budgets.user_id)
WHERE family_id IS NULL;

-- 5. Verify
SELECT 'Transactions with family_id' AS check, COUNT(*) AS count FROM transactions WHERE family_id IS NOT NULL;
SELECT 'Goals with family_id' AS check, COUNT(*) AS count FROM goals WHERE family_id IS NOT NULL;
SELECT 'Budgets with family_id' AS check, COUNT(*) AS count FROM budgets WHERE family_id IS NOT NULL;
