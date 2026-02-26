-- Phase 28: Vector Search (Full-Text Semantic Search on Alerts)

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

CREATE INDEX IF NOT EXISTS idx_alerts_search_vector ON alerts USING GIN (search_vector);

COMMENT ON COLUMN alerts.search_vector IS 'Full-text search vector for semantic query over alert content';
