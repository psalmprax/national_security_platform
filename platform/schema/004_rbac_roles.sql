-- Insert users with specific roles for Dashboard RBAC testing

-- 1. Admin User
INSERT INTO users (
    phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '+2348000000100', 'System Administrator', 'ADMIN', 100, 1.0, 'TOP_SECRET'
) ON CONFLICT (phone_number) DO NOTHING;

-- 2. Cyber Analyst
INSERT INTO users (
    phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '+2348000000101', 'Cyber Analyst Lead', 'CYBER_ANALYST', 80, 0.9, 'SECRET'
) ON CONFLICT (phone_number) DO NOTHING;

-- 3. Strategic Planner
INSERT INTO users (
    phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '+2348000000102', 'Strategic Director', 'STRATEGIC_PLANNER', 90, 0.95, 'TOP_SECRET'
) ON CONFLICT (phone_number) DO NOTHING;

-- 4. Tactical Command
INSERT INTO users (
    phone_number, full_name, role, hierarchy_weight, trust_score, clearance_level
) VALUES (
    '+2348000000103', 'Field Commander', 'TACTICAL_COMMAND', 85, 0.9, 'SECRET'
) ON CONFLICT (phone_number) DO NOTHING;
