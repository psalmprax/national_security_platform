-- Add FCM Token for Public Safety Notifications
ALTER TABLE devices ADD COLUMN IF NOT EXISTS fcm_token STRING;
CREATE INDEX IF NOT EXISTS idx_devices_fcm_token ON devices(fcm_token) WHERE fcm_token IS NOT NULL;

-- Add last known location for targeted spatial alerts
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_known_location GEOMETRY(POINT, 4326);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST(last_known_location);
