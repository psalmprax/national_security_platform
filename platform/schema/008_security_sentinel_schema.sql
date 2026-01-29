CREATE TABLE IF NOT EXISTS security_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_time TIMESTAMP DEFAULT current_timestamp(),
    target_service STRING NOT NULL,
    status STRING NOT NULL, -- 'PASSED', 'FAILED'
    findings JSONB,         -- Array of security issues found
    meta_data JSONB         -- Additional context (e.g., scanner version, duration)
);

CREATE INDEX IF NOT EXISTS idx_security_scans_time ON security_scans(scan_time);
CREATE INDEX IF NOT EXISTS idx_security_scans_status ON security_scans(status);
