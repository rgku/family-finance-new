-- ============================================
-- FIX DECRYPTION - Use simpler approach
-- ============================================

-- First, let's see what decrypt returns
SELECT 
  id,
  encrypted_amount,
  pgp_sym_decrypt(decode(encrypted_amount, 'base64'), 'REMOVED_FALLBACK_KEY') as test_decrypt
FROM transactions
LIMIT 3;
