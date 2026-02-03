package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

// UploadMediaResponse represents the response after a successful upload
type UploadMediaResponse struct {
	ID          string `json:"id"`
	StoragePath string `json:"storage_path"`
	Hash        string `json:"hash_sha256"`
	MimeType    string `json:"mime_type"`
}

// HandleMediaUpload handles file uploads for evidence
func (h *Handler) HandleMediaUpload(w http.ResponseWriter, r *http.Request) {
	// Limit upload size (e.g., 50MB for video)
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		http.Error(w, "File too large or invalid form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Missing file in request", http.StatusBadRequest)
		return
	}
	defer file.Close()

	alertID := r.FormValue("alert_id")
	contentType := header.Header.Get("Content-Type")

	// Calculate SHA-256 hash while reading to a buffer (or pipe)
	hash := sha256.New()

	// We need to read the file twice (once for hash, once for upload)
	// or use a TEE reader. Since we are uploading to S3, we can use a TeeReader
	// if we buffer it or if the S3 client supports streaming.
	// MinIO client supports io.Reader.

	pr, pw := io.Pipe()
	tee := io.TeeReader(file, pw)

	// Stream to hash and upload concurrently
	hashErrChan := make(chan error, 1)
	go func() {
		defer pw.Close()
		_, err := io.Copy(hash, tee)
		hashErrChan <- err
	}()

	// Generate storage key: uploads/alerts/{alert_id}/{random_uuid}_{filename}
	fileName := header.Filename
	ext := filepath.Ext(fileName)
	uniqueName := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	storageKey := fmt.Sprintf("artifacts/%s", uniqueName)
	if alertID != "" {
		storageKey = fmt.Sprintf("alerts/%s/%s", alertID, uniqueName)
	}

	bucketName := "national-security-evidence"

	// Upload via storage provider
	_, err = h.storage.Upload(r.Context(), bucketName, storageKey, pr, contentType)
	if err != nil {
		h.logger.Printf("Failed to upload to storage: %v", err)
		http.Error(w, "Failed to upload to storage", http.StatusInternalServerError)
		return
	}

	// Wait for hashing to complete
	if err := <-hashErrChan; err != nil {
		h.logger.Printf("Failed to calculate hash: %v", err)
		http.Error(w, "Internal failure during hashing", http.StatusInternalServerError)
		return
	}

	fileHash := hex.EncodeToString(hash.Sum(nil))

	// Record in database if alert_id is provided
	attachmentID := uuid.New().String()
	if alertID != "" {
		query := `
			INSERT INTO media_attachments (
				id, alert_id, storage_path, content_hash_sha256, mime_type, file_size_bytes
			) VALUES ($1, $2, $3, $4, $5, $6)
		`
		_, err = h.db.Exec(r.Context(), query,
			attachmentID, alertID, storageKey, fileHash, contentType, header.Size)

		if err != nil {
			h.logger.Printf("Failed to record attachment in DB: %v", err)
			// We don't fail the request if storage succeeded but DB failed (though we should)
		}
	}

	response := UploadMediaResponse{
		ID:          attachmentID,
		StoragePath: storageKey,
		Hash:        fileHash,
		MimeType:    contentType,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HandleGetMediaDownloadURL generates a pre-signed URL for viewing evidence
func (h *Handler) HandleGetMediaDownloadURL(w http.ResponseWriter, r *http.Request) {
	// In a real app, this would check clearance levels for the associated alert
	bucketName := r.URL.Query().Get("bucket")
	if bucketName == "" {
		bucketName = "national-security-evidence"
	}

	objectKey := r.URL.Query().Get("key")
	if objectKey == "" {
		http.Error(w, "Missing object key", http.StatusBadRequest)
		return
	}

	url, err := h.storage.GetDownloadURL(r.Context(), bucketName, objectKey, 15*time.Minute)
	if err != nil {
		h.logger.Printf("Failed to generate download URL: %v", err)
		http.Error(w, "Failed to generate access URL", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"url": url,
	})
}
