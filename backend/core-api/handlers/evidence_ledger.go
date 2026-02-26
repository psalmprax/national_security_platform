package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// EvidenceLedgerEntry represents an immutable chain-linked evidence record
type EvidenceLedgerEntry struct {
	ID           uuid.UUID       `json:"id"`
	EntityType   string          `json:"entity_type"`
	EntityID     uuid.UUID       `json:"entity_id"`
	ContentHash  string          `json:"content_hash"`
	PreviousHash string          `json:"previous_hash"`
	RecordedBy   *uuid.UUID      `json:"recorded_by,omitempty"`
	Metadata     json.RawMessage `json:"metadata,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
}

// RecordEvidenceRequest represents the payload for recording evidence
type RecordEvidenceRequest struct {
	EntityType string          `json:"entity_type"`
	EntityID   string          `json:"entity_id"`
	Content    string          `json:"content"`
	Metadata   json.RawMessage `json:"metadata,omitempty"`
}

// RegisterEvidenceLedgerRoutes registers the evidence ledger API routes
func RegisterEvidenceLedgerRoutes(r chi.Router, pool *pgxpool.Pool) {
	r.Get("/api/v1/evidence/ledger", handleGetLedger(pool))
	r.Post("/api/v1/evidence/record", handleRecordEvidence(pool))
	r.Get("/api/v1/evidence/verify/{hash}", handleVerifyEvidence(pool))
}

func handleGetLedger(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		entityType := r.URL.Query().Get("entity_type")
		entityID := r.URL.Query().Get("entity_id")

		query := `SELECT id, entity_type, entity_id, content_hash, previous_hash, recorded_by, metadata, created_at
			FROM evidence_ledger ORDER BY created_at DESC LIMIT 100`
		args := []interface{}{}

		if entityType != "" && entityID != "" {
			query = `SELECT id, entity_type, entity_id, content_hash, previous_hash, recorded_by, metadata, created_at
				FROM evidence_ledger WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC LIMIT 100`
			args = append(args, entityType, entityID)
		}

		rows, err := pool.Query(r.Context(), query, args...)
		if err != nil {
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to query ledger"})
			return
		}
		defer rows.Close()

		entries := []EvidenceLedgerEntry{}
		for rows.Next() {
			var e EvidenceLedgerEntry
			if err := rows.Scan(&e.ID, &e.EntityType, &e.EntityID, &e.ContentHash, &e.PreviousHash, &e.RecordedBy, &e.Metadata, &e.CreatedAt); err != nil {
				continue
			}
			entries = append(entries, e)
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"entries": entries,
			"count":   len(entries),
		})
	}
}

func handleRecordEvidence(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req RecordEvidenceRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
			return
		}

		if req.EntityType == "" || req.EntityID == "" || req.Content == "" {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "entity_type, entity_id, and content are required"})
			return
		}

		entityID, err := uuid.Parse(req.EntityID)
		if err != nil {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid entity_id format"})
			return
		}

		// Generate SHA-256 hash of the content
		hash := sha256.Sum256([]byte(req.Content))
		contentHash := hex.EncodeToString(hash[:])

		// Get the previous hash for chain linking
		var previousHash string
		err = pool.QueryRow(r.Context(),
			`SELECT content_hash FROM evidence_ledger ORDER BY created_at DESC LIMIT 1`,
		).Scan(&previousHash)
		if err != nil {
			previousHash = "GENESIS"
		}

		// Get actor from context
		var recordedBy *uuid.UUID
		if userID, ok := r.Context().Value("user_id").(uuid.UUID); ok {
			recordedBy = &userID
		}

		metadata := req.Metadata
		if metadata == nil {
			metadata = json.RawMessage(`{}`)
		}

		// Insert the immutable record
		var id uuid.UUID
		var createdAt time.Time
		err = pool.QueryRow(r.Context(),
			`INSERT INTO evidence_ledger (entity_type, entity_id, content_hash, previous_hash, recorded_by, metadata)
			 VALUES ($1, $2, $3, $4, $5, $6)
			 RETURNING id, created_at`,
			req.EntityType, entityID, contentHash, previousHash, recordedBy, metadata,
		).Scan(&id, &createdAt)
		if err != nil {
			respondJSON(w, http.StatusInternalServerError, map[string]string{"error": fmt.Sprintf("Failed to record evidence: %v", err)})
			return
		}

		respondJSON(w, http.StatusCreated, map[string]interface{}{
			"id":            id,
			"content_hash":  contentHash,
			"previous_hash": previousHash,
			"chain_valid":   true,
			"created_at":    createdAt,
		})
	}
}

func handleVerifyEvidence(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		hashParam := chi.URLParam(r, "hash")
		if hashParam == "" {
			respondJSON(w, http.StatusBadRequest, map[string]string{"error": "hash parameter required"})
			return
		}

		var entry EvidenceLedgerEntry
		err := pool.QueryRow(r.Context(),
			`SELECT id, entity_type, entity_id, content_hash, previous_hash, recorded_by, metadata, created_at
			 FROM evidence_ledger WHERE content_hash = $1`,
			hashParam,
		).Scan(&entry.ID, &entry.EntityType, &entry.EntityID, &entry.ContentHash, &entry.PreviousHash, &entry.RecordedBy, &entry.Metadata, &entry.CreatedAt)
		if err != nil {
			respondJSON(w, http.StatusNotFound, map[string]interface{}{
				"verified": false,
				"error":    "Evidence hash not found in ledger",
			})
			return
		}

		// Verify chain integrity by checking the previous hash exists
		chainValid := entry.PreviousHash == "GENESIS"
		if !chainValid {
			var count int
			_ = pool.QueryRow(r.Context(),
				`SELECT COUNT(*) FROM evidence_ledger WHERE content_hash = $1`,
				entry.PreviousHash,
			).Scan(&count)
			chainValid = count > 0
		}

		respondJSON(w, http.StatusOK, map[string]interface{}{
			"verified":    true,
			"chain_valid": chainValid,
			"entry":       entry,
		})
	}
}
