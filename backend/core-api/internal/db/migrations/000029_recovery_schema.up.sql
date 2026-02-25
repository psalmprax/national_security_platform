-- Recovery Schema: Define missing mock_data_points table
-- This table was referenced in 005_simulation_data.sql but never defined.

DROP TABLE IF EXISTS mock_data_points;

CREATE TABLE mock_data_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT current_timestamp(),
    value FLOAT,
    location GEOMETRY(POINT, 4326)
);

CREATE INDEX IF NOT EXISTS idx_mock_data_points_ts ON mock_data_points(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mock_data_points_loc ON mock_data_points USING GIST(location);
