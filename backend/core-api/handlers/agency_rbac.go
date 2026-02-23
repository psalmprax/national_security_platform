package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// respondJSON is a helper to write JSON responses
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

// Agency represents a security agency
type Agency struct {
	ID                string   `json:"id"`
	Name              string   `json:"name"`
	Acronym           string   `json:"acronym"`
	Type              string   `json:"type"` // POLICE, FIRE, MEDICAL, etc.
	JurisdictionScope string   `json:"jurisdiction_scope"`
	AlertTypes        []string `json:"alert_types"` // Types of alerts this agency handles
}

// UserAgencyAssignment links users to agencies
type UserAgencyAssignment struct {
	UserID   string `json:"user_id"`
	AgencyID string `json:"agency_id"`
	Role     string `json:"role"` // OFFICER, COMMANDER, ANALYST, DISPATCHER
}

// AgencyRBACHandler handles agency-specific RBAC
type AgencyRBACHandler struct {
	db *pgxpool.Pool
}

// NewAgencyRBACHandler creates a new agency RBAC handler
func NewAgencyRBACHandler(db *pgxpool.Pool) *AgencyRBACHandler {
	return &AgencyRBACHandler{db: db}
}

// RegisterAgencyRoutes registers agency-specific routes
func RegisterAgencyRoutes(r chi.Router, db *pgxpool.Pool) {
	handler := NewAgencyRBACHandler(db)

	// Agency management (admin only)
	r.Route("/api/v1/agencies", func(r chi.Router) {
		r.Get("/", handler.ListAgencies)
		r.Post("/", handler.CreateAgency)
		r.Get("/{agencyID}", handler.GetAgency)
		r.Put("/{agencyID}", handler.UpdateAgency)
		r.Delete("/{agencyID}", handler.DeleteAgency)

		// Agency members
		r.Get("/{agencyID}/members", handler.ListAgencyMembers)
		r.Post("/{agencyID}/members", handler.AddAgencyMember)
		r.Delete("/{agencyID}/members/{userID}", handler.RemoveAgencyMember)

		// Agency-specific alerts
		r.Get("/{agencyID}/alerts", handler.GetAgencyAlerts)

		// Agency-specific assets
		r.Get("/{agencyID}/assets", handler.GetAgencyAssets)
	})
}

// ListAgencies returns all agencies
func (h *AgencyRBACHandler) ListAgencies(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT id, name, acronym, type, jurisdiction_scope
		FROM agencies
		ORDER BY name
	`

	rows, err := h.db.Query(context.Background(), query)
	if err != nil {
		http.Error(w, "Failed to fetch agencies", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var agencies []Agency
	for rows.Next() {
		var a Agency
		err := rows.Scan(&a.ID, &a.Name, &a.Acronym, &a.Type, &a.JurisdictionScope)
		if err != nil {
			continue
		}
		agencies = append(agencies, a)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(agencies)
}

// CreateAgency creates a new agency
func (h *AgencyRBACHandler) CreateAgency(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name              string   `json:"name"`
		Acronym           string   `json:"acronym"`
		Type              string   `json:"type"`
		JurisdictionScope string   `json:"jurisdiction_scope"`
		AlertTypes        []string `json:"alert_types"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Insert agency
	var agencyID string
	query := `
		INSERT INTO agencies (name, acronym, type, jurisdiction_scope, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id
	`

	err := h.db.QueryRow(context.Background(), query,
		req.Name, req.Acronym, req.Type, req.JurisdictionScope,
	).Scan(&agencyID)

	if err != nil {
		http.Error(w, "Failed to create agency", http.StatusInternalServerError)
		return
	}

	// Insert alert type mappings
	if len(req.AlertTypes) > 0 {
		for _, alertType := range req.AlertTypes {
			h.db.Exec(context.Background(),
				`INSERT INTO agency_alert_types (agency_id, alert_type) VALUES ($1, $2)`,
				agencyID, alertType)
		}
	}

	respondJSON(w, http.StatusCreated, Agency{
		ID:                agencyID,
		Name:              req.Name,
		Acronym:           req.Acronym,
		Type:              req.Type,
		JurisdictionScope: req.JurisdictionScope,
		AlertTypes:        req.AlertTypes,
	})
}

// GetAgency returns a specific agency
func (h *AgencyRBACHandler) GetAgency(w http.ResponseWriter, r *http.Request) {
	agencyID := chi.URLParam(r, "agencyID")

	var agency Agency
	query := `
		SELECT id, name, acronym, type, jurisdiction_scope
		FROM agencies WHERE id = $1
	`

	err := h.db.QueryRow(context.Background(), query, agencyID).Scan(
		&agency.ID, &agency.Name, &agency.Acronym, &agency.Type, &agency.JurisdictionScope,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Agency not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Failed to fetch agency", http.StatusInternalServerError)
		return
	}

	// Get alert types
	typeRows, _ := h.db.Query(context.Background(),
		`SELECT alert_type FROM agency_alert_types WHERE agency_id = $1`, agencyID)
	defer typeRows.Close()

	for typeRows.Next() {
		var at string
		typeRows.Scan(&at)
		agency.AlertTypes = append(agency.AlertTypes, at)
	}

	respondJSON(w, http.StatusOK, agency)
}

// UpdateAgency updates an agency
func (h *AgencyRBACHandler) UpdateAgency(w http.ResponseWriter, r *http.Request) {
	agencyID := chi.URLParam(r, "agencyID")

	var req struct {
		Name              string   `json:"name"`
		Acronym           string   `json:"acronym"`
		Type              string   `json:"type"`
		JurisdictionScope string   `json:"jurisdiction_scope"`
		AlertTypes        []string `json:"alert_types"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update agency
	_, err := h.db.Exec(context.Background(), `
		UPDATE agencies 
		SET name = $1, acronym = $2, type = $3, jurisdiction_scope = $4, updated_at = NOW()
		WHERE id = $5
	`, req.Name, req.Acronym, req.Type, req.JurisdictionScope, agencyID)

	if err != nil {
		http.Error(w, "Failed to update agency", http.StatusInternalServerError)
		return
	}

	// Update alert types
	h.db.Exec(context.Background(), `DELETE FROM agency_alert_types WHERE agency_id = $1`, agencyID)
	for _, alertType := range req.AlertTypes {
		h.db.Exec(context.Background(),
			`INSERT INTO agency_alert_types (agency_id, alert_type) VALUES ($1, $2)`,
			agencyID, alertType)
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// DeleteAgency deletes an agency
func (h *AgencyRBACHandler) DeleteAgency(w http.ResponseWriter, r *http.Request) {
	agencyID := chi.URLParam(r, "agencyID")

	_, err := h.db.Exec(context.Background(), `DELETE FROM agencies WHERE id = $1`, agencyID)
	if err != nil {
		http.Error(w, "Failed to delete agency", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ListAgencyMembers returns members of an agency
func (h *AgencyRBACHandler) ListAgencyMembers(w http.ResponseWriter, r *http.Request) {
	agencyID := chi.URLParam(r, "agencyID")

	query := `
		SELECT u.id, u.email, u.first_name, u.last_name, ua.role
		FROM user_agency_assignments ua
		JOIN users u ON ua.user_id = u.id
		WHERE ua.agency_id = $1
		ORDER BY u.last_name
	`

	rows, err := h.db.Query(context.Background(), query, agencyID)
	if err != nil {
		http.Error(w, "Failed to fetch members", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Member struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Role      string `json:"role"`
	}

	var members []Member
	for rows.Next() {
		var m Member
		rows.Scan(&m.ID, &m.Email, &m.FirstName, &m.LastName, &m.Role)
		members = append(members, m)
	}

	respondJSON(w, http.StatusOK, members)
}

// AddAgencyMember adds a user to an agency
func (h *AgencyRBACHandler) AddAgencyMember(w http.ResponseWriter, r *http.Request) {
	agencyID := chi.URLParam(r, "agencyID")

	var req struct {
		UserID string `json:"user_id"`
		Role   string `json:"role"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(context.Background(), `
		INSERT INTO user_agency_assignments (user_id, agency_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, agency_id) DO UPDATE SET role = $3
	`, req.UserID, agencyID, req.Role)

	if err != nil {
		http.Error(w, "Failed to add member", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{"status": "added"})
}

// RemoveAgencyMember removes a user from an agency
func (h *AgencyRBACHandler) RemoveAgencyMember(w http.ResponseWriter, r *http.Request) {
	agencyID := chi.URLParam(r, "agencyID")
	userID := chi.URLParam(r, "userID")

	_, err := h.db.Exec(context.Background(),
		`DELETE FROM user_agency_assignments WHERE user_id = $1 AND agency_id = $2`,
		userID, agencyID)

	if err != nil {
		http.Error(w, "Failed to remove member", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "removed"})
}

// GetAgencyAlerts returns alerts assigned to an agency
func (h *AgencyRBACHandler) GetAgencyAlerts(w http.ResponseWriter, r *http.Request) {
	agencyID := chi.URLParam(r, "agencyID")

	// Get alert types for this agency
	var alertTypes []string
	rows, _ := h.db.Query(context.Background(),
		`SELECT alert_type FROM agency_alert_types WHERE agency_id = $1`, agencyID)
	for rows.Next() {
		var at string
		rows.Scan(&at)
		alertTypes = append(alertTypes, at)
	}
	rows.Close()

	if len(alertTypes) == 0 {
		respondJSON(w, http.StatusOK, []interface{}{})
		return
	}

	// Build query with alert type filter
	placeholders := make([]string, len(alertTypes))
	args := make([]interface{}, len(alertTypes)+1)
	args[0] = agencyID

	for i, at := range alertTypes {
		placeholders[i] = fmt.Sprintf("$%d", i+2)
		args[i+1] = at
	}

	query := fmt.Sprintf(`
		SELECT id, alert_type, title, description, severity_score, status, created_at
		FROM public_alerts
		WHERE alert_type IN (%s)
		ORDER BY created_at DESC
		LIMIT 100
	`, strings.Join(placeholders, ","))

	alertRows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		http.Error(w, "Failed to fetch alerts", http.StatusInternalServerError)
		return
	}
	defer alertRows.Close()

	type Alert struct {
		ID          string  `json:"id"`
		Type        string  `json:"alert_type"`
		Title       string  `json:"title"`
		Description string  `json:"description"`
		Severity    float64 `json:"severity_score"`
		Status      string  `json:"status"`
		CreatedAt   string  `json:"created_at"`
	}

	var alerts []Alert
	for alertRows.Next() {
		var a Alert
		var createdAt interface{}
		alertRows.Scan(&a.ID, &a.Type, &a.Title, &a.Description, &a.Severity, &a.Status, &createdAt)
		if createdAt != nil {
			a.CreatedAt = fmt.Sprintf("%v", createdAt)
		}
		alerts = append(alerts, a)
	}

	respondJSON(w, http.StatusOK, alerts)
}

// GetAgencyAssets returns assets belonging to an agency
func (h *AgencyRBACHandler) GetAgencyAssets(w http.ResponseWriter, r *http.Request) {
	agencyID := chi.URLParam(r, "agencyID")

	query := `
		SELECT id, name, type, status, location, call_sign
		FROM agency_assets
		WHERE agency_id = $1
		ORDER BY name
	`

	rows, err := h.db.Query(context.Background(), query, agencyID)
	if err != nil {
		http.Error(w, "Failed to fetch assets", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Asset struct {
		ID       string `json:"id"`
		Name     string `json:"name"`
		Type     string `json:"type"`
		Status   string `json:"status"`
		Location string `json:"location"`
		CallSign string `json:"call_sign"`
	}

	var assets []Asset
	for rows.Next() {
		var a Asset
		rows.Scan(&a.ID, &a.Name, &a.Type, &a.Status, &a.Location, &a.CallSign)
		assets = append(assets, a)
	}

	respondJSON(w, http.StatusOK, assets)
}

// RequireAgencyRole enforces that user belongs to specific agency with required role
func RequireAgencyRole(agencyID string, roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// This would check user_agency_assignments table
			// For now, return forbidden - implementation would need DB access
			http.Error(w, "Forbidden: agency access required", http.StatusForbidden)
		})
	}
}

// AutoRouteAlertToAgencies routes an alert to appropriate agencies based on type
func AutoRouteAlertToAgencies(db *pgxpool.Pool, alertType string, alertID string) error {
	// Find agencies that handle this alert type
	query := `
		SELECT DISTINCT agency_id 
		FROM agency_alert_types 
		WHERE alert_type = $1
	`

	rows, err := db.Query(context.Background(), query, alertType)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var agencyID string
		rows.Scan(&agencyID)

		// Create alert-agency assignment
		_, err := db.Exec(context.Background(), `
			INSERT INTO alert_assignments (alert_id, agency_id, status, assigned_at)
			VALUES ($1, $2, 'pending', NOW())
			ON CONFLICT DO NOTHING
		`, alertID, agencyID)

		if err != nil {
			return err
		}
	}

	return nil
}
