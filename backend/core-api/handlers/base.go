package handlers

import (
	"context"
	"log"
	"national_security_platform/backend/core-api/internal/mq"
	"national_security_platform/backend/core-api/internal/storage"

	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler represents the base handler with dependencies
type Handler struct {
	db        *pgxpool.Pool
	logger    *log.Logger
	validator *validator.Validate
	storage   storage.StorageProvider
}

// NewHandler creates a new base handler
func NewHandler(db *pgxpool.Pool, logger *log.Logger, storage storage.StorageProvider) *Handler {
	return &Handler{
		db:        db,
		logger:    logger,
		validator: validator.New(),
		storage:   storage,
	}
}

// publishEvent is a helper to publish events to NATS
func (h *Handler) publishEvent(subject string, data interface{}) {
	err := mq.PublishAlert(context.Background(), subject, data)
	if err != nil {
		h.logger.Printf("Failed to publish event %s: %v", subject, err)
	}
}

// Location represents a geographic location
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}
