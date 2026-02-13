package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"national_security_platform/backend/core-api/internal/db"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// GetRelatedAlerts fetches alerts spatially and temporally close to a target alert
func (h *Handler) GetRelatedAlerts(w http.ResponseWriter, r *http.Request) {
	alertIDStr := chi.URLParam(r, "alertID")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		http.Error(w, "Invalid alert ID", http.StatusBadRequest)
		return
	}

	// Optional query parameters for radius and time window
	radius := 5000 // default 5km
	if r.URL.Query().Get("radius") != "" {
		if r, err := strconv.Atoi(r.URL.Query().Get("radius")); err == nil {
			radius = r
		}
	}

	window := 24 // default 24h
	if r.URL.Query().Get("window") != "" {
		if w, err := strconv.Atoi(r.URL.Query().Get("window")); err == nil {
			window = w
		}
	}

	alerts, err := db.GetRelatedAlerts(r.Context(), alertID, radius, window)
	if err != nil {
		h.logger.Printf("Failed to fetch related alerts for %s: %v", alertID, err)
		http.Error(w, "Failed to fetch correlation data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"alerts": alerts,
		"count":  len(alerts),
	})
}
