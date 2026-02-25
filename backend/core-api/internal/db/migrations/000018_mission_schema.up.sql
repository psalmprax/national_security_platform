-- Mission Dispatch Tracking Schema
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    commander_id UUID NOT NULL REFERENCES users(id),
    
    status STRING DEFAULT 'ASSIGNED', -- 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'COMPLETED', 'ABORTED'
    priority STRING DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'IMMEDIATE'
    
    eta_minutes INT,
    dispatch_time TIMESTAMP DEFAULT current_timestamp(),
    arrival_time TIMESTAMP,
    completion_time TIMESTAMP,
    
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT current_timestamp(),
    updated_at TIMESTAMP DEFAULT current_timestamp()
);

-- Index for active missions performance
CREATE INDEX IF NOT EXISTS idx_missions_active ON missions (status) WHERE status NOT IN ('COMPLETED', 'ABORTED');
