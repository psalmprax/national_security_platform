-- Insert users with specific roles for Dashboard RBAC testing
-- Insert users with specific roles for Dashboard RBAC testing
DELETE FROM corroborations;
DELETE FROM alerts;
DELETE FROM devices;
DELETE FROM audit_logs;
DELETE FROM agency_personnel;
DELETE FROM users WHERE phone_number IN ('+2348000000100', '+2348000000101', '+2348000000102', '+2348000000103', '+2348000000104');

-- 1. Admin User
INSERT INTO users (
    id, phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '00000000-0000-0000-0000-000000000001', '+2348000000100', 'System Administrator', 'ADMIN', 100, 1.0, 'TOP_SECRET'
) ON CONFLICT (phone_number) DO UPDATE SET id = EXCLUDED.id;

-- 2. Cyber Analyst
INSERT INTO users (
    id, phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '00000000-0000-0000-0000-000000000002', '+2348000000101', 'Cyber Analyst Lead', 'CYBER_ANALYST', 80, 0.9, 'SECRET'
) ON CONFLICT (phone_number) DO UPDATE SET id = EXCLUDED.id;

-- 3. Strategic Planner
INSERT INTO users (
    id, phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '00000000-0000-0000-0000-000000000003', '+2348000000102', 'Strategic Director', 'STRATEGIC_PLANNER', 90, 0.95, 'TOP_SECRET'
) ON CONFLICT (phone_number) DO UPDATE SET id = EXCLUDED.id;

-- 4. Tactical Command
INSERT INTO users (
    id, phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '00000000-0000-0000-0000-000000000004', '+2348000000103', 'Field Commander', 'TACTICAL_COMMAND', 85, 0.9, 'SECRET'
) ON CONFLICT (phone_number) DO UPDATE SET id = EXCLUDED.id;

-- 5. Agency Officer
INSERT INTO users (
    id, phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '00000000-0000-0000-0000-000000000005', '+2348000000104', 'Logistics Officer', 'AGENCY_OFFICER', 75, 0.85, 'CONFIDENTIAL'
) ON CONFLICT (phone_number) DO UPDATE SET id = EXCLUDED.id;
