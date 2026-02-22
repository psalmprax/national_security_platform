package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

// SafetyScore represents the safety score for an LGA
type SafetyScore struct {
	LGACode           string    `json:"lga_code"`
	LGAName           string    `json:"lga_name"`
	StateCode         string    `json:"state_code"`
	StateName         string    `json:"state_name"`
	IncidentCount     int       `json:"incident_count"`
	AvgSeverity       float64   `json:"avg_severity"`
	RecentIncidents   int       `json:"recent_incidents"`
	ResolvedCount     int       `json:"resolved_count"`
	SafetyScore       int       `json:"safety_score"`        // 0-100, higher is safer
	TrendPct          int       `json:"trend_pct"`           // % change from previous period
	RiskLevel         string    `json:"risk_level"`          // very_safe, safe, moderate_risk, high_risk, critical_risk
	ResolutionRatePct int       `json:"resolution_rate_pct"` // % of incidents resolved
	UpdatedAt         time.Time `json:"updated_at"`
}

// GetSafetyScores returns safety scores for all LGAs or a specific LGA
func (h *Handler) GetSafetyScores(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	lgaCode := r.URL.Query().Get("lga_code")
	stateCode := r.URL.Query().Get("state_code")
	riskLevel := r.URL.Query().Get("risk_level")
	limit := 100 // Default limit

	// Build query
	query := `
		SELECT 
			lga_code, lga_name, state_code, state_name,
			incident_count, avg_severity, recent_incidents, resolved_count,
			safety_score, trend_pct, risk_level, resolution_rate_pct, calculated_at
		FROM lga_safety_scores_cached
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 1

	// Add filters
	if lgaCode != "" {
		query += fmt.Sprintf(" AND lga_code = $%d", argCount)
		args = append(args, lgaCode)
		argCount++
	}

	if stateCode != "" {
		query += fmt.Sprintf(" AND state_code = $%d", argCount)
		args = append(args, stateCode)
		argCount++
	}

	if riskLevel != "" {
		query += fmt.Sprintf(" AND risk_level = $%d", argCount)
		args = append(args, riskLevel)
		argCount++
	}

	query += ` ORDER BY safety_score ASC, incident_count DESC`
	query += fmt.Sprintf(" LIMIT $%d", argCount)
	args = append(args, limit)

	// Execute query
	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		h.logger.Printf("Error fetching safety scores: %v", err)
		// Return empty response instead of error if table doesn't exist
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"scores": []SafetyScore{},
			"total":  0,
			"error":  "Data not available",
		})
		return
	}
	defer rows.Close()

	scores := []SafetyScore{}
	for rows.Next() {
		var score SafetyScore
		err := rows.Scan(
			&score.LGACode, &score.LGAName, &score.StateCode, &score.StateName,
			&score.IncidentCount, &score.AvgSeverity, &score.RecentIncidents, &score.ResolvedCount,
			&score.SafetyScore, &score.TrendPct, &score.RiskLevel, &score.ResolutionRatePct,
			&score.UpdatedAt,
		)
		if err != nil {
			h.logger.Printf("Error scanning safety score: %v", err)
			continue
		}

		scores = append(scores, score)
	}

	// Return response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"scores": scores,
		"total":  len(scores),
	})
}

// GetSafetyScoresSummary returns aggregated statistics
func (h *Handler) GetSafetyScoresSummary(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT 
			COUNT(*) as total_lgas,
			COUNT(CASE WHEN risk_level = 'very_safe' THEN 1 END) as very_safe_count,
			COUNT(CASE WHEN risk_level = 'safe' THEN 1 END) as safe_count,
			COUNT(CASE WHEN risk_level = 'moderate_risk' THEN 1 END) as moderate_risk_count,
			COUNT(CASE WHEN risk_level = 'high_risk' THEN 1 END) as high_risk_count,
			COUNT(CASE WHEN risk_level = 'critical_risk' THEN 1 END) as critical_risk_count,
			AVG(safety_score)::INTEGER as avg_safety_score,
			SUM(incident_count) as total_incidents,
			AVG(resolution_rate_pct)::INTEGER as avg_resolution_rate
		FROM lga_safety_scores_cached
	`

	var summary struct {
		TotalLGAs         int `json:"total_lgas"`
		VerySafeCount     int `json:"very_safe_count"`
		SafeCount         int `json:"safe_count"`
		ModerateRiskCount int `json:"moderate_risk_count"`
		HighRiskCount     int `json:"high_risk_count"`
		CriticalRiskCount int `json:"critical_risk_count"`
		AvgSafetyScore    int `json:"avg_safety_score"`
		TotalIncidents    int `json:"total_incidents"`
		AvgResolutionRate int `json:"avg_resolution_rate"`
	}

	err := h.db.QueryRow(context.Background(), query).Scan(
		&summary.TotalLGAs,
		&summary.VerySafeCount, &summary.SafeCount, &summary.ModerateRiskCount,
		&summary.HighRiskCount, &summary.CriticalRiskCount,
		&summary.AvgSafetyScore, &summary.TotalIncidents, &summary.AvgResolutionRate,
	)

	if err != nil {
		h.logger.Printf("Error fetching safety summary: %v", err)
		// Return empty summary instead of error
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(struct {
			TotalLGAs         int `json:"total_lgas"`
			VerySafeCount     int `json:"very_safe_count"`
			SafeCount         int `json:"safe_count"`
			ModerateRiskCount int `json:"moderate_risk_count"`
			HighRiskCount     int `json:"high_risk_count"`
			CriticalRiskCount int `json:"critical_risk_count"`
			AvgSafetyScore    int `json:"avg_safety_score"`
			TotalIncidents    int `json:"total_incidents"`
			AvgResolutionRate int `json:"avg_resolution_rate"`
		}{
			TotalLGAs:         0,
			VerySafeCount:     0,
			SafeCount:         0,
			ModerateRiskCount: 0,
			HighRiskCount:     0,
			CriticalRiskCount: 0,
			AvgSafetyScore:    0,
			TotalIncidents:    0,
			AvgResolutionRate: 0,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

// RegisterSafetyScoreRoutes registers safety score endpoints
func RegisterSafetyScoreRoutes(r chi.Router, h *Handler) {
	r.Get("/api/v1/analytics/safety-scores", h.GetSafetyScores)
	r.Get("/api/v1/analytics/safety-scores/summary", h.GetSafetyScoresSummary)
}
