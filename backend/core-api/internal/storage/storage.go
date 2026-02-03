package storage

import (
	"context"
	"io"
	"time"
)

// StorageProvider defines the interface for multi-cloud object storage
type StorageProvider interface {
	// Upload uploads a file to the storage provider
	Upload(ctx context.Context, bucketName string, objectKey string, data io.Reader, contentType string) (string, error)

	// GetDownloadURL generates a pre-signed URL for downloading a file
	GetDownloadURL(ctx context.Context, bucketName string, objectKey string, expiry time.Duration) (string, error)

	// Delete removes a file from the storage provider
	Delete(ctx context.Context, bucketName string, objectKey string) error

	// ProviderType returns the name of the provider (e.g., "MINIO", "AWS_S3", "GCS")
	ProviderType() string
}

// FileMetadata represents common metadata for stored evidence
type FileMetadata struct {
	ID          string    `json:"id"`
	FileName    string    `json:"file_name"`
	ContentType string    `json:"content_type"`
	Size        int64     `json:"size"`
	HashSHA256  string    `json:"hash_sha256"`
	Provider    string    `json:"provider"`
	Bucket      string    `json:"bucket"`
	Key         string    `json:"key"`
	CreatedAt   time.Time `json:"created_at"`
}
