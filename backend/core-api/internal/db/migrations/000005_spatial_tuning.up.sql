-- Spatial Performance Tuning & Ledger Optimization

-- 1. Add Spatial Index to Alerts
-- Critical for geospatial range queries like radius search and triangulation
CREATE INDEX IF NOT EXISTS alerts_location_idx ON alerts USING GIST(location);

-- 2. Optimize Audit Logs for timeline views
-- Ensure efficient retrieval of activity history
CREATE INDEX IF NOT EXISTS audit_logs_entity_action_idx ON audit_logs(entity_id, action);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp DESC);

-- 3. Optimize Device Registry lookups
CREATE INDEX IF NOT EXISTS devices_hwid_idx ON devices(hwid);
