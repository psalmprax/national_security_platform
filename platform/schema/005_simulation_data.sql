-- Simulation Data for Dashboard Scenarios

-- 1. Spatial Foundation (Mock States)
INSERT INTO states (name, capital_city, boundary_geom) VALUES
('Borno', 'Maiduguri', ST_GeomFromText('POLYGON((12.0 11.0, 13.0 11.0, 13.0 12.0, 12.0 12.0, 12.0 11.0))', 4326)),
('Lagos', 'Ikeja', ST_GeomFromText('POLYGON((3.0 6.0, 4.0 6.0, 4.0 7.0, 3.0 7.0, 3.0 6.0))', 4326)),
('FCT', 'Abuja', ST_GeomFromText('POLYGON((7.0 9.0, 7.5 9.0, 7.5 9.5, 7.0 9.5, 7.0 9.0))', 4326))
ON CONFLICT (name) DO NOTHING;

-- 2. Trusted Devices (Linking to RBAC Users)
-- Link Field Commander (Tactical) to a specialized rugged device
INSERT INTO devices (user_id, hwid, public_key, device_model, status)
SELECT id, 'TACTICAL-DEV-001', '-----BEGIN PUBLIC KEY...-----', 'Getac V110', 'ACTIVE'
FROM users WHERE phone_number = '+2348000000103'
ON CONFLICT (hwid) DO NOTHING;

-- Link Cyber Analyst to a secure workstation ID
INSERT INTO devices (user_id, hwid, public_key, device_model, status)
SELECT id, 'CYBER-STATION-01', '-----BEGIN PUBLIC KEY...-----', 'Secure Workstation Alpha', 'ACTIVE'
FROM users WHERE phone_number = '+2348000000101'
ON CONFLICT (hwid) DO NOTHING;

-- 3. Scenario: North-East Insurgency (Tactical View)
-- Critical Kidnapping Alert
INSERT INTO alerts (id, user_id, alert_type, priority_class, status, content_text, location, impact_radius_meters, severity_score, created_at)
SELECT '4b23dadc-da14-4eb4-9944-55b2a1c31d3f', id, 'KIDNAPPING', 'CRITICAL', 'VERIFIED', 'Confirmed report of abduction on Bama road. 3 vehicles involved.', ST_GeomFromText('POINT(13.2 11.5)', 4326), 500, 0.95, NOW() - INTERVAL '30 minutes'
FROM users WHERE phone_number = '+2348000000103'
ON CONFLICT (id) DO NOTHING;

-- Ambush Alert
INSERT INTO alerts (id, user_id, alert_type, priority_class, status, content_text, location, impact_radius_meters, severity_score, created_at)
SELECT '5c34ebe1-eb25-5fc5-0055-66c3b2d42e40', id, 'AMBUSH', 'CRITICAL', 'PENDING', 'Suspected ambush point spotted near Konduga.', ST_GeomFromText('POINT(13.1 11.6)', 4326), 200, 0.85, NOW() - INTERVAL '2 hours'
FROM users WHERE phone_number = '+2348000000103'
ON CONFLICT (id) DO NOTHING;

-- 4. Scenario: Cyber Threat (Cyber View)
-- Data Breach
INSERT INTO alerts (id, user_id, alert_type, priority_class, status, content_text, location, impact_radius_meters, severity_score, risk_keywords, created_at)
SELECT '6d45fcf2-fc36-6fd6-1166-77d4c3e53f51', id, 'CYBER_ATTACK', 'URGENT', 'VERIFIED', 'Unusual outbound traffic detected from State Finance Server.', ST_GeomFromText('POINT(7.4 9.1)', 4326), 0, 0.8, ARRAY['exfiltration', 'anomaly', 'finance'], NOW() - INTERVAL '45 minutes'
FROM users WHERE phone_number = '+2348000000101'
ON CONFLICT (id) DO NOTHING;

-- 5. Scenario: Infrastructure (Strategic View)
-- Pipeline Vandalism
INSERT INTO alerts (id, user_id, alert_type, priority_class, status, content_text, location, impact_radius_meters, severity_score, created_at)
SELECT '7e560df3-0d47-7fe7-2277-88e5d4f64062', id, 'INFRASTRUCTURE', 'HIGH', 'ANALYSIS_REQ', 'Satellite imagery suggests pipeline tapering near Delta creek.', ST_GeomFromText('POINT(5.5 5.5)', 4326), 1000, 0.75, NOW() - INTERVAL '5 hours'
FROM users WHERE phone_number = '+2348000000102'
ON CONFLICT (id) DO NOTHING;

-- 6. Corroboration
-- Verify the kidnapping alert
INSERT INTO corroborations (alert_id, verifier_id, confidence_score, comments)
SELECT a.id, u.id, 0.9, 'Visual confirmation from drone recon.'
FROM alerts a, users u 
WHERE a.id = '4b23dadc-da14-4eb4-9944-55b2a1c31d3f' 
AND u.role = 'STRATEGIC_PLANNER'
ON CONFLICT (alert_id, verifier_id) DO NOTHING;
