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

// EnsureAuditStream creates the audit stream if it doesn't exist
func EnsureAuditStream(ctx context.Context) error {
	if JS == nil {
		return fmt.Errorf("jetstream not initialized")
	}
	_, err := JS.CreateStream(ctx, jetstream.StreamConfig{
		Name:     "AUDIT_LOGS",
		Subjects: []string{"audit.logs"},
		Storage:  jetstream.FileStorage,
	})
	if err != nil {
		// Ignore if it already exists, or log warning
		log.Printf("Audit stream check: %v", err)
	}
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

// SafePublish attempts to publish to NATS, but falls back to secure logging if connection is lost.
// This prevents the API from returning 500 errors during temporary NATS outages.
func SafePublish(ctx context.Context, subject string, data interface{}) {
	payload, err := json.Marshal(data)
	if err != nil {
		log.Printf("❌ CRITICAL: Failed to marshal alert for SafePublish: %v", err)
		return
	}

	if JS != nil {
		_, err = JS.Publish(ctx, subject, payload)
		if err == nil {
			log.Printf("📢 Event safely published to NATS: %s", subject)
			return
		}
		log.Printf("⚠️ NATS Publish failed, falling back to secure audit log: %v", err)
	} else {
		log.Printf("⚠️ NATS JetStream not initialized, falling back to secure audit log")
	}

	// Fallback: Log the alert payload so it can be recovered from container logs
	log.Printf("💾 FAILOVER_LOG [%s]: %s", subject, string(payload))
}

// PublishAudit publishes an audit entry to the audit stream
func PublishAudit(ctx context.Context, entry interface{}) error {
	payload, err := json.Marshal(entry)
	if err != nil {
		return fmt.Errorf("failed to marshal audit entry: %w", err)
	}

	_, err = JS.Publish(ctx, "audit.logs", payload)
	if err != nil {
		return fmt.Errorf("failed to publish audit log: %w", err)
	}

	return nil
}

// Subscribe subscribes to a subject and invokes the handler
func Subscribe(ctx context.Context, subject string, handler func(msg []byte)) error {
	if NC == nil {
		return fmt.Errorf("nats connection not initialized")
	}

	_, err := NC.Subscribe(subject, func(m *nats.Msg) {
		handler(m.Data)
	})
	if err != nil {
		return fmt.Errorf("failed to subscribe: %w", err)
	}

	log.Printf("👂 Subscribed to NATS: %s", subject)
	return nil
}

// SubscribeAudit subscribes to the audit stream
func SubscribeAudit(ctx context.Context, handler func(msg []byte)) error {
	if JS == nil {
		return fmt.Errorf("jetstream not initialized")
	}

	consumer, err := JS.CreateOrUpdateConsumer(ctx, "AUDIT_LOGS", jetstream.ConsumerConfig{
		Durable:   "AuditWorker",
		AckPolicy: jetstream.AckExplicitPolicy,
	})
	if err != nil {
		return fmt.Errorf("failed to create consumer: %w", err)
	}

	// Consume messages
	_, err = consumer.Consume(func(msg jetstream.Msg) {
		handler(msg.Data())
		msg.Ack()
	})
	if err != nil {
		return fmt.Errorf("failed to start consuming: %w", err)
	}

	log.Println("👂 Audit Worker subscribed to audit.logs")
	return nil
}

// Close closes the NATS connection
func Close() {
	if NC != nil {
		NC.Close()
	}
}
