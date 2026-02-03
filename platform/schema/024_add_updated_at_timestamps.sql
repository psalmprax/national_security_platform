-- Migration 024: Add updated_at columns and ensure regional codes exist
-- Purpose: Standardize timestamps and regional identification
-- Note: CockroachDB v23.1 does not support PL/pgSQL triggers for auto-updating timestamps.

-- =========================================
-- STEP 1: Add missing columns to support standard features
-- =========================================

-- Ensure code columns exist for safety scores
ALTER TABLE states ADD COLUMN IF NOT EXISTS code STRING UNIQUE;
ALTER TABLE lgas ADD COLUMN IF NOT EXISTS code STRING UNIQUE;

-- Add updated_at to core tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE devices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE missions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agency_personnel ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =========================================
-- STEP 2: Backfill existing rows
-- =========================================

UPDATE users SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE alerts SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE assets SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE devices SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE missions SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE public_alerts SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;
UPDATE agencies SET updated_at = created_at WHERE updated_at IS NULL AND created_at IS NOT NULL;

-- agency_personnel uses joined_at instead of created_at
UPDATE agency_personnel SET updated_at = joined_at WHERE updated_at IS NULL AND joined_at IS NOT NULL;
