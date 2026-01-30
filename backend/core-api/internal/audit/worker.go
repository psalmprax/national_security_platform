package audit

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"national_security_platform/backend/core-api/internal/db"
	"national_security_platform/backend/core-api/internal/mq"
)

// StartAuditWorker starts the background worker to process audit logs
func StartAuditWorker(ctx context.Context) {
	// Ensure the stream exists before subscribing
	if err := mq.EnsureAuditStream(ctx); err != nil {
		log.Printf("❌ Failed to ensure audit stream: %v", err)
		return
	}

	err := mq.SubscribeAudit(ctx, func(msg []byte) {
		var entry AuditEntry
		if err := json.Unmarshal(msg, &entry); err != nil {
			log.Printf("❌ Failed to unmarshal audit entry: %v", err)
			return
		}

		// Simulate "Heavy" Cryptographic Hashing (as per architecture requirement)
		// in v2.0 actual implementation, this would involve Merkle Tree insertion or Blockchain anchoring
		_ = GenerateEvidenceHash(string(entry.Changes))

		// Persist to Database
		// We use a background context because the passing context might be cancelled
		dbCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := db.CreateAuditLog(dbCtx, entry.EntityID, entry.Action, entry.ActorID, entry.Changes, entry.Classification); err != nil {
			log.Printf("❌ Failed to persist audit log: %v", err)
			return
		}

		log.Printf("✅ Processed Audit Log: %s by %s", entry.Action, entry.ActorID)
	})

	if err != nil {
		log.Printf("❌ Failed to start audit worker: %v", err)
	}
}
