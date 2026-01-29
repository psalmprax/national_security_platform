package mq

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

var NC *nats.Conn
var JS jetstream.JetStream

// InitNATS initializes the NATS connection and JetStream context
func InitNATS() error {
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = "nats://nats:4222"
	}

	var err error
	NC, err = nats.Connect(natsURL)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS: %w", err)
	}

	JS, err = jetstream.New(NC)
	if err != nil {
		return fmt.Errorf("failed to create JetStream context: %w", err)
	}

	// Create a stream if it doesn't exist
	ctx := context.Background()
	_, err = JS.CreateStream(ctx, jetstream.StreamConfig{
		Name:     "ALERTS",
		Subjects: []string{"alerts.>"},
	})
	if err != nil {
		log.Printf("Stream might already exist: %v", err)
	}

	log.Println("✅ NATS JetStream connection established")
	return nil
}

// PublishAlert publishes an alert event to NATS
func PublishAlert(ctx context.Context, subject string, data interface{}) error {
	payload, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal alert: %w", err)
	}

	_, err = JS.Publish(ctx, subject, payload)
	if err != nil {
		return fmt.Errorf("failed to publish to NATS: %w", err)
	}

	log.Printf("📢 Event published to NATS: %s", subject)
	return nil
}

// Close closes the NATS connection
func Close() {
	if NC != nil {
		NC.Close()
	}
}
