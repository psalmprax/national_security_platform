package handlers

import (
	"encoding/json"
	"net/http"

	"national_security_platform/backend/core-api/internal/db"
	"national_security_platform/backend/core-api/internal/models"

	"github.com/google/uuid"
)

// ExportUserData handles NDPR data portability requests
func (h *Handler) ExportUserData(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	// 1. Get User Profile
	user, err := db.GetUserByID(r.Context(), userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// 2. Get User Alerts
	alerts, err := db.GetUserAlerts(r.Context(), userID)
	if err != nil {
		alerts = []models.Alert{} // Fallback to empty
	}

	// 3. Compile Data Package
	dataPackage := struct {
		Profile *models.User   `json:"profile"`
		Alerts  []models.Alert `json:"alerts"`
		Notice  string         `json:"compliance_notice"`
	}{
		Profile: user,
		Alerts:  alerts,
		Notice:  "This data is exported in accordance with NDPR Right to Data Portability.",
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=user_data_export.json")
	json.NewEncoder(w).Encode(dataPackage)
}

// DeleteUserAccount handles NDPR "Right to be Forgotten" requests
func (h *Handler) DeleteUserAccount(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid User ID", http.StatusBadRequest)
		return
	}

	err = db.DeleteUserData(r.Context(), userID)
	if err != nil {
		h.logger.Printf("Failed to delete user data: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
