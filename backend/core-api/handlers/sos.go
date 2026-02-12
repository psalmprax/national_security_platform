package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"national_security_platform/backend/core-api/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// SOSRequest represents a request to trigger an emergency SOS
type SOSRequest struct {
	Latitude  float64 `json:"latitude" validate:"required,min=-90,max=90"`
	Longitude float64 `json:"longitude" validate:"required,min=-180,max=180"`
}

// SOSResponse represents the created SOS alert
type SOSResponse struct {
	ID            string    `json:"id"`
	Status        string    `json:"status"`
	Message       string    `json:"message"`
	CreatedAt     time.Time `json:"created_at"`
	TrackingID    string    `json:"tracking_id"`
	AffectedCount int       `json:"affected_count"`
}

// CreateSOSAlert triggers a CRITICAL priority alert and broadcasts to nearby users
func (h *Handler) CreateSOSAlert(w http.ResponseWriter, r *http.Request) {
	var req SOSRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get user from context
	userIDStr, _ := r.Context().Value(middleware.UserIDKey).(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user identity", http.StatusUnauthorized)
		return
	}

	// Create SOS alert in database
	alertID := uuid.New().String()
	// SOS alerts are always CRITICAL and type 'SOS'
	// They have a default broadcast radius of 5km (5000m)
	broadcastRadius := 5000

	query := `
		INSERT INTO alerts (
			id, user_id, status, priority_class,
			location, impact_radius_meters, broadcast_radius_meters,
			alert_type, content_text, severity_score, verification_count,
			created_at
		) VALUES (
			$1, $2, 'ACTIVE', 'CRITICAL',
			ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6,
			'SOS', 'EMERGENCY SOS SIGNAL DETECTED', 1.0, 1,
			NOW()
		)
		RETURNING created_at
	`

	var createdAt time.Time
	err = h.db.QueryRow(context.Background(), query,
		alertID, userID, req.Longitude, req.Latitude,
		100, // Impact radius (immediate vicinity)
		broadcastRadius,
	).Scan(&createdAt)

	if err != nil {
		h.logger.Printf("Error creating SOS alert: %v", err)
		http.Error(w, "Failed to trigger SOS", http.StatusInternalServerError)
		return
	}

	// Find affected users and send notifications
	// TODO: Refactor this to a shared service with public_alerts.go
	affectedCount, err := h.broadcastSOSToNearbyUsers(alertID, req.Latitude, req.Longitude, broadcastRadius)
	if err != nil {
		h.logger.Printf("Error broadcasting SOS: %v", err)
		// Don't fail the request
	}

	// Notify Emergency Contacts
	// TODO: Implement SMS notification to user's contacts
	h.notifyEmergencyContacts(userID, req.Latitude, req.Longitude)

	// Publish to NATS for real-time dashboard updates
	h.publishEvent("alert.created", map[string]interface{}{
		"alert_id":       alertID,
		"alert_type":     "SOS",
		"priority":       "CRITICAL",
		"latitude":       req.Latitude,
		"longitude":      req.Longitude,
		"affected_count": affectedCount,
	})

	// Return response
	response := SOSResponse{
		ID:            alertID,
		Status:        "ACTIVE",
		Message:       "SOS Signal Broadcasted",
		CreatedAt:     createdAt,
		TrackingID:    alertID,
		AffectedCount: affectedCount,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// broadcastSOSToNearbyUsers finds users in affected area and sends push notifications
func (h *Handler) broadcastSOSToNearbyUsers(alertID string, lat, long float64, radiusMeters int) (int, error) {
	query := `
		SELECT u.id, d.fcm_token
		FROM users u
		JOIN devices d ON d.user_id = u.id
		WHERE d.fcm_token IS NOT NULL
		AND ST_DWithin(
			u.last_known_location,
			ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
			$3
		)
	`
	// Note: We switch order of lat/long for ST_MakePoint(long, lat)
	rows, err := h.db.Query(context.Background(), query, long, lat, radiusMeters)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var userID, fcmToken string
		if err := rows.Scan(&userID, &fcmToken); err != nil {
			continue
		}

		// Mock Send - in real implementation this goes to FCM
		h.logger.Printf("[SOS BROADCAST] Sending HIGH PRIORITY alert to user %s (Token: %s)", userID, fcmToken[:10]+"...")
		count++
	}

	return count, nil
}

// notifyEmergencyContacts sends SMS to user's registered contacts
func (h *Handler) notifyEmergencyContacts(userID uuid.UUID, lat, long float64) {
	query := `
		SELECT contact_name, contact_phone 
		FROM emergency_contacts 
		WHERE user_id = $1
	`
	rows, err := h.db.Query(context.Background(), query, userID)
	if err != nil {
		h.logger.Printf("Failed to fetch emergency contacts for notification: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var name, phone string
		if err := rows.Scan(&name, &phone); err != nil {
			continue
		}
		// Mock SMS
		h.logger.Printf("[SOS SMS] Sending to %s (%s): User triggered SOS at %f, %f", name, phone, lat, long)
	}
}

// RegisterSOSRoutes registers the SOS endpoint
func RegisterSOSRoutes(r chi.Router, h *Handler) {
	r.Post("/api/v1/sos", h.CreateSOSAlert)
}
