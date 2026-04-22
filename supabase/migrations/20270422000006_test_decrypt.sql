-- ============================================
-- FIX DECRYPTION - Use simpler approach
-- ============================================

-- First, let's see what decrypt returns
SELECT 
  id,
  encrypted_amount,
  pgp_sym_decrypt(decode(encrypted_amount, 'base64'), 'famflow-dev-encryption-key-2024-change-in-production!!') as test_decrypt
FROM transactions
LIMIT 3;
