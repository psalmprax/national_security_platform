package audit

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"national_security_platform/backend/core-api/internal/db"

	"github.com/google/uuid"
)

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

	return db.CreateAuditLog(ctx, entityID, action, actorID, changesJSON, classification)
}
