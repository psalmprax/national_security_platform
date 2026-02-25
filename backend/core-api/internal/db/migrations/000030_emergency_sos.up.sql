-- 030_emergency_sos.sql
-- Schema for Emergency SOS Broadcast feature

-- 1. Create table for Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    relationship TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup of a user's contacts during SOS
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);

-- 2. Add 'SOS' to alert_type - handled by application logic as it is a STRING column.
-- No ALTER TYPE needed.

-- 3. Add 'broadcast_radius_meters' to alerts table to support custom SOS ranges
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS broadcast_radius_meters FLOAT DEFAULT 5000.0;

-- 4. Create a specialized partial index for active SOS alerts to speed up dashboard polling
CREATE INDEX IF NOT EXISTS idx_active_sos_alerts ON alerts(created_at)
WHERE alert_type = 'SOS' AND status = 'ACTIVE';
