-- Feature 4: Anonymous Tip Line
-- Allows anyone to submit tips without authentication for sensitive intelligence

CREATE TABLE IF NOT EXISTS anonymous_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_content TEXT NOT NULL,
  threat_type VARCHAR(50), -- kidnapping, terrorism, robbery, suspicious_activity, other
  
  -- Location (optional)
  location GEOGRAPHY(POINT, 4326),
  location_description TEXT,
  lga_code VARCHAR(10),
  
  -- Media evidence (optional)
  media_urls TEXT[], -- Photos/videos uploaded to MinIO
  
  -- Verification workflow
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending, under_review, verified, rejected, converted
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- If verified, convert to full alert
  converted_alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
  
  -- Metadata
  submitted_from_ip INET, -- For rate limiting
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anonymous_tips_status ON anonymous_tips(verification_status);
CREATE INDEX IF NOT EXISTS idx_anonymous_tips_created ON anonymous_tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anonymous_tips_location ON anonymous_tips USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_anonymous_tips_ip ON anonymous_tips(submitted_from_ip, created_at);

COMMENT ON TABLE anonymous_tips IS 'Anonymous tip submissions requiring manual verification before conversion to alerts';
COMMENT ON COLUMN anonymous_tips.verification_status IS 'pending=awaiting review, under_review=analyst reviewing, verified=confirmed, rejected=dismissed, converted=became full alert';
COMMENT ON COLUMN anonymous_tips.submitted_from_ip IS 'Used for rate limiting (max 5 tips/hour per IP)';
