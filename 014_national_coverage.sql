-- National Coverage Seeding (37 States + FCT + Strategic Capitals)

-- 1. All States and FCT
INSERT INTO states (name, capital_city, boundary_geom) VALUES
('Abia', 'Umuahia', ST_GeomFromText('POLYGON((7.4 5.4, 7.6 5.4, 7.6 5.6, 7.4 5.6, 7.4 5.4))', 4326)),
('Adamawa', 'Yola', ST_GeomFromText('POLYGON((12.4 9.1, 12.6 9.1, 12.6 9.3, 12.4 9.3, 12.4 9.1))', 4326)),
('Akwa Ibom', 'Uyo', ST_GeomFromText('POLYGON((7.8 4.9, 8.0 4.9, 8.0 5.1, 7.8 5.1, 7.8 4.9))', 4326)),
('Anambra', 'Awka', ST_GeomFromText('POLYGON((7.0 6.1, 7.2 6.1, 7.2 6.3, 7.0 6.3, 7.0 6.1))', 4326)),
('Bauchi', 'Bauchi', ST_GeomFromText('POLYGON((9.7 10.2, 9.9 10.2, 9.9 10.4, 9.7 10.4, 9.7 10.2))', 4326)),
('Bayelsa', 'Yenagoa', ST_GeomFromText('POLYGON((6.2 4.8, 6.4 4.8, 6.4 5.0, 6.2 5.0, 6.2 4.8))', 4326)),
('Benue', 'Makurdi', ST_GeomFromText('POLYGON((8.5 7.6, 8.7 7.6, 8.7 7.8, 8.5 7.8, 8.5 7.6))', 4326)),
('Borno', 'Maiduguri', ST_GeomFromText('POLYGON((13.1 11.8, 13.3 11.8, 13.3 12.0, 13.1 12.0, 13.1 11.8))', 4326)),
('Cross River', 'Calabar', ST_GeomFromText('POLYGON((8.3 4.9, 8.5 4.9, 8.5 5.1, 8.3 5.1, 8.3 4.9))', 4326)),
('Delta', 'Asaba', ST_GeomFromText('POLYGON((6.6 6.1, 6.8 6.1, 6.8 6.3, 6.6 6.3, 6.6 6.1))', 4326)),
('Ebonyi', 'Abakaliki', ST_GeomFromText('POLYGON((8.0 6.2, 8.2 6.2, 8.2 6.4, 8.0 6.4, 8.0 6.2))', 4326)),
('Edo', 'Benin City', ST_GeomFromText('POLYGON((5.5 6.2, 5.7 6.2, 5.7 6.4, 5.5 6.4, 5.5 6.2))', 4326)),
('Ekiti', 'Ado Ekiti', ST_GeomFromText('POLYGON((5.2 7.5, 5.4 7.5, 5.4 7.7, 5.2 7.7, 5.2 7.5))', 4326)),
('Enugu', 'Enugu', ST_GeomFromText('POLYGON((7.4 6.3, 7.6 6.3, 7.6 6.5, 7.4 6.5, 7.4 6.3))', 4326)),
('Federal Capital Territory', 'Abuja', ST_GeomFromText('POLYGON((7.3 8.9, 7.6 8.9, 7.6 9.2, 7.3 9.2, 7.3 8.9))', 4326)),
('Gombe', 'Gombe', ST_GeomFromText('POLYGON((11.1 10.2, 11.3 10.2, 11.3 10.4, 11.1 10.4, 11.1 10.2))', 4326)),
('Imo', 'Owerri', ST_GeomFromText('POLYGON((6.9 5.4, 7.1 5.4, 7.1 5.6, 6.9 5.6, 6.9 5.4))', 4326)),
('Jigawa', 'Dutse', ST_GeomFromText('POLYGON((9.2 11.6, 9.4 11.6, 9.4 11.8, 9.2 11.8, 9.2 11.6))', 4326)),
('Kaduna', 'Kaduna', ST_GeomFromText('POLYGON((7.3 10.4, 7.5 10.4, 7.5 10.6, 7.3 10.6, 7.3 10.4))', 4326)),
('Kano', 'Kano', ST_GeomFromText('POLYGON((8.4 11.9, 8.6 11.9, 8.6 12.1, 8.4 12.1, 8.4 11.9))', 4326)),
('Katsina', 'Katsina', ST_GeomFromText('POLYGON((7.5 12.9, 7.7 12.9, 7.7 13.1, 7.5 13.1, 7.5 12.9))', 4326)),
('Kebbi', 'Birnin Kebbi', ST_GeomFromText('POLYGON((4.1 12.3, 4.3 12.3, 4.3 12.5, 4.1 12.5, 4.1 12.3))', 4326)),
('Kogi', 'Lokoja', ST_GeomFromText('POLYGON((6.6 7.7, 6.8 7.7, 6.8 7.9, 6.6 7.9, 6.6 7.7))', 4326)),
('Kwara', 'Ilorin', ST_GeomFromText('POLYGON((4.4 8.4, 4.6 8.4, 4.6 8.6, 4.4 8.6, 4.4 8.4))', 4326)),
('Lagos', 'Ikeja', ST_GeomFromText('POLYGON((3.3 6.4, 3.5 6.4, 3.5 6.6, 3.3 6.6, 3.3 6.4))', 4326)),
('Nasarawa', 'Lafia', ST_GeomFromText('POLYGON((8.4 8.4, 8.6 8.4, 8.6 8.6, 8.4 8.6, 8.4 8.4))', 4326)),
('Niger', 'Minna', ST_GeomFromText('POLYGON((6.4 9.5, 6.6 9.5, 6.6 9.7, 6.4 9.7, 6.4 9.5))', 4326)),
('Ogun', 'Abeokuta', ST_GeomFromText('POLYGON((3.2 7.0, 3.4 7.0, 3.4 7.2, 3.2 7.2, 3.2 7.0))', 4326)),
('Ondo', 'Akure', ST_GeomFromText('POLYGON((5.1 7.1, 5.3 7.1, 5.3 7.3, 5.1 7.3, 5.1 7.1))', 4326)),
('Osun', 'Osogbo', ST_GeomFromText('POLYGON((4.4 7.7, 4.6 7.7, 4.6 7.9, 4.4 7.9, 4.4 7.7))', 4326)),
('Oyo', 'Ibadan', ST_GeomFromText('POLYGON((3.8 7.3, 4.0 7.3, 4.0 7.5, 3.8 7.5, 3.8 7.3))', 4326)),
('Plateau', 'Jos', ST_GeomFromText('POLYGON((8.8 9.8, 9.0 9.8, 9.0 10.0, 8.8 10.0, 8.8 9.8))', 4326)),
('Rivers', 'Port Harcourt', ST_GeomFromText('POLYGON((6.9 4.7, 7.1 4.7, 7.1 4.9, 6.9 4.9, 6.9 4.7))', 4326)),
('Sokoto', 'Sokoto', ST_GeomFromText('POLYGON((5.1 12.9, 5.3 12.9, 5.3 13.1, 5.1 13.1, 5.1 12.9))', 4326)),
('Taraba', 'Jalingo', ST_GeomFromText('POLYGON((11.3 8.8, 11.5 8.8, 11.5 9.0, 11.3 9.0, 11.3 8.8))', 4326)),
('Yobe', 'Damaturu', ST_GeomFromText('POLYGON((11.9 11.7, 12.1 11.7, 12.1 11.9, 11.9 11.9, 11.9 11.7))', 4326)),
('Zamfara', 'Gusau', ST_GeomFromText('POLYGON((6.6 12.1, 6.8 12.1, 6.8 12.3, 6.6 12.3, 6.6 12.1))', 4326))
ON CONFLICT (name) DO NOTHING;

-- 2. Capital City LGAs (Approximations for detection)
INSERT INTO lgas (state_id, name, boundary_geom)
SELECT id, 'Abuja Municipal', ST_GeomFromText('POLYGON((7.45 9.02, 7.55 9.02, 7.55 9.10, 7.45 9.10, 7.45 9.02))', 4326) FROM states WHERE name = 'Federal Capital Territory'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name, boundary_geom)
SELECT id, 'Kaduna North', ST_GeomFromText('POLYGON((7.40 10.49, 7.46 10.49, 7.46 10.55, 7.40 10.55, 7.40 10.49))', 4326) FROM states WHERE name = 'Kaduna'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO lgas (state_id, name, boundary_geom)
SELECT id, 'Jos North', ST_GeomFromText('POLYGON((8.86 9.89, 8.92 9.89, 8.92 9.95, 8.86 9.95, 8.86 9.89))', 4326) FROM states WHERE name = 'Plateau'
ON CONFLICT (state_id, name) DO NOTHING;

-- Add more as needed...
