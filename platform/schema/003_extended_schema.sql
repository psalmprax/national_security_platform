-- Extended Schema for National Security Platform

-- 1. Spatial Registry (Nigeria Hierarchy)
CREATE TABLE IF NOT EXISTS states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING UNIQUE NOT NULL,
    boundary_geom GEOMETRY(POLYGON, 4326),
    capital_city STRING,
    created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE IF NOT EXISTS lgas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID REFERENCES states(id),
    name STRING NOT NULL,
    boundary_geom GEOMETRY(POLYGON, 4326),
    UNIQUE (state_id, name),
    created_at TIMESTAMP DEFAULT current_timestamp()
);

CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lga_id UUID REFERENCES lgas(id),
    name STRING NOT NULL,
    location GEOMETRY(POINT, 4326),
    population_est INT,
    created_at TIMESTAMP DEFAULT current_timestamp()
);

-- 2. Trusted Device Registry (PKI)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    hwid STRING UNIQUE NOT NULL, -- Hardware identifier (IMEI/Serial/IDFV)
    public_key STRING NOT NULL,  -- PEM encoded public key for signature verification
    device_model STRING,
    os_version STRING,
    status STRING DEFAULT 'ACTIVE', -- 'ACTIVE', 'REVOKED', 'QUARANTINED'
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT current_timestamp()
);

-- 3. Media & Evidence Attachments
CREATE TABLE IF NOT EXISTS media_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES alerts(id),
    storage_path STRING NOT NULL, -- Path in MinIO
    content_hash_sha256 STRING NOT NULL, -- For non-repudiation
    mime_type STRING,
    file_size_bytes INT,
    is_encrypted BOOLEAN DEFAULT TRUE,
    encryption_metadata JSONB, -- IV, algorithm version, etc.
    created_at TIMESTAMP DEFAULT current_timestamp()
);

-- 4. Corroboration & Verification (Web of Trust)
CREATE TABLE IF NOT EXISTS corroborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES alerts(id),
    verifier_id UUID REFERENCES users(id),
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    comments STRING,
    is_coerced_report BOOLEAN DEFAULT FALSE, -- Indicator if the original report was reported as suspicious
    created_at TIMESTAMP DEFAULT current_timestamp(),
    UNIQUE(alert_id, verifier_id)
);

-- Add spatial indices
CREATE INDEX IF NOT EXISTS states_geom_idx ON states USING GIST(boundary_geom);
CREATE INDEX IF NOT EXISTS lgas_geom_idx ON lgas USING GIST(boundary_geom);
CREATE INDEX IF NOT EXISTS villages_loc_idx ON villages USING GIST(location);
