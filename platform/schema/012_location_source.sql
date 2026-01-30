-- Add location_source column to alerts table
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS location_source STRING DEFAULT 'GPS';
