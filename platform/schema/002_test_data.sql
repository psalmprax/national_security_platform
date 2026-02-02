-- Insert a test 1st Class Monarch (Emir) for testing the high-priority alert flow
INSERT INTO users (
    id, 
    phone_number, 
    full_name, 
    email,
    nin, 
    role, 
    monarch_grade, 
    domain_territory, 
    hierarchy_weight, 
    trust_score, 
    clearance_level
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000', -- Static UUID for testing
    '+2348000000001', 
    'HRH Alhaji Aminu Ado', 
    'emir@kano.gov.ng',
    '12345678901', 
    'TRADITIONAL_RULER', 
    '1ST_CLASS', 
    'Kano Emirate', 
    100, 
    0.95, 
    'SECRET'
) ON CONFLICT (phone_number) DO NOTHING;

-- Insert a standard officer for comparison
INSERT INTO users (
    id, 
    phone_number, 
    full_name, 
    email,
    nin,
    role, 
    hierarchy_weight, 
    trust_score, 
    clearance_level
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '+2348000000002', 
    'Officer James Musa', 
    'james@police.gov.ng',
    '22334455667',
    'INTEL_OFFICER', 
    50, 
    0.80, 
    'CONFIDENTIAL'
) ON CONFLICT (phone_number) DO NOTHING;

-- Insert a 2nd Class Chief
INSERT INTO users (
    id, 
    phone_number, 
    full_name, 
    email,
    nin,
    role, 
    monarch_grade,
    hierarchy_weight, 
    trust_score, 
    clearance_level
) VALUES (
    '770e8400-e29b-41d4-a716-446655440002',
    '+2348000000003', 
    'Chief Segun Okoro', 
    'chief@oyo.gov.ng',
    '33445566778',
    'TRADITIONAL_RULER', 
    '2ND_CLASS',
    60, 
    0.75, 
    'CONFIDENTIAL'
) ON CONFLICT (phone_number) DO NOTHING;

-- Insert a 3rd Class Baale
INSERT INTO users (
    id, 
    phone_number, 
    full_name, 
    email,
    nin,
    role, 
    monarch_grade,
    hierarchy_weight, 
    trust_score, 
    clearance_level
) VALUES (
    '880e8400-e29b-41d4-a716-446655440003',
    '+2348000000004', 
    'Baale Adebisi', 
    'baale@eko.gov.ng',
    '44556677889',
    'TRADITIONAL_RULER', 
    '3RD_CLASS',
    30, 
    0.65, 
    'RESTRICTED'
) ON CONFLICT (phone_number) DO NOTHING;
