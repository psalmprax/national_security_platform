package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RiskLevel represents the severity of risk
type RiskLevel string

const (
	RiskLevelLow      RiskLevel = "low"
	RiskLevelMedium   RiskLevel = "medium"
	RiskLevelHigh     RiskLevel = "high"
	RiskLevelCritical RiskLevel = "critical"
)

// RiskScore represents a calculated risk assessment
type RiskScore struct {
	Score        float64   `json:"score"`         // 0-100 scale (100 = safest)
	Level        RiskLevel `json:"level"`         // Risk level category
	Factors      []string  `json:"factors"`       // Contributing factors
	NearbyAlerts int       `json:"nearby_alerts"` // Count of alerts in area
	Timestamp    time.Time `json:"timestamp"`
}

// RouteRiskRequest represents a request to calculate route safety
type RouteRiskRequest struct {
	Waypoints    []Location `json:"waypoints"`
	RadiusMeters float64    `json:"radius_meters,omitempty"`
}

// RouteRiskResponse represents the route risk calculation result
type RouteRiskResponse struct {
	OverallScore   float64        `json:"overall_score"`
	OverallLevel   RiskLevel      `json:"overall_level"`
	Waypoints      []WaypointRisk `json:"waypoints"`
	Recommendation string         `json:"recommendation"`
}

// WaypointRisk represents risk at a specific point on the route
type WaypointRisk struct {
	Location Location  `json:"location"`
	Score    float64   `json:"score"`
	Level    RiskLevel `json:"level"`
	Distance float64   `json:"distance_from_route"` // meters
}

// LocationUpdate represents a location update from mobile
type LocationUpdate struct {
	UserID    string    `json:"user_id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Accuracy  float64   `json:"accuracy,omitempty"`
	Altitude  float64   `json:"altitude,omitempty"`
	Speed     float64   `json:"speed,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// RiskHandler handles risk-related requests
type RiskHandler struct {
	db *pgxpool.Pool
}

// NewRiskHandler creates a new risk handler
func NewRiskHandler(db *pgxpool.Pool) *RiskHandler {
	return &RiskHandler{db: db}
}

// GetLocationRisk calculates risk for a given location
func (h *RiskHandler) GetLocationRisk(w http.ResponseWriter, r *http.Request) {
	// Get lat/lng from query params
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")
	radiusStr := r.URL.Query().Get("radius")

	if latStr == "" || lngStr == "" {
		http.Error(w, "Missing lat or lng parameter", http.StatusBadRequest)
		return
	}

	var lat, lng float64
	_, err := fmt.Sscanf(latStr, "%f", &lat)
	if err != nil {
		http.Error(w, "Invalid lat parameter", http.StatusBadRequest)
		return
	}
	_, err = fmt.Sscanf(lngStr, "%f", &lng)
	if err != nil {
		http.Error(w, "Invalid lng parameter", http.StatusBadRequest)
		return
	}

	radius := 500.0 // default 500m
	if radiusStr != "" {
		fmt.Sscanf(radiusStr, "%f", &radius)
	}

	// Query for nearby alerts within radius
	query := `
		SELECT 
			alert_type,
			severity_score,
			status,
			created_at,
			ST_Distance(
				ST_MakePoint($1, $2)::geography,
				location::geography
			) as distance
		FROM public_alerts
		WHERE status = 'active'
			AND ST_DWithin(
				location::geography,
				ST_MakePoint($1, $2)::geography,
				$3
			)
		ORDER BY severity_score DESC
		LIMIT 20
	`

	rows, err := h.db.Query(context.Background(), query, lng, lat, radius)
	if err != nil {
		http.Error(w, "Failed to query alerts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var riskScore float64 = 100.0
	var factors []string
	var nearbyAlerts int
	var maxSeverity float64

	for rows.Next() {
		var alertType, status string
		var severityScore float64
		var createdAt time.Time
		var distance float64

		err := rows.Scan(&alertType, &severityScore, &status, &createdAt, &distance)
		if err != nil {
			continue
		}

		nearbyAlerts++

		// Calculate distance-based weight (closer = higher risk)
		distanceWeight := 1.0 - (distance / radius)
		if distanceWeight < 0 {
			distanceWeight = 0
		}

		// Factor in severity
		alertRisk := severityScore * distanceWeight * 100
		riskScore -= alertRisk

		// Track max severity
		if severityScore > maxSeverity {
			maxSeverity = severityScore
		}

		// Add contributing factors
		if distance < 100 {
			factors = append(factors, getAlertFactor(alertType, distance))
		}
	}

	// Clamp score
	if riskScore < 0 {
		riskScore = 0
	}

	// Determine level
	level := getRiskLevel(riskScore)

	// Add time-based factor (night time is riskier)
	hour := time.Now().Hour()
	if hour >= 22 || hour < 5 {
		riskScore -= 10
		factors = append(factors, "Late night hours - reduced visibility")
	}

	response := RiskScore{
		Score:        math.Round(riskScore*10) / 10,
		Level:        level,
		Factors:      factors,
		NearbyAlerts: nearbyAlerts,
		Timestamp:    time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// CalculateRouteRisk calculates risk for a route with multiple waypoints
func (h *RiskHandler) CalculateRouteRisk(w http.ResponseWriter, r *http.Request) {
	var req RouteRiskRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Waypoints) < 2 {
		http.Error(w, "At least 2 waypoints required", http.StatusBadRequest)
		return
	}

	radius := req.RadiusMeters
	if radius == 0 {
		radius = 500.0 // default 500m
	}

	waypointRisks := make([]WaypointRisk, 0, len(req.Waypoints))
	var totalScore float64

	for i, wp := range req.Waypoints {
		// Query alerts near this waypoint
		query := `
			SELECT 
				alert_type,
				severity_score,
				ST_Distance(
					ST_MakePoint($1, $2)::geography,
					location::geography
				) as distance
			FROM public_alerts
			WHERE status = 'active'
				AND ST_DWithin(
					location::geography,
					ST_MakePoint($1, $2)::geography,
					$3
				)
			ORDER BY severity_score DESC
			LIMIT 10
		`

		rows, err := h.db.Query(context.Background(), query, wp.Longitude, wp.Latitude, radius)
		if err != nil {
			continue
		}

		var wpScore float64 = 100.0

		for rows.Next() {
			var alertType string
			var severityScore float64
			var distance float64

			err := rows.Scan(&alertType, &severityScore, &distance)
			if err != nil {
				continue
			}

			distanceWeight := 1.0 - (distance / radius)
			if distanceWeight < 0 {
				distanceWeight = 0
			}

			alertRisk := severityScore * distanceWeight * 100
			wpScore -= alertRisk
		}
		rows.Close()

		if wpScore < 0 {
			wpScore = 0
		}

		level := getRiskLevel(wpScore)

		// Calculate distance from route for first/last point
		var distanceFromRoute float64
		if i > 0 && i < len(req.Waypoints)-1 {
			distanceFromRoute = 0 // On route
		} else {
			distanceFromRoute = 0
		}

		waypointRisks = append(waypointRisks, WaypointRisk{
			Location: wp,
			Score:    math.Round(wpScore*10) / 10,
			Level:    level,
			Distance: distanceFromRoute,
		})

		totalScore += wpScore
	}

	// Calculate overall score
	overallScore := totalScore / float64(len(req.Waypoints))
	overallLevel := getRiskLevel(overallScore)

	// Generate recommendation
	recommendation := getRecommendation(overallScore, overallLevel)

	response := RouteRiskResponse{
		OverallScore:   math.Round(overallScore*10) / 10,
		OverallLevel:   overallLevel,
		Waypoints:      waypointRisks,
		Recommendation: recommendation,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UpdateLocation handles location updates from mobile clients
func (h *RiskHandler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	var loc LocationUpdate
	err := json.NewDecoder(r.Body).Decode(&loc)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if loc.UserID == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		return
	}

	// Store location in database
	query := `
		INSERT INTO user_locations (user_id, location, accuracy, speed, updated_at)
		VALUES ($1, ST_MakePoint($2, $3)::geography, $4, $5, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			location = ST_MakePoint($2, $3)::geography,
			accuracy = $4,
			speed = $5,
			updated_at = NOW()
	`

	_, err = h.db.Exec(context.Background(), query,
		loc.UserID,
		loc.Longitude,
		loc.Latitude,
		loc.Accuracy,
		loc.Speed,
	)
	if err != nil {
		http.Error(w, "Failed to store location", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// GetNearbyAlerts returns alerts near a given location
func (h *RiskHandler) GetNearbyAlerts(w http.ResponseWriter, r *http.Request) {
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")
	radiusStr := r.URL.Query().Get("radius")

	if latStr == "" || lngStr == "" {
		http.Error(w, "Missing lat or lng parameter", http.StatusBadRequest)
		return
	}

	var lat, lng, radius float64
	fmt.Sscanf(latStr, "%f", &lat)
	fmt.Sscanf(lngStr, "%f", &lng)
	radius = 1000 // default 1km
	if radiusStr != "" {
		fmt.Sscanf(radiusStr, "%f", &radius)
	}

	query := `
		SELECT 
			id,
			alert_type,
			title,
			description,
			severity_score,
			location,
			created_at,
			ST_Distance(
				ST_MakePoint($1, $2)::geography,
				location::geography
			) as distance
		FROM public_alerts
		WHERE status = 'active'
			AND ST_DWithin(
				location::geography,
				ST_MakePoint($1, $2)::geography,
				$3
			)
		ORDER BY severity_score DESC, distance ASC
		LIMIT 50
	`

	rows, err := h.db.Query(context.Background(), query, lng, lat, radius)
	if err != nil {
		http.Error(w, "Failed to query alerts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type alertRow struct {
		id          string
		alertType   string
		title       string
		description string
		severity    float64
		location    string
		createdAt   time.Time
		distance    float64
	}

	var alerts []alertRow
	for rows.Next() {
		var a alertRow
		err := rows.Scan(&a.id, &a.alertType, &a.title, &a.description,
			&a.severity, &a.location, &a.createdAt, &a.distance)
		if err != nil {
			continue
		}
		alerts = append(alerts, a)
	}

	// Format response
	type alertResponse struct {
		ID          string  `json:"id"`
		Type        string  `json:"type"`
		Title       string  `json:"title"`
		Description string  `json:"description"`
		Severity    float64 `json:"severity_score"`
		Latitude    float64 `json:"lat"`
		Longitude   float64 `json:"lng"`
		Distance    float64 `json:"distance_meters"`
		CreatedAt   string  `json:"created_at"`
	}

	var response []alertResponse
	for _, a := range alerts {
		// Extract coordinates from PostGIS point
		var lat, lng float64
		// Parse "POINT(lng lat)" format
		fmt.Sscanf(a.location, "POINT(%f %f)", &lng, &lat)

		response = append(response, alertResponse{
			ID:          a.id,
			Type:        a.alertType,
			Title:       a.title,
			Description: a.description,
			Severity:    a.severity,
			Latitude:    lat,
			Longitude:   lng,
			Distance:    a.distance,
			CreatedAt:   a.createdAt.Format(time.RFC3339),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Helper functions

func getRiskLevel(score float64) RiskLevel {
	switch {
	case score >= 80:
		return RiskLevelLow
	case score >= 60:
		return RiskLevelMedium
	case score >= 40:
		return RiskLevelHigh
	default:
		return RiskLevelCritical
	}
}

func getAlertFactor(alertType string, distance float64) string {
	distanceStr := "nearby"
	if distance < 50 {
		distanceStr = "very close"
	} else if distance < 100 {
		distanceStr = "within 100m"
	}

	return fmt.Sprintf("%s incident %s", alertType, distanceStr)
}

func getRecommendation(score float64, level RiskLevel) string {
	switch level {
	case RiskLevelLow:
		return "Route is safe for travel"
	case RiskLevelMedium:
		return "Exercise normal caution while traveling"
	case RiskLevelHigh:
		return "Consider alternate route if available"
	case RiskLevelCritical:
		return "Avoid this route if possible - high risk area"
	default:
		return "Unable to assess route safety"
	}
}

// RegisterRiskRoutes registers risk-related routes
func RegisterRiskRoutes(r chi.Router, db *pgxpool.Pool) {
	riskHandler := NewRiskHandler(db)

	// Public routes
	r.Get("/api/v1/risks/location", riskHandler.GetLocationRisk)
	r.Get("/api/v1/alerts/nearby", riskHandler.GetNearbyAlerts)

	// Protected routes
	r.Post("/api/v1/risks/route", riskHandler.CalculateRouteRisk)
	r.Post("/api/v1/users/location", riskHandler.UpdateLocation)
}
