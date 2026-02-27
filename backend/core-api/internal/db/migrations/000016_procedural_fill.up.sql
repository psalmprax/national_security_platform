-- Procedural Generation for Load Testing (CockroachDB Friendly)

-- 1. Central Districts (Already run in previous step, but safe to re-run with ON CONFLICT)
INSERT INTO lgas (state_id, name, boundary_geom)
SELECT 
    id, 
    name || ' Central District', 
    ST_Buffer(ST_Centroid(boundary_geom)::geography, 15000)::geometry 
FROM states
ON CONFLICT (state_id, name) DO NOTHING;

-- 2. Generate Synthetic Villages (50 per State)
-- Using generate_series and calculating random offsets from Centroid
INSERT INTO villages (lga_id, name, location, population_est, created_at)
SELECT
    l.id,
    'Village-' || s.name || '-' || i::text,
    ST_SetSRID(ST_MakePoint(
        ST_X(ST_Centroid(s.boundary_geom)) + (random() * 0.4 - 0.2), -- +/- 0.2 degrees (~20km)
        ST_Y(ST_Centroid(s.boundary_geom)) + (random() * 0.4 - 0.2)
    ), 4326),
    (random() * 5000 + 100)::int,
    now()
FROM states s
JOIN lgas l ON l.state_id = s.id AND l.name LIKE '%Central District'
CROSS JOIN generate_series(1, 50) as i
ON CONFLICT (lga_id, name) DO NOTHING;

-- 3. Specific Forest Locations
INSERT INTO villages (lga_id, name, location, population_est)
SELECT 
    id, 
    'Sambisa Forest Outpost', 
    ST_SetSRID(ST_MakePoint(13.25, 11.53), 4326), 
    50 
FROM lgas WHERE name = 'Borno Central District' 
LIMIT 1
ON CONFLICT (lga_id, name) DO NOTHING;

INSERT INTO villages (lga_id, name, location, population_est)
SELECT 
    id, 
    'Birnin Gwari Forest Cache', 
    ST_SetSRID(ST_MakePoint(6.92, 10.66), 4326), 
    120 
FROM lgas WHERE name = 'Kaduna Central District' 
LIMIT 1
ON CONFLICT (lga_id, name) DO NOTHING;
