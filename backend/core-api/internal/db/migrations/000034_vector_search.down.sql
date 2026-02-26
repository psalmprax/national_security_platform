DROP INDEX IF EXISTS idx_alerts_search_vector;
ALTER TABLE alerts DROP COLUMN IF EXISTS search_vector;
