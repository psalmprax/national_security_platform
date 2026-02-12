package models

import (
	"time"

	"github.com/google/uuid"
)

type Alert struct {
	ID                  uuid.UUID `json:"id"`
	UserID              uuid.UUID `json:"user_id"`
	Status              string    `json:"status"`
	PriorityClass       string    `json:"priority_class"`
	Latitude            float64   `json:"latitude"`
	Longitude           float64   `json:"longitude"`
	ImpactRadiusMeters  int       `json:"impact_radius_meters"`
	AlertType           string    `json:"alert_type"`
	ContentText         *string   `json:"content_text,omitempty"`
	ContentMediaURL     *string   `json:"content_media_url,omitempty"`
	SeverityScore       *float64  `json:"severity_score,omitempty"`
	RiskKeywords        []string  `json:"risk_keywords,omitempty"`
	VerificationCount   int       `json:"verification_count"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
	LGAName             *string   `json:"lga_name,omitempty"`
	StateName           *string   `json:"state_name,omitempty"`
	LocationSource      string    `json:"location_source"`
	ClassificationLevel string    `json:"classification_level"`
}

type User struct {
	ID                  uuid.UUID  `json:"id"`
	PhoneNumber         string     `json:"phone_number"`
	Email               *string    `json:"email,omitempty"`
	FullName            *string    `json:"full_name,omitempty"`
	NIN                 *string    `json:"nin,omitempty"`
	Role                string     `json:"role"`
	MonarchGrade        *string    `json:"monarch_grade,omitempty"`
	DomainTerritory     *string    `json:"domain_territory,omitempty"`
	HierarchyWeight     int        `json:"hierarchy_weight"`
	TrustScore          float64    `json:"trust_score"`
	ClearanceLevel      string     `json:"clearance_level"`
	VillageID           *uuid.UUID `json:"village_id,omitempty"`
	LGAID               *uuid.UUID `json:"lga_id,omitempty"`
	StateID             *uuid.UUID `json:"state_id,omitempty"`
	Status              string     `json:"status"`
	NINVerified         bool       `json:"nin_verified"`
	NINVerificationDate *time.Time `json:"nin_verification_date,omitempty"`
	IdentityProvider    string     `json:"identity_provider"`
	BiometricEnrolled   bool       `json:"biometric_enrolled"`
	IdentityNotes       *string    `json:"identity_notes,omitempty"`
	PasswordHash        *string    `json:"-"` // Never expose password hash in JSON
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type State struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Capital   *string   `json:"capital_city,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type LGA struct {
	ID        uuid.UUID `json:"id"`
	StateID   uuid.UUID `json:"state_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Village struct {
	ID            uuid.UUID `json:"id"`
	LGAID         uuid.UUID `json:"lga_id"`
	Name          string    `json:"name"`
	PopulationEst *int      `json:"population_est,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type Device struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	HWID        string     `json:"hwid"`
	PublicKey   string     `json:"public_key"`
	DeviceModel *string    `json:"device_model,omitempty"`
	OSVersion   *string    `json:"os_version,omitempty"`
	FCMToken    *string    `json:"fcm_token,omitempty"`
	Status      string     `json:"status"`
	LastSeenAt  *time.Time `json:"last_seen_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type MediaAttachment struct {
	ID                 uuid.UUID `json:"id"`
	AlertID            uuid.UUID `json:"alert_id"`
	StoragePath        string    `json:"storage_path"`
	ContentHashSHA256  string    `json:"content_hash_sha256"`
	MimeType           *string   `json:"mime_type,omitempty"`
	FileSizeBytes      *int      `json:"file_size_bytes,omitempty"`
	IsEncrypted        bool      `json:"is_encrypted"`
	EncryptionMetadata []byte    `json:"encryption_metadata,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type Corroboration struct {
	ID              uuid.UUID `json:"id"`
	AlertID         uuid.UUID `json:"alert_id"`
	VerifierID      uuid.UUID `json:"verifier_id"`
	ConfidenceScore float64   `json:"confidence_score"`
	Comments        *string   `json:"comments,omitempty"`
	IsCoerced       bool      `json:"is_coerced_report"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type SystemStats struct {
	TotalUsers     int `json:"total_users"`
	ActiveAlerts   int `json:"active_alerts"`
	CriticalAlerts int `json:"critical_alerts"`
}

type Agency struct {
	ID                uuid.UUID `json:"id"`
	Name              string    `json:"name"`
	Acronym           *string   `json:"acronym,omitempty"`
	Type              string    `json:"type"`
	JurisdictionScope string    `json:"jurisdiction_scope"`
	HQAddress         *string   `json:"hq_address,omitempty"`
	ContactPhone      *string   `json:"contact_phone,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type Asset struct {
	ID            uuid.UUID `json:"id"`
	AgencyID      uuid.UUID `json:"agency_id"`
	Name          string    `json:"name"`
	Type          string    `json:"type"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	Status        string    `json:"status"`
	Description   *string   `json:"description,omitempty"`
	CallSign      *string   `json:"call_sign,omitempty"`
	CapacityLevel int       `json:"capacity_level"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type SecurityScan struct {
	ID            uuid.UUID   `json:"id"`
	ScanTime      time.Time   `json:"scan_time"`
	TargetService string      `json:"target_service"`
	Status        string      `json:"status"`
	Findings      interface{} `json:"findings"`  // JSONB
	MetaData      interface{} `json:"meta_data"` // JSONB
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
}

type TriangulatedAsset struct {
	Asset            Asset   `json:"asset"`
	DistanceMeters   float64 `json:"distance_meters"`
	SuitabilityScore float64 `json:"suitability_score"`
}

type SectorReport struct {
	SectorID         string    `json:"sector_id"`
	Timestamp        time.Time `json:"timestamp"`
	TotalAlerts      int       `json:"total_alerts"`
	CriticalThreats  int       `json:"critical_threats"`
	RoutineAlerts    int       `json:"routine_alerts"`
	SystemIntegrity  float64   `json:"system_integrity"`
	TrustScoreAvg    float64   `json:"trust_score_avg"`
	ThreatLevel      string    `json:"threat_level"` // LOW, MEDIUM, HIGH, CRITICAL
	LastIncidentType string    `json:"last_incident_type"`
}

type Mission struct {
	ID             uuid.UUID  `json:"id"`
	AlertID        uuid.UUID  `json:"alert_id"`
	AssetID        uuid.UUID  `json:"asset_id"`
	CommanderID    uuid.UUID  `json:"commander_id"`
	Status         string     `json:"status"`
	Priority       string     `json:"priority"`
	ETAMinutes     *int       `json:"eta_minutes,omitempty"`
	DispatchTime   time.Time  `json:"dispatch_time"`
	ArrivalTime    *time.Time `json:"arrival_time,omitempty"`
	CompletionTime *time.Time `json:"completion_time,omitempty"`
	Metadata       []byte     `json:"metadata,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type CreateMissionRequest struct {
	AlertID  string `json:"alert_id"`
	AssetID  string `json:"asset_id"`
	Priority string `json:"priority"`
}

type IdentityVerificationLog struct {
	ID                 uuid.UUID `json:"id"`
	UserID             uuid.UUID `json:"user_id"`
	CheckedBy          uuid.UUID `json:"checked_by"`
	ProviderReference  string    `json:"provider_reference"`
	VerificationStatus string    `json:"verification_status"`
	FailureReason      *string   `json:"failure_reason,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
}

type AuditLog struct {
	ID                  uuid.UUID `json:"id"`
	EntityID            uuid.UUID `json:"entity_id"`
	Action              string    `json:"action"`
	ActorID             uuid.UUID `json:"actor_id"`
	Timestamp           time.Time `json:"timestamp"`
	Changes             []byte    `json:"changes,omitempty"`
	ClassificationLevel string    `json:"classification_level"`
}
