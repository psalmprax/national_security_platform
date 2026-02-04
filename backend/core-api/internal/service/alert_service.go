package service

import (
	"context"
	"fmt"
	"log"

	"national_security_platform/backend/core-api/internal/audit"
	"national_security_platform/backend/core-api/internal/db"
	"national_security_platform/backend/core-api/internal/models"
	"national_security_platform/backend/core-api/internal/mq"
	"national_security_platform/backend/core-api/internal/security"

	"github.com/google/uuid"
)

// AlertService handles alert-related business logic
type AlertService struct {
	sms SMSService
}

func NewAlertService(sms SMSService) *AlertService {
	return &AlertService{sms: sms}
}

// SubmitAlert processes and stores a new alert
func (s *AlertService) SubmitAlert(ctx context.Context, userID uuid.UUID, alertType string, lat, lon float64, content string) (*models.Alert, error) {
	// Verify user exists and get their trust score
	user, err := db.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	log.Printf("Alert submitted by: %s (Trust Score: %.2f, Hierarchy: %d)",
		user.Role, user.TrustScore, user.HierarchyWeight)

	// Encrypt sensitive content before storage
	encryptedContent, err := security.Encrypt(content)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt content: %w", err)
	}

	// Default to GPS
	locationSource := "GPS"
	finalLat := lat
	finalLon := lon

	// Governance Override Logic:
	// If a Traditional Ruler reports a Community Threat (not personal distress),
	// snap the location to their Village/Domain center.
	// This accounts for "The Oba is in London but reports trouble at home".
	if user.Role == "TRADITIONAL_RULER" && alertType != "DURESS" && alertType != "KIDNAPPING" {
		if user.VillageID != nil {
			vLat, vLon, err := db.GetVillageLocation(ctx, *user.VillageID)
			if err == nil {
				finalLat = vLat
				finalLon = vLon
				locationSource = "GOVERNANCE_OVERRIDE"
				log.Printf("👑 Governance Override Applied: Snapped alert to Village ID %s", user.VillageID)
			} else {
				log.Printf("⚠️ Governance Override Failed: Could not get village location for user %s", userID)
			}
		}
	}

	// Create alert object
	alert := &models.Alert{
		ID:                 uuid.New(),
		UserID:             userID,
		Status:             "PENDING",
		PriorityClass:      determinePriorityClass(user.HierarchyWeight, alertType),
		Latitude:           finalLat,
		Longitude:          finalLon,
		LocationSource:     locationSource,
		ImpactRadiusMeters: 100,
		AlertType:          alertType,
		ContentText:        &encryptedContent,
		VerificationCount:  0,
	}

	// Save to database
	if err := db.CreateAlert(ctx, alert); err != nil {
		return nil, fmt.Errorf("failed to save alert: %w", err)
	}

	// Generate evidence hash for accountability
	evidenceHash := audit.GenerateEvidenceHash(content)

	// Log the action to the immutable audit log
	err = audit.LogAction(ctx, userID, alert.ID, "SUBMIT_ALERT", map[string]string{
		"evidence_hash": evidenceHash,
		"priority":      alert.PriorityClass,
	}, "RESTRICTED")
	if err != nil {
		log.Printf("⚠️ Failed to log audit action: %v", err)
	}

	// Publish to NATS for async processing
	err = mq.PublishAlert(ctx, "alerts.new", alert)
	if err != nil {
		log.Printf("⚠️ Failed to publish alert to NATS: %v", err)
		// We don't fail the whole request because DB persistence succeeded
	}

	// Trigger SMS for critical alerts (Resilient Communications Failover)
	if alert.PriorityClass == "CRITICAL" && s.sms != nil {
		go func() {
			smsMsg := fmt.Sprintf("⚠️ CRITICAL SECURITY ALERT: [%s] detected. Source: %s. IMMEDIATE ACTION REQUIRED.",
				alert.AlertType, alert.LocationSource)
			if err := s.sms.SendSMS(context.Background(), user.PhoneNumber, smsMsg); err != nil {
				log.Printf("⚠️ Failed to send critical SMS: %v", err)
			}
		}()
	}

	return alert, nil
}

// determinePriorityClass calculates priority based on user hierarchy and alert type
func determinePriorityClass(hierarchyWeight int, alertType string) string {
	// High-severity alert types
	isSevere := map[string]bool{
		"INSURGENCY":   true,
		"KIDNAPPING":   true,
		"ETHNIC_CLASH": true,
		"TERRORISM":    true,
		"ATTACK":       true,
	}[alertType]

	// 1st Class Monarch (Weight 80-100)
	// Their word is final and immediate. Always CRITICAL.
	if hierarchyWeight >= 80 {
		return "CRITICAL"
	}

	// 2nd Class Monarch (Weight 50-79)
	if hierarchyWeight >= 50 {
		if isSevere {
			return "CRITICAL" // Severe event from 2nd class is also critical
		}
		return "URGENT" // Standard event from 2nd class is higher than routine
	}

	// 3rd Class Monarch / Local Lead (Weight 20-49)
	if hierarchyWeight >= 20 {
		if isSevere {
			return "URGENT"
		}
		return "ROUTINE"
	}

	// General Citizen / Low Trust
	return "ROUTINE"
}
