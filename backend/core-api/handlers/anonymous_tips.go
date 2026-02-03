package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"national_security_platform/backend/core-api/internal/middleware"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// AnonymousTipRequest represents an anonymous tip submission (NO AUTH REQUIRED)
type AnonymousTipRequest struct {
	TipContent          string   `json:"tip_content" validate:"required,min=10,max=2000"`
	ThreatType          string   `json:"threat_type" validate:"omitempty,oneof=kidnapping terrorism robbery suspicious_activity drug_trafficking corruption other"`
	Latitude            *float64 `json:"latitude" validate:"omitempty,min=-90,max=90"`
	Longitude           *float64 `json:"longitude" validate:"omitempty,min=-180,max=180"`
	LocationDescription string   `json:"location_description" validate:"omitempty,max=500"`
	MediaURLs           []string `json:"media_urls"` // Pre-uploaded to MinIO
}

// AnonymousTip represents a tip in the database
type AnonymousTip struct {
	ID                  string    `json:"id"`
	TipContent          string    `json:"tip_content"`
	ThreatType          string    `json:"threat_type"`
	LocationDescription string    `json:"location_description"`
	MediaURLs           []string  `json:"media_urls"`
	VerificationStatus  string    `json:"verification_status"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// SubmitAnonymousTip handles anonymous tip submissions (NO AUTH REQUIRED)
func (h *Handler) SubmitAnonymousTip(w http.ResponseWriter, r *http.Request) {
	var req AnonymousTipRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get client IP for rate limiting
	clientIP := getClientIP(r)

	// Rate limiting: Max 5 tips per hour from same IP
	if !h.checkTipRateLimit(clientIP) {
		http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
		return
	}

	// Create tip in database
	tipID := uuid.New().String()
	userAgent := r.UserAgent()

	query := `
		INSERT INTO anonymous_tips (
			id, tip_content, threat_type, location, location_description,
			media_urls, submitted_from_ip, user_agent
		) VALUES (
			$1, $2, $3, 
			CASE WHEN $4 IS NOT NULL AND $5 IS NOT NULL 
				THEN ST_SetSRID(ST_MakePoint($5, $4), 4326) 
				ELSE NULL 
			END,
			$6, $7, $8, $9
		)
		RETURNING id, created_at
	`

	var createdAt time.Time
	err := h.db.QueryRow(context.Background(), query,
		tipID, req.TipContent, req.ThreatType,
		req.Latitude, req.Longitude, req.LocationDescription,
		req.MediaURLs, clientIP, userAgent,
	).Scan(&tipID, &createdAt)

	if err != nil {
		h.logger.Printf("Error creating anonymous tip: %v", err)
		http.Error(w, "Failed to submit tip", http.StatusInternalServerError)
		return
	}

	// Notify analysts of new tip for review
	h.publishEvent("anonymous_tip.submitted", map[string]interface{}{
		"tip_id":      tipID,
		"threat_type": req.ThreatType,
	})

	// Return response
	response := map[string]interface{}{
		"tip_id":     tipID,
		"message":    "Thank you. Your tip has been submitted anonymously and will be reviewed by our analysts.",
		"created_at": createdAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// checkTipRateLimit checks if IP hasn't exceeded rate limit (5 tips/hour)
func (h *Handler) checkTipRateLimit(ip string) bool {
	query := `
		SELECT COUNT(*) 
		FROM anonymous_tips 
		WHERE submitted_from_ip = $1 
		AND created_at > NOW() - INTERVAL '1 hour'
	`

	var count int
	err := h.db.QueryRow(context.Background(), query, ip).Scan(&count)
	if err != nil {
		h.logger.Printf("Error checking rate limit: %v", err)
		return true // Allow on error
	}

	return count < 5
}

// GetAnonymousTips retrieves tips for analyst review (AUTH REQUIRED)
func (h *Handler) GetAnonymousTips(w http.ResponseWriter, r *http.Request) {
	// Authorization: Only analysts can review tips
	userRole, _ := r.Context().Value(middleware.UserRoleKey).(string)
	allowedRoles := map[string]bool{
		"ADMIN":            true,
		"CYBER_ANALYST":    true,
		"TACTICAL_COMMAND": true,
	}

	if !allowedRoles[userRole] {
		http.Error(w, "Insufficient permissions", http.StatusForbidden)
		return
	}

	// Parse query parameters
	status := r.URL.Query().Get("status")
	if status == "" {
		status = "pending" // Default to pending tips
	}

	query := `
		SELECT 
			id, tip_content, threat_type, location_description,
			media_urls, verification_status, created_at, updated_at
		FROM anonymous_tips
		WHERE verification_status = $1
		ORDER BY created_at DESC
		LIMIT 50
	`

	rows, err := h.db.Query(context.Background(), query, status)
	if err != nil {
		http.Error(w, "Failed to fetch tips", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tips := []AnonymousTip{}
	for rows.Next() {
		var tip AnonymousTip
		var threatType, locationDesc sql.NullString
		var mediaURLs []string

		err := rows.Scan(
			&tip.ID, &tip.TipContent, &threatType, &locationDesc,
			&mediaURLs, &tip.VerificationStatus, &tip.CreatedAt, &tip.UpdatedAt,
		)
		if err != nil {
			continue
		}

		if threatType.Valid {
			tip.ThreatType = threatType.String
		}
		if locationDesc.Valid {
			tip.LocationDescription = locationDesc.String
		}
		tip.MediaURLs = mediaURLs

		tips = append(tips, tip)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tips":  tips,
		"total": len(tips),
	})
}

// VerifyTip marks a tip as verified (and optionally converts to full alert)
func (h *Handler) VerifyTip(w http.ResponseWriter, r *http.Request) {
	tipID := chi.URLParam(r, "id")

	var req struct {
		Action          string `json:"action" validate:"required,oneof=verify reject"`
		RejectionReason string `json:"rejection_reason"`
		ConvertToAlert  bool   `json:"convert_to_alert"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	userID, _ := r.Context().Value(middleware.UserIDKey).(string)

	if req.Action == "verify" {
		query := `
			UPDATE anonymous_tips
			SET verification_status = 'verified',
			    verified_by = $1,
			    verified_at = NOW(),
			    updated_at = NOW()
			WHERE id = $2
		`
		_, err := h.db.Exec(context.Background(), query, userID, tipID)
		if err != nil {
			http.Error(w, "Failed to verify tip", http.StatusInternalServerError)
			return
		}

		// TODO: If convert_to_alert is true, create a full alert from this tip

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Tip verified successfully"})
	} else {
		query := `
			UPDATE anonymous_tips
			SET verification_status = 'rejected',
				verified_by = $1,
				verified_at = NOW(),
				rejection_reason = $2,
				updated_at = NOW()
			WHERE id = $3
		`
		_, err := h.db.Exec(context.Background(), query, userID, req.RejectionReason, tipID)
		if err != nil {
			http.Error(w, "Failed to reject tip", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"message": "Tip rejected"})
	}
}

// getClientIP extracts the real client IP from request
func getClientIP(r *http.Request) string {
	// Check X-Forwarded-For header first (behind proxy/load balancer)
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		ips := strings.Split(forwarded, ",")
		return strings.TrimSpace(ips[0])
	}

	// Check X-Real-IP header
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	return strings.Split(r.RemoteAddr, ":")[0]
}

// RegisterAnonymousTipRoutes registers tip endpoints
func RegisterAnonymousTipRoutes(r chi.Router, h *Handler) {
	// Public endpoint (no auth required)
	r.Post("/api/v1/tips/submit", h.SubmitAnonymousTip)

	// Protected endpoints (auth required)
	r.Get("/api/v1/tips", h.GetAnonymousTips)
	r.Post("/api/v1/tips/{id}/verify", h.VerifyTip)
}
