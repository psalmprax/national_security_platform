package handlers

import (
	"encoding/json"
	"log"
	"net/http"
)

type LogEntry struct {
	Timestamp string      `json:"timestamp"`
	Level     string      `json:"level"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data"`
	Context   struct {
		UserAgent string `json:"userAgent"`
		URL       string `json:"url"`
		Component string `json:"component"`
	} `json:"context"`
}

type LogBatch struct {
	Entries []LogEntry `json:"entries"`
}

// HandleLog processes a single log entry from the frontend
func HandleLog(w http.ResponseWriter, r *http.Request) {
	var entry LogEntry
	if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
		http.Error(w, "Invalid log format", http.StatusBadRequest)
		return
	}

	// For now, we just print to stdout so it shows up in Docker logs
	// In production, this would go to Elasticsearch/Splunk/etc.
	log.Printf("[FRONTEND] [%s] %s: %s (Component: %s)",
		entry.Level,
		entry.Timestamp,
		entry.Message,
		entry.Context.Component,
	)

	w.WriteHeader(http.StatusOK)
}

// HandleLogBatch processes a batch of offline logs
func HandleLogBatch(w http.ResponseWriter, r *http.Request) {
	var batch LogBatch
	if err := json.NewDecoder(r.Body).Decode(&batch); err != nil {
		http.Error(w, "Invalid batch format", http.StatusBadRequest)
		return
	}

	log.Printf("[FRONTEND] Processing batch of %d logs...", len(batch.Entries))

	for _, entry := range batch.Entries {
		log.Printf("[FRONTEND] [%s] %s: %s", entry.Level, entry.Timestamp, entry.Message)
	}

	w.WriteHeader(http.StatusOK)
}
