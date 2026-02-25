-- Test Data: Response Agencies & Assets
-- Spatially correlated with alerts in 005_simulation_data.sql

-- Cleanup existing assets to avoid duplicates (SIMULATION MODE)
DELETE FROM assets;

-- 1. Insert Agencies
INSERT INTO agencies (id, name, acronym, type, jurisdiction_scope, hq_address) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nigerian Army - 7th Division', 'NA-7DIV', 'MILITARY', 'NATIONAL', 'Maimalari Barracks, Maiduguri'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Nigeria Police Force - Borno Command', 'NPF-BORNO', 'POLICE', 'STATE', 'Maiduguri HQ'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Department of State Services', 'DSS', 'MILITARY', 'NATIONAL', 'Aso Drive, Abuja'),
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'NSCDC - Pipeline Protection', 'NSCDC-PIP', 'CIVIL_DEFENSE', 'NATIONAL', 'Port Harcourt')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Assets (Spatially placed for triangulation)

-- Near Borno Kidnapping (13.2 11.5) & Ambush (13.1 11.6)
-- Asset 1: Army Patrol Unit (Very close, high suitability) - 2km away
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Eagle Patrol Alpha', 'PATROL_VEHICLE', ST_GeomFromText('POINT(13.22 11.51)', 4326), 'ACTIVE', 100, 'Armored APC Unit');

-- Asset 2: Forward Operating Base (Close, high capacity) - 10km away
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'FOB Konduga', 'STATION', ST_GeomFromText('POINT(13.15 11.55)', 4326), 'ACTIVE', 80, 'Forward Operating Base');

-- Asset 3: Police QRT (Medium distance) - 25km away (Maiduguri center)
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'QRT Maiduguri', 'PATROL_VEHICLE', ST_GeomFromText('POINT(13.15 11.83)', 4326), 'ACTIVE', 60, 'Quick Response Team');


-- Near FCT Cyber ALERT (7.4 9.1)
-- Asset 4: DSS Cyber Unit (Close)
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Cyber Response Team 1', 'STATION', ST_GeomFromText('POINT(7.42 9.08)', 4326), 'ACTIVE', 90, 'Digital Forensics Unit');


-- Near Delta Pipeline ALERT (5.5 5.5)
-- Asset 5: NSCDC Boat (Close)
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Marine Patrol Delta', 'PATROL_VEHICLE', ST_GeomFromText('POINT(5.52 5.48)', 4326), 'ACTIVE', 100, 'Gunboat Unit');

-- Asset 6: Air Support Bravo (Borno - Helicopter) - High capacity, fast response
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Air Support Bravo', 'HELICOPTER', ST_GeomFromText('POINT(13.25 11.45)', 4326), 'ACTIVE', 95, 'Attack Helicopter');

-- Asset 7: SARS Team 1 (Borno/Konduga)
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'SARS Team 1', 'PATROL_VEHICLE', ST_GeomFromText('POINT(13.10 11.60)', 4326), 'ACTIVE', 75, 'Anti-Robbery Squad');

-- Asset 8: Tactical Squad FCT (Abuja)
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Tactical Squad FCT', 'SWAT_VAN', ST_GeomFromText('POINT(7.45 9.12)', 4326), 'ACTIVE', 85, 'Rapid Response Unit');

-- Asset 9: Drone Surveillance Unit (Delta)
INSERT INTO assets (id, agency_id, name, type, location, status, capacity_level, description) VALUES
(gen_random_uuid(), 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Drone Surv Unit', 'DRONE', ST_GeomFromText('POINT(5.48 5.52)', 4326), 'ACTIVE', 60, 'Pipeline Monitoring Drone');
