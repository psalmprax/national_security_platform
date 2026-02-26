-- Agency RBAC Schema
-- Run this migration to add agency-specific access control

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    acronym VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- POLICE, FIRE, MEDICAL, etc.
    jurisdiction_scope TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency alert types (which alert types this agency handles)
CREATE TABLE IF NOT EXISTS agency_alert_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agency_id, alert_type)
);

-- User agency assignments
CREATE TABLE IF NOT EXISTS user_agency_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- OFFICER, COMMANDER, ANALYST, DISPATCHER
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, agency_id)
);

-- Alert assignments to agencies
CREATE TABLE IF NOT EXISTS alert_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL,
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, acknowledged, resolved
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    UNIQUE(alert_id, agency_id)
);

-- User locations (for tracking)
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    location GEOGRAPHY(POINT),
    accuracy FLOAT,
    speed FLOAT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agency_alert_types_agency ON agency_alert_types(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_alert_types_type ON agency_alert_types(alert_type);
CREATE INDEX IF NOT EXISTS idx_user_agency_user ON user_agency_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agency_agency ON user_agency_assignments(agency_id);
CREATE INDEX IF NOT EXISTS idx_alert_assignments_alert ON alert_assignments(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_assignments_agency ON alert_assignments(agency_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_location ON user_locations USING GIST(location);

-- Sample agencies (for testing)
INSERT INTO agencies (id, name, acronym, type, jurisdiction_scope) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Nigerian Police Force', 'NPF', 'POLICE', 'National'),
    ('22222222-2222-2222-2222-222222222222', 'Federal Road Safety Corps', 'FRSC', 'TRAFFIC', 'National'),
    ('33333333-3333-3333-3333-333333333333', 'National Emergency Management Agency', 'NEMA', 'DISASTER', 'National'),
    ('44444444-4444-4444-4444-444444444444', 'Federal Fire Service', 'FFS', 'FIRE', 'National'),
    ('55555555-5555-5555-5555-555555555555', 'Nigerian Army', 'NIGARMY', 'MILITARY', 'National')
ON CONFLICT (acronym) DO NOTHING;

-- Sample alert type mappings
INSERT INTO agency_alert_types (agency_id, alert_type) VALUES
    ('11111111-1111-1111-1111-111111111111', 'KIDNAPPING'),
    ('11111111-1111-1111-1111-111111111111', 'ARMED_ROBBERY'),
    ('11111111-1111-1111-1111-111111111111', 'ASSAULT'),
    ('11111111-1111-1111-1111-111111111111', 'TERRORISM'),
    ('22222222-2222-2222-2222-222222222222', 'ROAD_ACCIDENT'),
    ('22222222-2222-2222-2222-222222222222', 'TRAFFIC_VIOLATION'),
    ('33333333-3333-3333-3333-333333333333', 'FLOOD'),
    ('33333333-3333-3333-3333-333333333333', 'FIRE'),
    ('33333333-3333-3333-3333-333333333333', 'BUILDING_COLLAPSE'),
    ('44444444-4444-4444-4444-444444444444', 'FIRE'),
    ('44444444-4444-4444-4444-444444444444', 'GAS_LEAK'),
    ('55555555-5555-5555-5555-555555555555', 'TERRORISM'),
    ('55555555-5555-5555-5555-555555555555', 'INSURGENCY')
ON CONFLICT (agency_id, alert_type) DO NOTHING;
