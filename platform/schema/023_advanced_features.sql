-- Feature 5: NLP Report Analysis - Store extracted intelligence
-- Extends alerts table to store NLP-extracted data

ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS entities JSONB, -- Extracted entities (people, places, vehicles, organizations)
ADD COLUMN IF NOT EXISTS extracted_keywords TEXT[], -- Key terms from description
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20), -- low, medium, high, critical (auto-classified)
ADD COLUMN IF NOT EXISTS auto_categorized BOOLEAN DEFAULT FALSE; -- Indicates if NLP processed

CREATE INDEX IF NOT EXISTS idx_alerts_urgency ON alerts(urgency_level);
CREATE INDEX IF NOT EXISTS idx_alerts_entities ON alerts USING GIN(entities);
CREATE INDEX IF NOT EXISTS idx_alerts_keywords ON alerts USING GIN(extracted_keywords);

COMMENT ON COLUMN alerts.entities IS 'NLP-extracted entities as JSON: {people: [], locations: [], vehicles: [], organizations: []}';
COMMENT ON COLUMN alerts.extracted_keywords IS 'Key terms extracted from description for search/filtering';
COMMENT ON COLUMN alerts.urgency_level IS 'Auto-classified urgency: low, medium, high, critical';

-- Feature 6: Alert Correlation - Track related incidents
CREATE TABLE IF NOT EXISTS incident_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name VARCHAR(200) NOT NULL,
  pattern_description TEXT,
  alert_ids UUID[] NOT NULL, -- Array of related alert IDs
  alert_count INTEGER DEFAULT 0,
  
  -- Geospatial bounds
  centroid_location GEOGRAPHY(POINT, 4326),
  radius_meters INTEGER,
  
  -- Temporal bounds  
  first_incident_at TIMESTAMPTZ,
  last_incident_at TIMESTAMPTZ,
  
  -- Cluster metadata
  threat_type VARCHAR(50),
  severity_avg FLOAT,
  status VARCHAR(20) DEFAULT 'active', -- active, resolved, monitoring
  
  -- Detection
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detected_by VARCHAR(20) DEFAULT 'auto', -- auto or user_id
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clusters_status ON incident_clusters(status);
CREATE INDEX IF NOT EXISTS idx_clusters_created ON incident_clusters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_location ON incident_clusters USING GIST(centroid_location);

COMMENT ON TABLE incident_clusters IS 'Groups of related alerts indicating patterns or coordinated activity';
COMMENT ON COLUMN incident_clusters.pattern_description IS 'AI-generated description of the pattern (e.g., "Sequential attacks along Route A2")';

-- Feature 8: Missing Persons Database
CREATE TABLE IF NOT EXISTS missing_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  full_name VARCHAR(200) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  photo_url VARCHAR(500), -- MinIO URL
  description TEXT,
  identifying_features TEXT, -- Scars, tattoos, etc.
  
  -- Last seen
  last_seen_location GEOGRAPHY(POINT, 4326),
  last_seen_address TEXT,
  last_seen_date TIMESTAMPTZ,
  last_seen_with TEXT, -- Description of companions
  
  -- Clothing
  clothing_description TEXT,
  
  -- Contact
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_relationship VARCHAR(50), -- family, friend, police, etc.
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'missing', -- missing, found_alive, found_deceased, closed
  found_date TIMESTAMPTZ,
  found_location GEOGRAPHY(POINT, 4326),
  outcome_notes TEXT,
  
  -- Cross-reference
  related_alert_ids UUID[], -- Linked kidnapping/incident alerts
  case_number VARCHAR(50), -- Official police case number
  
  -- Metadata
  public_visible BOOLEAN DEFAULT TRUE, -- Show on public registry
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_missing_persons_status ON missing_persons(status);
CREATE INDEX IF NOT EXISTS idx_missing_persons_last_seen ON missing_persons USING GIST(last_seen_location);
CREATE INDEX IF NOT EXISTS idx_missing_persons_public ON missing_persons(public_visible, status);
CREATE INDEX IF NOT EXISTS idx_missing_persons_created ON missing_persons(created_at DESC);

COMMENT ON TABLE missing_persons IS 'National registry of missing persons with family portal access';
COMMENT ON COLUMN missing_persons.public_visible IS 'If true, appears in public search registry';

-- Feature 9: Shared Incident Response (Task Management)
CREATE TABLE IF NOT EXISTS incident_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  
  -- Task details
  task_title VARCHAR(200) NOT NULL,
  task_description TEXT,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  
  -- Assignment
  assigned_agency VARCHAR(50), -- POLICE, DSS, ARMY, etc.
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status tracking
  task_status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  
  -- Update details
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(200),
  user_agency VARCHAR(50),
  update_text TEXT NOT NULL,
  update_type VARCHAR(20) DEFAULT 'note', -- note, status_change, task_complete, media
  
  -- Attachments
  media_urls TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_incident ON incident_tasks(incident_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON incident_tasks(task_status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON incident_tasks(assigned_to, task_status);
CREATE INDEX IF NOT EXISTS idx_updates_incident ON incident_updates(incident_id, created_at DESC);

COMMENT ON TABLE incident_tasks IS 'Multi-agency task assignments for coordinated incident response';
COMMENT ON TABLE incident_updates IS 'Timeline of updates and notes on incidents for situational awareness';

-- Feature 10: Inter-Agency Chat
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  room_name VARCHAR(200) NOT NULL,
  room_type VARCHAR(20) DEFAULT 'incident', -- incident, agency, direct
  
  -- Participants
  participant_ids UUID[], -- User IDs with access
  active_users_count INTEGER DEFAULT 0,
  
  -- Settings
  archived BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  
  -- Message details
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(200),
  user_agency VARCHAR(50),
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- text, file, image, system
  
  -- Attachments
  file_url VARCHAR(500),
  
  -- Status
  read_by UUID[], -- User IDs who have read this message
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_incident ON chat_rooms(incident_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at DESC);

COMMENT ON TABLE chat_rooms IS 'Secure chat rooms for inter-agency coordination';
COMMENT ON TABLE chat_messages IS 'Chat message history with audit trail';
