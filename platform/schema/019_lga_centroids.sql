-- Migration 018: LGA Centroids and Hybrid Spatial Resolution
-- Purpose: Add centroid points for LGAs without full boundary geometries
-- Strategy: Enables nearest-neighbor spatial queries as fallback

-- Add centroid column to lgas table
ALTER TABLE lgas ADD COLUMN IF NOT EXISTS centroid GEOMETRY(Point, 4326);

-- Create spatial index on centroids for fast nearest-neighbor queries
CREATE INDEX IF NOT EXISTS idx_lgas_centroid ON lgas USING GIST (centroid);

-- Populate centroids for LGAs that have boundary geometries
UPDATE lgas
SET centroid = ST_Centroid(boundary_geom)
WHERE boundary_geom IS NOT NULL AND centroid IS NULL;

-- For LGAs without boundaries, estimate centroid based on state distribution
-- This uses a grid-based approach to distribute LGA centroids within each state

WITH state_lgas AS (
    SELECT 
        l.id as lga_id,
        l.name as lga_name,
        s.id as state_id,
        s.name as state_name,
        ST_Centroid(s.boundary_geom) as state_center,
        ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY l.name) - 1 as lga_index,
        COUNT(*) OVER (PARTITION BY s.id) as state_lga_count,
        ST_XMin(s.boundary_geom) as state_min_lon,
        ST_YMin(s.boundary_geom) as state_min_lat,
        ST_XMax(s.boundary_geom) as state_max_lon,
        ST_YMax(s.boundary_geom) as state_max_lat
    FROM lgas l
    JOIN states s ON s.id = l.state_id
    WHERE l.boundary_geom IS NULL AND l.centroid IS NULL
),
lga_positions AS (
    SELECT 
        lga_id,
        lga_name,
        state_name,
        -- Calculate grid position
        FLOOR(SQRT(state_lga_count::float))::int as grid_cols,
        (lga_index / FLOOR(SQRT(state_lga_count::float))::int) as row_idx,
        (lga_index % FLOOR(SQRT(state_lga_count::float))::int) as col_idx,
        -- State bounds
        state_min_lon,
        state_min_lat,
        state_max_lon,
        state_max_lat
    FROM state_lgas
)
UPDATE lgas
SET centroid = ST_SetSRID(
    ST_MakePoint(
        -- Longitude: distribute evenly across state width
        pos.state_min_lon + ((pos.state_max_lon - pos.state_min_lon) * (pos.col_idx::float + 0.5) / GREATEST(pos.grid_cols::float, 1.0)),
        -- Latitude: distribute evenly across state height  
        pos.state_min_lat + ((pos.state_max_lat - pos.state_min_lat) * (pos.row_idx::float + 0.5) / GREATEST(pos.grid_cols::float, 1.0))
    ),
    4326
)
FROM lga_positions pos
WHERE lgas.id = pos.lga_id
  AND lgas.centroid IS NULL;

-- Add comment explaining the centroid strategy
COMMENT ON COLUMN lgas.centroid IS 'LGA centroid point. For LGAs with boundaries, this is the geometric center. For LGAs without boundaries, this is an estimated position based on grid distribution within the parent state.';
