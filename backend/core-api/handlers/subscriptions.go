package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"national_security_platform/backend/core-api/internal/db"

	"github.com/google/uuid"
)

type SubscriptionStatusResponse struct {
	UserID        uuid.UUID  `json:"user_id"`
	Tier          string     `json:"tier"`
	Status        string     `json:"status"`
	Expiration    *time.Time `json:"expiration,omitempty"`
	IsActive      bool       `json:"is_active"`
	TransactionID *string    `json:"transaction_id,omitempty"`
}

type SubscriptionUpgradeRequest struct {
	UserID   string `json:"user_id"`
	Tier     string `json:"tier"`
	Platform string `json:"platform"`
}

// GetSubscriptionStatusHandler retrieves the subscription status for a user
func GetSubscriptionStatusHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "invalid user_id", http.StatusBadRequest)
		return
	}

	// For MVP/Demo: Fetch from DB, or default to community if not found
	// In a real scenario, we'd have a db.GetSubscriptionByUserID function
	var resp SubscriptionStatusResponse
	resp.UserID = userID
	resp.Tier = "community"
	resp.Status = "active"
	resp.IsActive = true

	query := `SELECT tier, status, expires_at, transaction_id FROM subscriptions WHERE user_id = $1`
	err = db.Pool.QueryRow(r.Context(), query, userID).Scan(
		&resp.Tier, &resp.Status, &resp.Expiration, &resp.TransactionID,
	)

	if err != nil {
		// If not found, we just return the default community tier
		// This handles users who haven't been seeded yet
	}

	// Check if actually active (based on expiration if present)
	if resp.Expiration != nil && resp.Expiration.Before(time.Now()) {
		resp.IsActive = false
		resp.Status = "expired"
	}

	respondJSON(w, http.StatusOK, resp)
}

// UpgradeSubscriptionHandler processes a subscription upgrade (simulated)
func UpgradeSubscriptionHandler(w http.ResponseWriter, r *http.Request) {
	var req SubscriptionUpgradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		http.Error(w, "invalid user_id", http.StatusBadRequest)
		return
	}

	// Simulated Upgrade Logic
	// In production, this would verify a receipt with Apple/Google first
	expiration := time.Now().AddDate(0, 1, 0) // 1 month from now
	transactionID := uuid.New().String()

	query := `
		INSERT INTO subscriptions (user_id, tier, status, platform, expires_at, transaction_id, updated_at)
		VALUES ($1, $2, 'active', $3, $4, $5, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			tier = EXCLUDED.tier,
			status = 'active',
			platform = EXCLUDED.platform,
			expires_at = EXCLUDED.expires_at,
			transaction_id = EXCLUDED.transaction_id,
			updated_at = NOW()
	`

	_, err = db.Pool.Exec(r.Context(), query, userID, req.Tier, req.Platform, expiration, transactionID)
	if err != nil {
		http.Error(w, "failed to update subscription", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":        true,
		"tier":           req.Tier,
		"expiration":     expiration,
		"transaction_id": transactionID,
	})
}
