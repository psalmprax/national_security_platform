-- Agency & Asset Management Schema

-- 1. Agencies Table
-- Represents distinct organizations like "Nigerian Police Force", "Nigerian Army - 1st Div", "FRSC HQ"
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING UNIQUE NOT NULL,
    acronym STRING, -- e.g. "NPF", "NA", "FRSC"
    type STRING NOT NULL, -- 'POLICE', 'MILITARY', 'MEDICAL', 'FIRE', 'CIVIL_DEFENSE', 'ROAD_SAFETY'
    jurisdiction_scope STRING DEFAULT 'NATIONAL', -- 'NATIONAL', 'STATE', 'LGA'
    hq_address STRING,
    contact_phone STRING,
    created_at TIMESTAMP DEFAULT current_timestamp()
);

-- 2. Assets Table
-- Represents physical resources owned by an agency (Vehicles, Stations, Checkpoints)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name STRING NOT NULL, -- e.g. "Patrol Unit Alpha-1", "Wuse General Hospital"
    type STRING NOT NULL, -- 'STATION', 'CHECKPOINT', 'PATROL_VEHICLE', 'AMBULANCE', 'FIRE_TRUCK'
    
    -- Current Location (Real-time or Static)
    location GEOMETRY(POINT, 4326),
    status STRING DEFAULT 'ACTIVE', -- 'ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED', 'ENGAGED'
    
    -- Metadata
    description STRING,
    call_sign STRING,
    capacity_level INT DEFAULT 100, -- Percentage of capacity (e.g. Hospital bed availability)
    
    last_updated_at TIMESTAMP DEFAULT current_timestamp(),
    created_at TIMESTAMP DEFAULT current_timestamp()
);

-- 3. Agency Personnel Table
-- Links existing Users to an Agency with a specific rank/role
CREATE TABLE IF NOT EXISTS agency_personnel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    
    rank STRING, -- e.g. "Commissioner", "Sergeant", "Captain"
    role STRING DEFAULT 'OPERATOR', -- 'ADMIN', 'DISPATCHER', 'OPERATOR'
    badge_number STRING,
    
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP DEFAULT current_timestamp(),
    
    UNIQUE(user_id, agency_id) -- A user can only hold one primary position per agency (though could theoretically belong to multiple, we enforce uniqueness for simplicity here)
);

-- 4. Spatial Index for Assets
CREATE INDEX IF NOT EXISTS assets_location_idx ON assets USING GIST(location);
