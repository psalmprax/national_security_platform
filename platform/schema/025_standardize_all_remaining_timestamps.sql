-- Migration 025: Standardize all remaining timestamps for absolute consistency
-- Purpose: Ensure EVERY table in the system has created_at and updated_at
-- Note: CockroachDB v23.1 does not support PL/pgSQL triggers for auto-updating timestamps.

-- =========================================
-- STEP 1: Add missing columns
-- =========================================

-- 1. Reference Tables
ALTER TABLE states ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE lgas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE villages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Supporting/Evidence Tables
ALTER TABLE media_attachments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE corroborations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Communication & Timeline Tables
ALTER TABLE incident_updates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Audit & System Tables
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE security_scans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE security_scans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================
-- STEP 2: Backfill existing rows
-- =========================================

UPDATE states SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE lgas SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE villages SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE media_attachments SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE corroborations SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE incident_updates SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE chat_messages SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE audit_logs SET created_at = timestamp, updated_at = timestamp WHERE created_at IS NULL;
UPDATE security_scans SET created_at = scan_time, updated_at = scan_time WHERE created_at IS NULL;
