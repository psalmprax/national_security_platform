-- Enable PostGIS extentions if available (CockroachDB supports a subset of spatial types natively)

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number STRING UNIQUE NOT NULL,
    
    -- Identity & Bio
    full_name STRING,
    nin STRING UNIQUE,
    
    -- Official Role
    role STRING NOT NULL, -- 'TRADITIONAL_RULER', 'GOVT_OFFICIAL', 'INTEL_OFFICER', 'CITIZEN'
    
    -- Traditional Institution Classification
    -- In Nigeria, Kings/Emirs are graded (1st Class, 2nd Class, 3rd Class)
    -- This dictates their sphere of influence and the weight of their intelligence reports.
    monarch_grade STRING, -- '1ST_CLASS', '2ND_CLASS', '3RD_CLASS', 'UNGRADED'
    domain_territory STRING, -- e.g. "Kano Emirate", "Oyo Kingdom", "Sokoto Caliphate"
    
    -- Authority Metrics
    hierarchy_weight INT DEFAULT 1, -- Calculated score based on grade (1st Class = 100, 3rd = 20)
    trust_score FLOAT DEFAULT 0.5,
    clearance_level STRING DEFAULT 'RESTRICTED',
    
    village_id UUID,
    lga_id UUID,
    state_id UUID,
    
    created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status STRING DEFAULT 'PENDING',
    priority_class STRING DEFAULT 'ROUTINE',
    
    location GEOMETRY(POINT, 4326), 
    impact_radius_meters INT DEFAULT 100,
    
    alert_type STRING NOT NULL,
    content_text STRING,
    content_media_url STRING,
    
    severity_score FLOAT, 
    risk_keywords STRING[], 
    
    verification_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL, 
    action STRING NOT NULL,
    actor_id UUID REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT current_timestamp(),
    changes JSONB,
    classification_level STRING DEFAULT 'UNCLASSIFIED'
);
