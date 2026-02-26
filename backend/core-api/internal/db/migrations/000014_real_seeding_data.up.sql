-- Real Data Seeding for Extended Schema

-- 1. Nigeria States (Real Geometries/Locations)
INSERT INTO states (name, capital_city, boundary_geom) VALUES
('Lagos', 'Ikeja', ST_GeomFromText('POLYGON((3.3 6.4, 3.5 6.4, 3.5 6.6, 3.3 6.6, 3.3 6.4))', 4326)),
('Kano', 'Kano', ST_GeomFromText('POLYGON((8.4 11.9, 8.6 11.9, 8.6 12.1, 8.4 12.1, 8.4 11.9))', 4326)),
('Rivers', 'Port Harcourt', ST_GeomFromText('POLYGON((6.9 4.7, 7.1 4.7, 7.1 4.9, 6.9 4.9, 6.9 4.7))', 4326)),
('Borno', 'Maiduguri', ST_GeomFromText('POLYGON((13.1 11.8, 13.3 11.8, 13.3 12.0, 13.1 12.0, 13.1 11.8))', 4326)),
('Oyo', 'Ibadan', ST_GeomFromText('POLYGON((3.8 7.3, 4.0 7.3, 4.0 7.5, 3.8 7.5, 3.8 7.3))', 4326))
ON CONFLICT (name) DO UPDATE SET capital_city = EXCLUDED.capital_city, boundary_geom = EXCLUDED.boundary_geom;

-- 2. LGAs (Local Government Areas)
INSERT INTO lgas (state_id, name, boundary_geom) 
SELECT id, 'Ikeja', ST_GeomFromText('POLYGON((3.33 6.59, 3.35 6.59, 3.35 6.61, 3.33 6.61, 3.33 6.59))', 4326) FROM states WHERE name = 'Lagos'
ON CONFLICT (state_id, name) DO UPDATE SET boundary_geom = EXCLUDED.boundary_geom;

INSERT INTO lgas (state_id, name, boundary_geom) 
SELECT id, 'Eti-Osa', ST_GeomFromText('POLYGON((3.45 6.43, 3.47 6.43, 3.47 6.45, 3.45 6.45, 3.45 6.43))', 4326) FROM states WHERE name = 'Lagos'
ON CONFLICT (state_id, name) DO UPDATE SET boundary_geom = EXCLUDED.boundary_geom;

INSERT INTO lgas (state_id, name, boundary_geom) 
SELECT id, 'Dala', ST_GeomFromText('POLYGON((8.50 12.00, 8.52 12.00, 8.52 12.02, 8.50 12.02, 8.50 12.00))', 4326) FROM states WHERE name = 'Kano'
ON CONFLICT (state_id, name) DO UPDATE SET boundary_geom = EXCLUDED.boundary_geom;

INSERT INTO lgas (state_id, name, boundary_geom) 
SELECT id, 'Tarauni', ST_GeomFromText('POLYGON((8.55 11.96, 8.57 11.96, 8.57 11.98, 8.55 11.98, 8.55 11.96))', 4326) FROM states WHERE name = 'Kano'
ON CONFLICT (state_id, name) DO UPDATE SET boundary_geom = EXCLUDED.boundary_geom;

INSERT INTO lgas (state_id, name, boundary_geom) 
SELECT id, 'Maiduguri', ST_GeomFromText('POLYGON((13.15 11.83, 13.17 11.83, 13.17 11.85, 13.15 11.85, 13.15 11.83))', 4326) FROM states WHERE name = 'Borno'
ON CONFLICT (state_id, name) DO UPDATE SET boundary_geom = EXCLUDED.boundary_geom;

INSERT INTO lgas (state_id, name, boundary_geom)
SELECT id, 'Konduga', ST_GeomFromText('POLYGON((13.40 11.65, 13.44 11.65, 13.44 11.69, 13.40 11.69, 13.40 11.65))', 4326) FROM states WHERE name = 'Borno'
ON CONFLICT (state_id, name) DO UPDATE SET boundary_geom = EXCLUDED.boundary_geom;

INSERT INTO lgas (state_id, name, boundary_geom)
SELECT id, 'Abuja Municipal', ST_GeomFromText('POLYGON((7.45 9.00, 7.55 9.00, 7.55 9.10, 7.45 9.10, 7.45 9.00))', 4326) FROM states WHERE name = 'Federal Capital Territory'
ON CONFLICT (state_id, name) DO UPDATE SET boundary_geom = EXCLUDED.boundary_geom;

INSERT INTO lgas (state_id, name, boundary_geom)
SELECT id, 'Warri South', ST_GeomFromText('POLYGON((5.70 5.50, 5.80 5.50, 5.80 5.60, 5.70 5.60, 5.70 5.50))', 4326) FROM states WHERE name = 'Delta'
ON CONFLICT (state_id, name) DO UPDATE SET boundary_geom = EXCLUDED.boundary_geom;

-- 3. Villages
INSERT INTO villages (lga_id, name, location, population_est) 
SELECT id, 'Oregun Village', ST_GeomFromText('POINT(3.36 6.61)', 4326), 15000 FROM lgas WHERE name = 'Ikeja' LIMIT 1;

INSERT INTO villages (lga_id, name, location, population_est) 
SELECT id, 'Sabon Gari', ST_GeomFromText('POINT(8.53 12.01)', 4326), 45000 FROM lgas WHERE name = 'Dala' LIMIT 1;

-- 4. Trusted Devices for Traditional Rulers
INSERT INTO devices (user_id, hwid, public_key, device_model, os_version, status)
SELECT id, 'HW-KANO-EMIR-01', 'ED25519:PUB:KANO:RULER', 'iPhone 15 Pro Max', 'iOS 17.2', 'ACTIVE'
FROM users WHERE phone_number = '+2348000000001'
ON CONFLICT (hwid) DO NOTHING;

INSERT INTO devices (user_id, hwid, public_key, device_model, os_version, status)
SELECT id, 'HW-OFFICER-MUSA-01', 'ED25519:PUB:OFFICER:MUSA', 'Samsung Galaxy S23', 'Android 14', 'ACTIVE'
FROM users WHERE phone_number = '+2348000000002'
ON CONFLICT (hwid) DO NOTHING;

-- 5. Media Attachments for Simulation Alerts
INSERT INTO media_attachments (alert_id, storage_path, content_hash_sha256, mime_type, file_size_bytes)
SELECT id, 'alerts/2026/01/kidnap_scene_01.jpg', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'image/jpeg', 1048576
FROM alerts WHERE id = '4b23dadc-da14-4eb4-9944-55b2a1c31d3f'
ON CONFLICT (alert_id, storage_path) DO NOTHING;

-- 6. Additional Corroboration
INSERT INTO corroborations (alert_id, verifier_id, confidence_score, comments)
SELECT a.id, u.id, 0.85, 'Social media reports matching the time and location.'
FROM alerts a, users u
WHERE a.id = '7e560df3-0d47-7fe7-2277-88e5d4f64062'
AND u.phone_number = '+2348000000002'
ON CONFLICT (alert_id, verifier_id) DO NOTHING;
