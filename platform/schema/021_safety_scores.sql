-- Feature 2: Public Safety Score per LGA
-- Provides transparent safety rankings for public visibility and accountability

CREATE OR REPLACE VIEW lga_safety_scores AS
WITH alert_stats AS (
  SELECT 
    l.id as lga_id,
    COUNT(a.id) as incident_count,
    AVG(a.severity_score) as avg_severity,
    COUNT(CASE WHEN a.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_incidents,
    COUNT(CASE WHEN a.status = 'RESOLVED' THEN 1 END) as resolved_count
  FROM lgas l
  LEFT JOIN alerts a ON ST_Intersects(a.location, l.boundary_geom)
  WHERE (a.created_at > NOW() - INTERVAL '30 days' OR a.id IS NULL)
  GROUP BY l.id
),
prev_stats AS (
  SELECT 
    l.id as lga_id,
    COUNT(a.id) as prev_incident_count,
    AVG(a.severity_score) as prev_avg_severity
  FROM lgas l
  LEFT JOIN alerts a ON ST_Intersects(a.location, l.boundary_geom)
  WHERE (a.created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days' OR a.id IS NULL)
  GROUP BY l.id
)
SELECT 
  l.id as lga_id,
  l.name as lga_name,
  l.code as lga_code,
  s.name as state_name,
  s.code as state_code,
  
  -- Current period stats
  COALESCE(ast.incident_count, 0) as incident_count,
  COALESCE(ast.avg_severity, 0.0) as avg_severity,
  COALESCE(ast.recent_incidents, 0) as recent_incidents,
  COALESCE(ast.resolved_count, 0) as resolved_count,
  
  -- Calculate safety score (0-100, higher is safer)
  GREATEST(0.0, LEAST(100.0, 
    100.0 - (
      COALESCE(ast.incident_count, 0)::FLOAT * 2.0 +  
      COALESCE(ast.avg_severity, 0.0)::FLOAT * 5.0 +   
      COALESCE(ast.recent_incidents, 0)::FLOAT * 3.0 - 
      COALESCE(ast.resolved_count, 0)::FLOAT * 1.0     
    )
  ))::INTEGER as safety_score,
  
  -- Calculate trend (positive = improving, negative = deteriorating)
  CASE 
    WHEN COALESCE(prev.prev_incident_count, 0) = 0 THEN 0
    ELSE (
      (prev.prev_incident_count::FLOAT - COALESCE(ast.incident_count, 0)::FLOAT) / 
      prev.prev_incident_count::FLOAT * 100.0
    )::INTEGER
  END as trend_pct,
  
  -- Risk level categorization
  CASE 
    WHEN (100.0 - (COALESCE(ast.incident_count, 0)::FLOAT * 2.0 + COALESCE(ast.avg_severity, 0.0)::FLOAT * 5.0)) >= 80.0 THEN 'very_safe'
    WHEN (100.0 - (COALESCE(ast.incident_count, 0)::FLOAT * 2.0 + COALESCE(ast.avg_severity, 0.0)::FLOAT * 5.0)) >= 60.0 THEN 'safe'
    WHEN (100.0 - (COALESCE(ast.incident_count, 0)::FLOAT * 2.0 + COALESCE(ast.avg_severity, 0.0)::FLOAT * 5.0)) >= 40.0 THEN 'moderate_risk'
    WHEN (100.0 - (COALESCE(ast.incident_count, 0)::FLOAT * 2.0 + COALESCE(ast.avg_severity, 0.0)::FLOAT * 5.0)) >= 20.0 THEN 'high_risk'
    ELSE 'critical_risk'
  END as risk_level,
  
  -- Resolution rate (percentage of incidents resolved)
  CASE 
    WHEN COALESCE(ast.incident_count, 0) = 0 THEN 100
    ELSE (COALESCE(ast.resolved_count, 0)::FLOAT / NULLIF(ast.incident_count, 0)::FLOAT * 100.0)::INTEGER
  END as resolution_rate_pct,
  
  NOW() as calculated_at
  
FROM lgas l
JOIN states s ON l.state_id = s.id
LEFT JOIN alert_stats ast ON l.id = ast.lga_id
LEFT JOIN prev_stats prev ON l.id = prev.lga_id
ORDER BY safety_score ASC, incident_count DESC;

-- Create materialized view for better performance
DROP MATERIALIZED VIEW IF EXISTS lga_safety_scores_cached CASCADE;
CREATE MATERIALIZED VIEW lga_safety_scores_cached AS
SELECT * FROM lga_safety_scores;

CREATE INDEX IF NOT EXISTS idx_safety_scores_lga ON lga_safety_scores_cached(lga_id);
CREATE INDEX IF NOT EXISTS idx_safety_scores_state ON lga_safety_scores_cached(state_code);
CREATE INDEX IF NOT EXISTS idx_safety_scores_risk ON lga_safety_scores_cached(risk_level);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_safety_scores()
RETURNS VOID AS 'REFRESH MATERIALIZED VIEW lga_safety_scores_cached;' LANGUAGE SQL;
