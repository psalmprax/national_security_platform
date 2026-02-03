package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"national_security_platform/backend/core-api/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// PublicAlertRequest represents a request to create a public safety alert
type PublicAlertRequest struct {
	Title          string   `json:"title" validate:"required,max=200"`
	Message        string   `json:"message" validate:"required"`
	AlertLevel     string   `json:"alert_level" validate:"required,oneof=info warning critical emergency"`
	AlertType      string   `json:"alert_type"`
	Latitude       float64  `json:"latitude" validate:"required,min=-90,max=90"`
	Longitude      float64  `json:"longitude" validate:"required,min=-180,max=180"`
	RadiusMeters   int      `json:"radius_meters" validate:"min=100,max=50000"` // 100m to 50km
	AffectedLGAs   []string `json:"affected_lgas"`
	RelatedAlertID *string  `json:"related_alert_id"`
	ExpiresInHours int      `json:"expires_in_hours" validate:"min=1,max=72"` // 1-72 hours
}

// PublicAlertResponse represents the created alert
type PublicAlertResponse struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	Message       string    `json:"message"`
	AlertLevel    string    `json:"alert_level"`
	Location      Location  `json:"location"`
	RadiusMeters  int       `json:"radius_meters"`
	AffectedCount int       `json:"affected_count"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	ExpiresAt     time.Time `json:"expires_at"`
}

// CreatePublicAlert creates a new public safety alert and broadcasts to affected users
func (h *Handler) CreatePublicAlert(w http.ResponseWriter, r *http.Request) {
	var req PublicAlertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get user from context (set by auth middleware)
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	userRole, _ := r.Context().Value(middleware.UserRoleKey).(string)

	// Authorization: Only specific roles can create public alerts
	allowedRoles := map[string]bool{
		"ADMIN":             true,
		"TACTICAL_COMMAND":  true,
		"STRATEGIC_PLANNER": true,
	}

	if !allowedRoles[userRole] {
		http.Error(w, "Insufficient permissions to create public alerts", http.StatusForbidden)
		return
	}

	// Default radius if not provided
	if req.RadiusMeters == 0 {
		req.RadiusMeters = 5000 // 5km default
	}

	// Default expiry if not provided
	if req.ExpiresInHours == 0 {
		req.ExpiresInHours = 24 // 24 hours default
	}

	// Create alert in database
	alertID := uuid.New().String()
	expiresAt := time.Now().Add(time.Duration(req.ExpiresInHours) * time.Hour)

	query := `
		INSERT INTO public_alerts (
			id, title, message, alert_level, alert_type,
			location, radius_meters, affected_lga_codes,
			created_by, related_alert_id, expires_at
		) VALUES (
			$1, $2, $3, $4, $5,
			ST_SetSRID(ST_MakePoint($6, $7), 4326),
			$8, $9, $10, $11, $12
		)
		RETURNING id, created_at
	`

	var createdAt time.Time
	var relatedAlertID *uuid.UUID
	if req.RelatedAlertID != nil {
		id, _ := uuid.Parse(*req.RelatedAlertID)
		relatedAlertID = &id
	}

	err := h.db.QueryRow(context.Background(), query,
		alertID, req.Title, req.Message, req.AlertLevel, req.AlertType,
		req.Longitude, req.Latitude,
		req.RadiusMeters, req.AffectedLGAs,
		userID, relatedAlertID, expiresAt,
	).Scan(&alertID, &createdAt)

	if err != nil {
		h.logger.Printf("Error creating public alert: %v", err)
		http.Error(w, "Failed to create alert", http.StatusInternalServerError)
		return
	}

	// Find affected users and send notifications
	affectedCount, err := h.broadcastAlertToUsers(alertID, req)
	if err != nil {
		h.logger.Printf("Error broadcasting alert: %v", err)
		// Don't fail the request - alert is created, just notification failed
	}

	// Update affected count
	h.db.Exec(context.Background(),
		"UPDATE public_alerts SET affected_count = $1, delivery_status = 'sent' WHERE id = $2",
		affectedCount, alertID)

	// Publish to NATS for real-time updates
	h.publishEvent("public_alert.created", map[string]interface{}{
		"alert_id":       alertID,
		"alert_level":    req.AlertLevel,
		"affected_count": affectedCount,
	})

	// Return response
	response := PublicAlertResponse{
		ID:            alertID,
		Title:         req.Title,
		Message:       req.Message,
		AlertLevel:    req.AlertLevel,
		Location:      Location{Latitude: req.Latitude, Longitude: req.Longitude},
		RadiusMeters:  req.RadiusMeters,
		AffectedCount: affectedCount,
		CreatedAt:     createdAt,
		UpdatedAt:     createdAt, // Initial updated_at is same as created_at
		ExpiresAt:     expiresAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// broadcastAlertToUsers finds users in affected area and sends push notifications
func (h *Handler) broadcastAlertToUsers(alertID string, req PublicAlertRequest) (int, error) {
	// Find users within radius
	query := `
		SELECT u.id, u.phone_number, d.fcm_token
		FROM users u
		JOIN devices d ON d.user_id = u.id
		WHERE d.fcm_token IS NOT NULL
		AND ST_DWithin(
			u.last_known_location,
			ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
			$3
		)
	`

	rows, err := h.db.Query(context.Background(), query,
		req.Longitude, req.Latitude, req.RadiusMeters)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var userID, phoneNumber, fcmToken string
		if err := rows.Scan(&userID, &phoneNumber, &fcmToken); err != nil {
			continue
		}

		// Send push notification
		err := h.sendPushNotification(fcmToken, req.Title, req.Message, req.AlertLevel, alertID)
		if err != nil {
			h.logger.Printf("Failed to send notification to user %s: %v", userID, err)
			continue
		}

		count++
	}

	return count, nil
}

// sendPushNotification sends a Firebase Cloud Messaging notification
func (h *Handler) sendPushNotification(fcmToken, title, message, alertLevel, alertID string) error {
	// TODO: Implement FCM integration
	// For now, just log
	h.logger.Printf("Would send notification: %s to token: %s", title, fcmToken[:10]+"...")

	// Priority and sound based on alert level
	// Actual FCM implementation would go here
	// notification := messaging.Message{
	//     Token: fcmToken,
	//     Notification: &messaging.Notification{
	//         Title: title,
	//         Body:  message,
	//     },
	//     Android: &messaging.AndroidConfig{
	//         Priority: priority,
	//     },
	//     Data: map[string]string{
	//         "alert_id": alertID,
	//         "type":     "public_alert",
	//     },
	// }
	// _, err := h.fcmClient.Send(context.Background(), &notification)

	return nil
}

// GetPublicAlerts retrieves public alerts with pagination
func (h *Handler) GetPublicAlerts(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	limit := 50
	offset := 0
	alertLevel := r.URL.Query().Get("alert_level")

	query := `
		SELECT id, title, message, alert_level, alert_type,
		       ST_X(location::geometry) as longitude,
		       ST_Y(location::geometry) as latitude,
		       radius_meters, affected_count, created_at, updated_at, expires_at
		FROM public_alerts
		WHERE expires_at > NOW()
	`

	args := []interface{}{}
	argCount := 1

	if alertLevel != "" {
		query += ` AND alert_level = $` + string(rune(argCount))
		args = append(args, alertLevel)
		argCount++
	}

	query += ` ORDER BY created_at DESC LIMIT $` + string(rune(argCount)) + ` OFFSET $` + string(rune(argCount+1))
	args = append(args, limit, offset)

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		http.Error(w, "Failed to fetch alerts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	alerts := []PublicAlertResponse{}
	for rows.Next() {
		var alert PublicAlertResponse
		var alertType sql.NullString

		err := rows.Scan(
			&alert.ID, &alert.Title, &alert.Message, &alert.AlertLevel, &alertType,
			&alert.Location.Longitude, &alert.Location.Latitude,
			&alert.RadiusMeters, &alert.AffectedCount, &alert.CreatedAt, &alert.UpdatedAt, &alert.ExpiresAt,
		)

		if err != nil {
			continue
		}

		alerts = append(alerts, alert)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"alerts": alerts,
		"total":  len(alerts),
	})
}

// RegisterPublicAlertRoutes registers all public alert endpoints
func RegisterPublicAlertRoutes(r chi.Router, h *Handler) {
	r.Post("/api/v1/public-alerts", h.CreatePublicAlert)
	r.Get("/api/v1/public-alerts", h.GetPublicAlerts)
}
