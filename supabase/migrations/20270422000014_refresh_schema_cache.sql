-- ============================================
-- REFRESH SCHEMA CACHE
-- This refreshes the PostgREST schema cache
-- ============================================

-- Notify PostgREST to reload schema
NOTIFY pgrst_cache_clear;

-- Alternatively, you can use:
-- SELECT pg_relcache_reset();

-- Verify goals table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;