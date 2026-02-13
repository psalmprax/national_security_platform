package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"national_security_platform/backend/core-api/internal/db"
	"national_security_platform/backend/core-api/internal/middleware"
	"national_security_platform/backend/core-api/internal/models"

	"github.com/google/uuid"
)

// ReportMissingPerson handles requests to report a missing person
func (h *Handler) ReportMissingPerson(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FullName      string `json:"full_name"`
		Age           int    `json:"age"`
		Gender        string `json:"gender"`
		LastSeenStr   string `json:"last_seen"`
		Description   string `json:"description"`
		ContactNumber string `json:"contact_number"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userIDStr, _ := r.Context().Value(middleware.UserIDKey).(string)
	userID, _ := uuid.Parse(userIDStr)
	lastSeen, _ := time.Parse(time.RFC3339, req.LastSeenStr)

	person := &models.MissingPerson{
		ID:            uuid.New(),
		FullName:      req.FullName,
		Age:           req.Age,
		Gender:        req.Gender,
		LastSeen:      lastSeen,
		Status:        "MISSING",
		Description:   req.Description,
		ReportedByID:  userID,
		ContactNumber: req.ContactNumber,
	}

	if err := db.ReportMissingPerson(r.Context(), person); err != nil {
		h.logger.Printf("Failed to report missing person: %v", err)
		http.Error(w, "Failed to submit report", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(person)
}

// GetMissingPersons handles requests to list missing persons
func (h *Handler) GetMissingPersons(w http.ResponseWriter, r *http.Request) {
	limit := 50
	offset := 0

	if l, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil {
		limit = l
	}
	if o, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil {
		offset = o
	}

	persons, err := db.GetMissingPersons(r.Context(), limit, offset)
	if err != nil {
		h.logger.Printf("Failed to fetch missing persons: %v", err)
		http.Error(w, "Failed to fetch registry", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"persons": persons,
		"count":   len(persons),
	})
}
