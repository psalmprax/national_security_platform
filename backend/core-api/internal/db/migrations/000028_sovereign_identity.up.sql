-- Migration: 028_sovereign_identity.sql
-- Description: Adds fields for NIMC/NIN verification and biometric trust levels.

-- 1. Enhance users table with identity verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS nin_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nin_verification_date TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_provider VARCHAR(50) DEFAULT 'LOCAL'; -- LOCAL, NIMC, FRSC (Road Safety), BVN
ALTER TABLE users ADD COLUMN IF NOT EXISTS biometric_enrolled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_notes TEXT;

-- 2. Create index for authenticated identity queries
CREATE INDEX IF NOT EXISTS idx_users_nin_verified ON users(nin_verified);

-- 3. Automatic Trust Scored Update (Conceptual)
-- Verified identity significantly boosts base trust_score
UPDATE users SET trust_score = trust_score + 0.3 WHERE nin_verified = TRUE AND trust_score <= 0.6;
UPDATE users SET trust_score = 1.0 WHERE role IN ('SYSTEM_ADMIN', 'SECURITY_OFFICER', 'ADMIN');

-- 4. Identity Audit Table (For Chain of Custody)
CREATE TABLE IF NOT EXISTS identity_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    checked_by UUID REFERENCES users(id), -- Officer who manually verified or System ID
    provider_reference VARCHAR(100), -- Transaction ID from NIMC/NIN provider
    verification_status VARCHAR(20) NOT NULL, -- VERIFIED, REJECTED, PENDING_MANUAL
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_id_logs_user ON identity_verification_logs(user_id);

COMMENT ON TABLE identity_verification_logs IS 'Audit trail for citizen identity verification via national providers';
