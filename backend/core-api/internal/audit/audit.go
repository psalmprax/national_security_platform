package audit

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"national_security_platform/backend/core-api/internal/mq"

	"github.com/google/uuid"
)

// AuditEntry represents a log entry to be processed asynchronously
type AuditEntry struct {
	EntityID       uuid.UUID       `json:"entity_id"`
	Action         string          `json:"action"`
	ActorID        uuid.UUID       `json:"actor_id"`
	Changes        json.RawMessage `json:"changes"`
	Classification string          `json:"classification"`
}

// GenerateEvidenceHash creates a SHA-256 hash of the provided content
func GenerateEvidenceHash(content string) string {
	hash := sha256.Sum256([]byte(content))
	return hex.EncodeToString(hash[:])
}

// LogAction records a security-sensitive action to the audit logs
func LogAction(ctx context.Context, actorID uuid.UUID, entityID uuid.UUID, action string, changes interface{}, classification string) error {
	var changesJSON json.RawMessage
	if changes != nil {
		data, err := json.Marshal(changes)
		if err != nil {
			return fmt.Errorf("failed to marshal audit changes: %w", err)
		}
		changesJSON = data
	}

	entry := AuditEntry{
		EntityID:       entityID,
		Action:         action,
		ActorID:        actorID,
		Changes:        changesJSON,
		Classification: classification,
	}

	// Async Publish to NATS
	return mq.PublishAudit(ctx, entry)
}
