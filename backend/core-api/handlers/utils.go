package handlers

import (
	"encoding/json"
	"net/http"
)

// respondJSON is a shared helper to write JSON responses within the handlers package
func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
