-- Add classification_level to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS classification_level STRING DEFAULT 'UNCLASSIFIED';

-- Update existing alerts based on priority as a baseline
UPDATE alerts SET classification_level = 'SECRET' WHERE priority_class = 'CRITICAL' AND classification_level = 'UNCLASSIFIED';
UPDATE alerts SET classification_level = 'CONFIDENTIAL' WHERE priority_class = 'HIGH' AND classification_level = 'UNCLASSIFIED';

-- Ensure users have a clearance_level (already exists in initial schema, but reinforcing defaults)
-- Levels: UNCLASSIFIED, RESTRICTED, CONFIDENTIAL, SECRET, TOP_SECRET
-- Logic: user.clearance >= alert.classification

-- Seeding specialized administrative users for Separation of Duties (SoD)
INSERT INTO users (
    id, phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level, password_hash
) VALUES (
    '00000000-0000-0000-0000-000000000105', '+2348000000105', 'NSP Technical Admin', 'SYSTEM_ADMIN', 95, 1.0, 'SECRET', '$2a$10$LFMT3Xz5w7EdAe1/MmNhpuNCbET5kb58aIx27jfXIpss8XS9DKmqW'
), (
    '00000000-0000-0000-0000-000000000106', '+2348000000106', 'Chief Security Officer', 'SECURITY_OFFICER', 95, 1.0, 'TOP_SECRET', '$2a$10$LFMT3Xz5w7EdAe1/MmNhpuNCbET5kb58aIx27jfXIpss8XS9DKmqW'
) ON CONFLICT (phone_number) DO UPDATE SET role = EXCLUDED.role, clearance_level = EXCLUDED.clearance_level, password_hash = EXCLUDED.password_hash;
