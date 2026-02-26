-- Phase 27: Monetization & Subscription Schema

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'community', -- community, guardian, enterprise
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, cancelled
    transaction_id VARCHAR(100),
    platform VARCHAR(20), -- ios, android, web
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);

-- Seed initial subscriptions for existing users (default to community)
INSERT INTO subscriptions (user_id, tier, status)
SELECT id, 'community', 'active' FROM users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE subscriptions IS 'Tracks user monetization tiers and ad-status';
