-- Migration: Add auth and status fields to users
-- Statuses: 'ACTIVE', 'PENDING', 'REJECTED'

ALTER TABLE users ADD COLUMN IF NOT EXISTS status STRING NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash STRING DEFAULT '$2a$10$LFMT3Xz5w7EdAe1/MmNhpuNCbET5kb58aIx27jfXIpss8XS9DKmqW';

-- Note: In CockroachDB, ADD COLUMN followed by UPDATE in the same transaction 
-- can trigger "column is being backfilled" errors. Using DEFAULT handles existing rows safely.
