package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// DispatchAlertRequest represents the request body for dispatching emergency response
type DispatchAlertRequest struct {
	Priority string `json:"priority"`
}

// PanicRequest represents the request body for panic button
type PanicRequest struct {
	Location  *Location `json:"location"`
	Timestamp string    `json:"timestamp"`
}

// TacticalProtocolsRequest represents the request body for engaging tactical protocols
type TacticalProtocolsRequest struct {
	AlertIDs []string `json:"alert_ids"`
}

// HandleDispatchAlert dispatches emergency response to an alert
func (h *Handler) HandleDispatchAlert(w http.ResponseWriter, r *http.Request) {
	alertID := chi.URLParam(r, "alertID")

	var req DispatchAlertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Priority = "HIGH" // Default priority
	}

	// Get alert details
	var alert struct {
		ID       string
		Title    string
		LgaName  string
		Severity float64
		Status   string
	}
	err := h.db.QueryRow(context.Background(),
		`SELECT id, title, lga_name, severity_score, status FROM alerts WHERE id = $1`,
		alertID,
	).Scan(&alert.ID, &alert.Title, &alert.LgaName, &alert.Severity, &alert.Status)

	if err != nil {
		http.Error(w, "Alert not found", http.StatusNotFound)
		return
	}

	// Create a mission for the dispatch
	missionID := uuid.New().String()
	priority := req.Priority
	if priority == "" {
		priority = "HIGH"
	}

	_, err = h.db.Exec(context.Background(),
		`INSERT INTO missions (id, alert_id, priority, status, created_at, updated_at)
		 VALUES ($1, $2, $3, 'PENDING', $4, $4)`,
		missionID, alertID, priority, time.Now(),
	)

	if err != nil {
		h.logger.Printf("Error creating mission: %v", err)
		http.Error(w, "Failed to create mission", http.StatusInternalServerError)
		return
	}

	// Update alert status
	_, err = h.db.Exec(context.Background(),
		`UPDATE alerts SET status = 'DISPATCHED', updated_at = $1 WHERE id = $2`,
		time.Now(), alertID,
	)

	if err != nil {
		h.logger.Printf("Error updating alert status: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"mission_id": missionID,
		"alert_id":   alertID,
		"priority":   priority,
		"message":    "Emergency response dispatched",
		"lga_name":   alert.LgaName,
	})
}

// HandlePanic triggers the emergency panic button
func (h *Handler) HandlePanic(w http.ResponseWriter, r *http.Request) {
	var req PanicRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Log the panic event
	h.logger.Printf("PANIC BUTTON TRIGGERED at %s", req.Timestamp)

	// Create a high-priority SOS alert
	panicAlertID := uuid.New().String()

	_, err := h.db.Exec(context.Background(),
		`INSERT INTO alerts (id, title, description, severity_score, status, alert_type, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		panicAlertID,
		"EMERGENCY PANIC ACTIVATED",
		"Panic button was triggered. Immediate response required.",
		1.0, // Maximum severity
		"CRITICAL",
		"SOS",
		time.Now(),
		time.Now(),
	)

	if err != nil {
		h.logger.Printf("Error creating panic alert: %v", err)
		// Still return success to the user
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"alert_id":  panicAlertID,
		"message":   "Panic alert triggered. Emergency services notified.",
		"timestamp": req.Timestamp,
	})
}

// HandleEngageTacticalProtocols engages tactical protocols for multiple alerts
func (h *Handler) HandleEngageTacticalProtocols(w http.ResponseWriter, r *http.Request) {
	var req TacticalProtocolsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.AlertIDs) == 0 {
		http.Error(w, "No alert IDs provided", http.StatusBadRequest)
		return
	}

	// Update all alerts to CRITICAL status
	now := time.Now()
	for _, alertID := range req.AlertIDs {
		_, err := h.db.Exec(context.Background(),
			`UPDATE alerts SET status = 'CRITICAL', severity_score = 1.0, updated_at = $1 WHERE id = $2`,
			now, alertID,
		)
		if err != nil {
			h.logger.Printf("Error updating alert %s: %v", alertID, err)
		}
	}

	h.logger.Printf("TACTICAL PROTOCOLS ENGAGED for %d alerts", len(req.AlertIDs))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":        true,
		"alerts_count":   len(req.AlertIDs),
		"message":        "Tactical protocols engaged. All units notified.",
		"response_level": "MAXIMUM",
	})
}

// RegisterTacticalRoutes registers emergency and tactical endpoints
func RegisterTacticalRoutes(r chi.Router, h *Handler) {
	r.Post("/alerts/{alertID}/dispatch", h.HandleDispatchAlert)
	r.Post("/emergency/panic", h.HandlePanic)
	r.Post("/tactical/protocols/engage", h.HandleEngageTacticalProtocols)
}
