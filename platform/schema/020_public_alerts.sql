-- Feature 1: Citizen Safety Notifications (Reverse Alerts)
-- This allows security agencies to broadcast alerts TO citizens in affected areas

CREATE TABLE IF NOT EXISTS public_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('info', 'warning', 'critical', 'emergency')),
  alert_type VARCHAR(50), -- threat_active, all_clear, missing_person, road_closure, etc.
  
  -- Geospatial targeting
  location GEOGRAPHY(POINT, 4326),
  radius_meters INTEGER DEFAULT 5000,
  affected_lga_codes TEXT[], -- Optional: target specific LGAs
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  related_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL, -- Link to original incident
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-dismiss after this time
  
  -- Analytics
  affected_count INTEGER DEFAULT 0, -- Number of users notified
  delivery_status VARCHAR(20) DEFAULT 'pending' -- pending, sending, sent, failed
);

CREATE INDEX IF NOT EXISTS idx_public_alerts_location ON public_alerts USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_public_alerts_created_at ON public_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_alerts_level ON public_alerts(alert_level);

COMMENT ON TABLE public_alerts IS 'Broadcasts from agencies to citizens in affected areas';
COMMENT ON COLUMN public_alerts.alert_level IS 'info=general notice, warning=caution advised, critical=immediate action, emergency=life-threatening';
COMMENT ON COLUMN public_alerts.radius_meters IS 'Radius from location point to send notifications (default 5km)';
