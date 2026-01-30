-- Seed Agency Personnel mappings for Dashboard users
-- u0eebc99... = Admin
-- u1eebc99... = Cyber Analyst
-- u2eebc99... = Strategic Planner
-- u3eebc99... = Tactical Command
-- u4eebc99... = Agency Officer

-- a0eebc99... = Nigerian Army - 7th Division (NA-7DIV)
-- b1eebc99... = Nigeria Police Force - Borno Command (NPF-BORNO)
-- c2eebc99... = Department of State Services (DSS)
-- d3eebc99... = NSCDC - Pipeline Protection (NSCDC-PIP)

INSERT INTO agency_personnel (user_id, agency_id, rank, role) VALUES
-- Admin linked to DSS (HQ)
('00000000-0000-0000-0000-000000000001', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Director General', 'ADMIN'),

-- Cyber Analyst linked to DSS
('00000000-0000-0000-0000-000000000002', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Senior analyst', 'OPERATOR'),

-- Strategic Planner linked to NSCDC
('00000000-0000-0000-0000-000000000003', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Strategic Director', 'OPERATOR'),

-- Tactical Command linked to Nigerian Army
('00000000-0000-0000-0000-000000000004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Major General', 'OPERATOR'),

-- Agency Officer linked to Police
('00000000-0000-0000-0000-000000000005', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Commissioner', 'DISPATCHER')
ON CONFLICT (user_id, agency_id) DO NOTHING;
