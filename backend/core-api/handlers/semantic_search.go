package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SearchResult represents a single search hit
type SearchResult struct {
	ID            string   `json:"id"`
	AlertType     string   `json:"alert_type"`
	ContentText   *string  `json:"content_text,omitempty"`
	Status        string   `json:"status"`
	PriorityClass string   `json:"priority_class"`
	SeverityScore *float64 `json:"severity_score,omitempty"`
	StateName     *string  `json:"state_name,omitempty"`
	LGAName       *string  `json:"lga_name,omitempty"`
	CreatedAt     string   `json:"created_at"`
	Rank          float64  `json:"rank"`
}

// RegisterSearchRoutes registers the semantic search API routes
func RegisterSearchRoutes(r chi.Router, pool *pgxpool.Pool) {
	r.Get("/api/v1/search/alerts", handleSearchAlerts(pool))
}

func handleSearchAlerts(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query().Get("q")
		if query == "" {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Query parameter 'q' is required"})
			return
		}

		// Use CockroachDB full-text search with ts_rank scoring
		// Falls back to ILIKE if tsvector column is not yet populated
		sqlQuery := `
			SELECT
				id::text,
				alert_type,
				content_text,
				status,
				priority_class,
				severity_score,
				state_name,
				lga_name,
				created_at::text,
				CASE
					WHEN search_vector IS NOT NULL
					THEN ts_rank(search_vector, plainto_tsquery('english', $1))
					ELSE 0.5
				END AS rank
			FROM alerts
			WHERE
				(search_vector IS NOT NULL AND search_vector @@ plainto_tsquery('english', $1))
				OR content_text ILIKE '%' || $1 || '%'
				OR alert_type ILIKE '%' || $1 || '%'
			ORDER BY rank DESC, created_at DESC
			LIMIT 50
		`

		rows, err := pool.Query(r.Context(), sqlQuery, query)
		if err != nil {
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Search query failed"})
			return
		}
		defer rows.Close()

		results := []SearchResult{}
		for rows.Next() {
			var s SearchResult
			if err := rows.Scan(&s.ID, &s.AlertType, &s.ContentText, &s.Status, &s.PriorityClass, &s.SeverityScore, &s.StateName, &s.LGAName, &s.CreatedAt, &s.Rank); err != nil {
				continue
			}
			results = append(results, s)
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"query":   query,
			"results": results,
			"count":   len(results),
		})
	}
}
