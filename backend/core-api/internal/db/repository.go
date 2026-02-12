package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"national_security_platform/backend/core-api/internal/models"

	"github.com/google/uuid"
)

// CreateAlert inserts a new alert into the database
func CreateAlert(ctx context.Context, alert *models.Alert) error {
	query := `
		INSERT INTO alerts (
			id, user_id, status, priority_class, 
			location, impact_radius_meters, alert_type,
			content_text, content_media_url, verification_count,
			location_source, classification_level
		) VALUES (
			$1, $2, $3, $4,
			ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8,
			$9, $10, $11, $12, $13
		)
	`

	if alert.ClassificationLevel == "" {
		alert.ClassificationLevel = "UNCLASSIFIED"
	}

	_, err := Pool.Exec(ctx, query,
		alert.ID,
		alert.UserID,
		alert.Status,
		alert.PriorityClass,
		alert.Longitude,
		alert.Latitude,
		alert.ImpactRadiusMeters,
		alert.AlertType,
		alert.ContentText,
		alert.ContentMediaURL,
		alert.VerificationCount,
		alert.LocationSource,
		alert.ClassificationLevel,
	)

	if err != nil {
		return fmt.Errorf("failed to create alert: %w", err)
	}

	return nil
}

// GetUserByID retrieves a user by their ID
func GetUserByID(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, phone_number, full_name, nin, role, 
		       monarch_grade, domain_territory, hierarchy_weight,
		       trust_score, clearance_level, village_id, lga_id, state_id, status, 
		       nin_verified, nin_verification_date, identity_provider, biometric_enrolled, identity_notes,
		       password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user models.User
	err := Pool.QueryRow(ctx, query, userID).Scan(
		&user.ID,
		&user.PhoneNumber,
		&user.FullName,
		&user.NIN,
		&user.Role,
		&user.MonarchGrade,
		&user.DomainTerritory,
		&user.HierarchyWeight,
		&user.TrustScore,
		&user.ClearanceLevel,
		&user.VillageID,
		&user.LGAID,
		&user.StateID,
		&user.Status,
		&user.NINVerified,
		&user.NINVerificationDate,
		&user.IdentityProvider,
		&user.BiometricEnrolled,
		&user.IdentityNotes,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetUserByPhoneNumber retrieves a user by their phone number
func GetUserByPhoneNumber(ctx context.Context, phoneNumber string) (*models.User, error) {
	query := `
		SELECT id, phone_number, full_name, nin, role, 
		       monarch_grade, domain_territory, hierarchy_weight,
		       trust_score, clearance_level, village_id, lga_id, state_id, status, 
		       nin_verified, nin_verification_date, identity_provider, biometric_enrolled, identity_notes,
		       password_hash, created_at, updated_at
		FROM users
		WHERE phone_number = $1
	`

	var user models.User
	err := Pool.QueryRow(ctx, query, phoneNumber).Scan(
		&user.ID,
		&user.PhoneNumber,
		&user.FullName,
		&user.NIN,
		&user.Role,
		&user.MonarchGrade,
		&user.DomainTerritory,
		&user.HierarchyWeight,
		&user.TrustScore,
		&user.ClearanceLevel,
		&user.VillageID,
		&user.LGAID,
		&user.StateID,
		&user.Status,
		&user.NINVerified,
		&user.NINVerificationDate,
		&user.IdentityProvider,
		&user.BiometricEnrolled,
		&user.IdentityNotes,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get user by phone: %w", err)
	}

	return &user, nil
}

// CreateAuditLog inserts a new audit log entry
func CreateAuditLog(ctx context.Context, entityID uuid.UUID, action string, actorID uuid.UUID, changes []byte, classification string) error {
	query := `
		INSERT INTO audit_logs (
			id, entity_id, action, actor_id, timestamp, changes, classification_level
		) VALUES (
			$1, $2, $3, $4, current_timestamp(), $5, $6
		)
	`

	_, err := Pool.Exec(ctx, query,
		uuid.New(),
		entityID,
		action,
		actorID,
		changes,
		classification,
	)

	if err != nil {
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	return nil
}

// GetAuditLogs retrieves a list of audit logs with pagination
func GetAuditLogs(ctx context.Context, limit, offset int) ([]models.AuditLog, error) {
	query := `
		SELECT id, entity_id, action, actor_id, timestamp, changes, classification_level
		FROM audit_logs
		ORDER BY timestamp DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := Pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query audit logs: %w", err)
	}
	defer rows.Close()

	var logs []models.AuditLog
	for rows.Next() {
		var l models.AuditLog
		err := rows.Scan(
			&l.ID,
			&l.EntityID,
			&l.Action,
			&l.ActorID,
			&l.Timestamp,
			&l.Changes,
			&l.ClassificationLevel,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}
		logs = append(logs, l)
	}

	return logs, nil
}

// CreateUserRequest creates a new user in PENDING status
func CreateUserRequest(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (
			id, phone_number, email, full_name, nin, role, monarch_grade, domain_territory, status, password_hash, trust_score, clearance_level, state_id, lga_id
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		)
	`

	_, err := Pool.Exec(ctx, query,
		user.ID,
		user.PhoneNumber,
		user.Email,
		user.FullName,
		user.NIN,
		user.Role,
		user.MonarchGrade,
		user.DomainTerritory,
		user.Status,
		user.PasswordHash,
		user.TrustScore,
		user.ClearanceLevel,
		user.StateID,
		user.LGAID,
	)

	if err != nil {
		return fmt.Errorf("failed to create user request: %w", err)
	}

	return nil
}

// CreateAgency inserts a new agency
func CreateAgency(ctx context.Context, agency models.Agency) error {
	query := `
		INSERT INTO agencies (id, name, acronym, type, jurisdiction_scope, hq_address, contact_phone, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := Pool.Exec(ctx, query, agency.ID, agency.Name, agency.Acronym, agency.Type, agency.JurisdictionScope, agency.HQAddress, agency.ContactPhone, agency.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create agency: %w", err)
	}
	return nil
}

// CreateAsset inserts a new asset
func CreateAsset(ctx context.Context, asset models.Asset) error {
	query := `
		INSERT INTO assets (id, agency_id, name, type, location, status, description, call_sign, capacity_level, updated_at, created_at)
		VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10, $11, $12)
	`
	_, err := Pool.Exec(ctx, query, asset.ID, asset.AgencyID, asset.Name, asset.Type, asset.Longitude, asset.Latitude, asset.Status, asset.Description, asset.CallSign, asset.CapacityLevel, asset.UpdatedAt, asset.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create asset: %w", err)
	}
	return nil
}

// GetAllAssets retrieves all assets
func GetAllAssets(ctx context.Context) ([]models.Asset, error) {
	query := `
		SELECT id, agency_id, name, type, st_x(location), st_y(location), status, description, call_sign, capacity_level, updated_at, created_at
		FROM assets
	`
	rows, err := Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query assets: %w", err)
	}
	defer rows.Close()

	var assets []models.Asset
	for rows.Next() {
		var a models.Asset
		err := rows.Scan(&a.ID, &a.AgencyID, &a.Name, &a.Type, &a.Longitude, &a.Latitude, &a.Status, &a.Description, &a.CallSign, &a.CapacityLevel, &a.UpdatedAt, &a.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan asset: %w", err)
		}
		assets = append(assets, a)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating assets: %w", err)
	}
	return assets, nil
}

// GetAssetsByAgency retrieves all assets for a specific agency
func GetAssetsByAgency(ctx context.Context, agencyID uuid.UUID) ([]models.Asset, error) {
	query := `
		SELECT id, agency_id, name, type, st_x(location), st_y(location), status, description, call_sign, capacity_level, updated_at, created_at
		FROM assets
		WHERE agency_id = $1
	`
	rows, err := Pool.Query(ctx, query, agencyID)
	if err != nil {
		return nil, fmt.Errorf("failed to query agency assets: %w", err)
	}
	defer rows.Close()

	var assets []models.Asset
	for rows.Next() {
		var a models.Asset
		err := rows.Scan(&a.ID, &a.AgencyID, &a.Name, &a.Type, &a.Longitude, &a.Latitude, &a.Status, &a.Description, &a.CallSign, &a.CapacityLevel, &a.UpdatedAt, &a.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan asset: %w", err)
		}
		assets = append(assets, a)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating agency assets: %w", err)
	}
	return assets, nil
}

// GetRecentAlerts retrieves the most recent alerts with a limit, filtering based on clearance
func GetRecentAlerts(ctx context.Context, limit int, clearanceLevel string) ([]models.Alert, error) {
	// Hybrid spatial resolution strategy:
	// 1. Try boundary-based LGA resolution (ST_Contains)
	// 2. Fallback to nearest-neighbor using LGA centroids
	// 3. Always resolve state via boundary or fallback
	query := `
		SELECT 
			a.id, a.user_id, a.status, a.priority_class,
			ST_X(a.location::geometry) as longitude, 
			ST_Y(a.location::geometry) as latitude,
			a.impact_radius_meters, a.alert_type,
			a.content_text, a.content_media_url, a.severity_score, a.risk_keywords, a.verification_count,
			a.created_at, a.updated_at, a.classification_level,
			-- Hybrid LGA resolution: boundary match OR nearest centroid
			COALESCE(
				l_boundary.name,  -- Try boundary containment first
				(
					SELECT l_nearest.name 
					FROM lgas l_nearest 
					WHERE l_nearest.centroid IS NOT NULL
					ORDER BY ST_Distance(l_nearest.centroid, a.location)
					LIMIT 1
				),
				'Unknown'
			) as lga_name,
			-- State resolution with fallback
			COALESCE(
				s.name,  -- From LGA boundary match
				s2.name, -- From direct state containment
				(
					SELECT s_nearest.name 
					FROM states s_nearest 
					WHERE s_nearest.boundary_geom IS NOT NULL
					ORDER BY ST_Distance(s_nearest.boundary_geom, a.location)
					LIMIT 1
				),
				'Unknown'
			) as state_name
		FROM alerts a
		LEFT JOIN lgas l_boundary ON ST_Contains(l_boundary.boundary_geom, a.location)
		LEFT JOIN states s ON s.id = l_boundary.state_id
		LEFT JOIN states s2 ON ST_Contains(s2.boundary_geom, a.location)
		ORDER BY a.created_at DESC
		LIMIT $1
	`

	rows, err := Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.Alert
	// Define simple hierarchy check (duplicated from middleware for now to avoid circular imports or complexity)
	levelScores := map[string]int{
		"UNCLASSIFIED": 1,
		"RESTRICTED":   2,
		"CONFIDENTIAL": 3,
		"SECRET":       4,
		"TOP_SECRET":   5,
	}
	userScore := levelScores[clearanceLevel]
	if userScore == 0 {
		userScore = 1 // Default to lowest
	}

	for rows.Next() {
		var alert models.Alert
		var lgaName, stateName string

		err := rows.Scan(
			&alert.ID,
			&alert.UserID,
			&alert.Status,
			&alert.PriorityClass,
			&alert.Longitude,
			&alert.Latitude,
			&alert.ImpactRadiusMeters,
			&alert.AlertType,
			&alert.ContentText,
			&alert.ContentMediaURL,
			&alert.SeverityScore,
			&alert.RiskKeywords,
			&alert.VerificationCount,
			&alert.CreatedAt,
			&alert.UpdatedAt,
			&alert.ClassificationLevel,
			&lgaName,
			&stateName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}

		// Dynamic ABAC Filtering: Redact if user clearance is lower than alert classification
		alertScore := levelScores[alert.ClassificationLevel]
		if alertScore == 0 {
			alertScore = 1 // Default to lowest
		}

		if userScore < alertScore {
			redacted := "[REDACTED - INSUFFICIENT CLEARANCE]"
			alert.ContentText = &redacted
			alert.UserID = uuid.Nil // Hide reporter ID
		}

		// Set the resolved location
		alert.LGAName = &lgaName
		alert.StateName = &stateName

		alerts = append(alerts, alert)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating alerts: %w", err)
	}

	return alerts, nil
}

// GetSystemStats retrieves high-level system statistics
func GetSystemStats(ctx context.Context) (*models.SystemStats, error) {
	stats := &models.SystemStats{}

	// Count total users
	err := Pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&stats.TotalUsers)
	if err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}

	// Count active alerts (last 24h)
	err = Pool.QueryRow(ctx, "SELECT COUNT(*) FROM alerts WHERE created_at > NOW() - INTERVAL '24 hours'").Scan(&stats.ActiveAlerts)
	if err != nil {
		return nil, fmt.Errorf("failed to count active alerts: %w", err)
	}

	// Count critical alerts (last 24h)
	err = Pool.QueryRow(ctx, "SELECT COUNT(*) FROM alerts WHERE priority_class = 'CRITICAL' AND created_at > NOW() - INTERVAL '24 hours'").Scan(&stats.CriticalAlerts)
	if err != nil {
		return nil, fmt.Errorf("failed to count critical alerts: %w", err)
	}

	return stats, nil
}

// RegisterDevice inserts a new device binding or updates an existing one
func RegisterDevice(ctx context.Context, device *models.Device) error {
	query := `
		INSERT INTO devices (
			id, user_id, hwid, public_key, device_model, os_version, fcm_token, status, last_seen_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
		)
		ON CONFLICT (hwid) DO UPDATE SET
			user_id = EXCLUDED.user_id,
			public_key = EXCLUDED.public_key,
			device_model = EXCLUDED.device_model,
			os_version = EXCLUDED.os_version,
			fcm_token = EXCLUDED.fcm_token,
			status = EXCLUDED.status,
			last_seen_at = EXCLUDED.last_seen_at
	`

	_, err := Pool.Exec(ctx, query,
		device.ID,
		device.UserID,
		device.HWID,
		device.PublicKey,
		device.DeviceModel,
		device.OSVersion,
		device.FCMToken,
		device.Status,
		device.LastSeenAt,
	)

	if err != nil {
		return fmt.Errorf("failed to register device: %w", err)
	}

	return nil
}

// GetAllDevices retrieves all registered devices
func GetAllDevices(ctx context.Context) ([]models.Device, error) {
	query := `
		SELECT id, user_id, hwid, public_key, device_model, os_version, status, last_seen_at, created_at, updated_at
		FROM devices
		ORDER BY created_at DESC
	`

	rows, err := Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query devices: %w", err)
	}
	defer rows.Close()

	var devices []models.Device
	for rows.Next() {
		var d models.Device
		err := rows.Scan(
			&d.ID,
			&d.UserID,
			&d.HWID,
			&d.PublicKey,
			&d.DeviceModel,
			&d.OSVersion,
			&d.Status,
			&d.LastSeenAt,
			&d.CreatedAt,
			&d.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan device: %w", err)
		}
		devices = append(devices, d)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating devices: %w", err)
	}

	return devices, nil
}

// GetDeviceByHWID retrieves a device by its hardware identifier
func GetDeviceByHWID(ctx context.Context, hwid string) (*models.Device, error) {
	query := `
		SELECT id, user_id, hwid, public_key, device_model, os_version, status, last_seen_at, created_at, updated_at
		FROM devices
		WHERE hwid = $1
	`

	var d models.Device
	err := Pool.QueryRow(ctx, query, hwid).Scan(
		&d.ID,
		&d.UserID,
		&d.HWID,
		&d.PublicKey,
		&d.DeviceModel,
		&d.OSVersion,
		&d.Status,
		&d.LastSeenAt,
		&d.CreatedAt,
		&d.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get device: %w", err)
	}

	return &d, nil
}

// GetRecentSecurityScans retrieves recent security scans
func GetRecentSecurityScans(ctx context.Context, limit, offset int) ([]models.SecurityScan, error) {
	query := `
		SELECT id, scan_time, target_service, status, findings, meta_data, created_at, updated_at
		FROM security_scans
		ORDER BY scan_time DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := Pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query security scans: %w", err)
	}
	defer rows.Close()

	var scans []models.SecurityScan
	for rows.Next() {
		var s models.SecurityScan
		err := rows.Scan(
			&s.ID,
			&s.ScanTime,
			&s.TargetService,
			&s.Status,
			&s.Findings,
			&s.MetaData,
			&s.CreatedAt,
			&s.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan security scan: %w", err)
		}
		scans = append(scans, s)
	}

	return scans, nil
}

// GetTriangulatedAssets finds suitable response teams for a specific alert
func GetTriangulatedAssets(ctx context.Context, alertID uuid.UUID) ([]models.TriangulatedAsset, error) {
	cacheKey := fmt.Sprintf("alert:%s:triangulation", alertID)

	// Check Redis Cache
	if RedisClient != nil {
		val, err := RedisClient.Get(ctx, cacheKey).Result()
		if err == nil {
			var cachedResults []models.TriangulatedAsset
			if err := json.Unmarshal([]byte(val), &cachedResults); err == nil {
				// Cache Hit
				return cachedResults, nil
			}
		}
	}

	// Cache Miss: Perform DB Query
	// First, find the alert's location and the state it's in
	query := `
		WITH alert_loc AS (
			SELECT location FROM alerts WHERE id = $1
		),
		target_state AS (
			SELECT id FROM states, alert_loc WHERE ST_Contains(states.boundary_geom, alert_loc.location) LIMIT 1
		)
		SELECT 
			a.id, a.agency_id, a.name, a.type, st_x(a.location), st_y(a.location), a.status, a.description, a.call_sign, a.capacity_level, a.updated_at, a.created_at,
			ST_Distance(a.location::geography, al.location::geography) as distance_meters,
			((a.capacity_level::float8 * 0.5) + (GREATEST(0.0, (1.0 - ST_Distance(a.location::geography, al.location::geography) / 50000.0)) * 50.0))::float8 as suitability_score
		FROM assets a
		JOIN alert_loc al ON true
		LEFT JOIN states s ON ST_Contains(s.boundary_geom, a.location)
		WHERE a.status = 'ACTIVE'
		AND (s.id = (SELECT id FROM target_state) OR ST_DWithin(a.location::geography, al.location::geography, 50000))
		ORDER BY suitability_score DESC
		LIMIT 5
	`

	rows, err := Pool.Query(ctx, query, alertID)
	if err != nil {
		return nil, fmt.Errorf("failed to query triangulated assets: %w", err)
	}
	defer rows.Close()

	var results []models.TriangulatedAsset
	for rows.Next() {
		var ta models.TriangulatedAsset
		err := rows.Scan(
			&ta.Asset.ID, &ta.Asset.AgencyID, &ta.Asset.Name, &ta.Asset.Type, &ta.Asset.Longitude, &ta.Asset.Latitude, &ta.Asset.Status, &ta.Asset.Description, &ta.Asset.CallSign, &ta.Asset.CapacityLevel, &ta.Asset.UpdatedAt, &ta.Asset.CreatedAt,
			&ta.DistanceMeters,
			&ta.SuitabilityScore,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan triangulated asset: %w", err)
		}
		results = append(results, ta)
	}

	// Update Redis Cache (Async)
	if RedisClient != nil && len(results) > 0 {
		go func() {
			data, err := json.Marshal(results)
			if err == nil {
				RedisClient.Set(context.Background(), cacheKey, data, 30*time.Second)
			}
		}()
	}

	return results, nil
}

// UpdateAssetStatus updates the status of an asset and logs the change
func UpdateAssetStatus(ctx context.Context, assetID uuid.UUID, newStatus string) error {
	query := `
		UPDATE assets 
		SET status = $1, updated_at = current_timestamp()
		WHERE id = $2
	`

	result, err := Pool.Exec(ctx, query, newStatus, assetID)
	if err != nil {
		return fmt.Errorf("failed to update asset status: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("asset not found")
	}

	return nil
}

// AddAgencyPersonnel links a user to an agency
func AddAgencyPersonnel(ctx context.Context, userID, agencyID uuid.UUID, rank, role, badgeNumber string) error {
	query := `
		INSERT INTO agency_personnel (user_id, agency_id, rank, role, badge_number)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, agency_id) DO UPDATE SET
			rank = EXCLUDED.rank,
			role = EXCLUDED.role,
			badge_number = EXCLUDED.badge_number
	`
	_, err := Pool.Exec(ctx, query, userID, agencyID, rank, role, badgeNumber)
	if err != nil {
		return fmt.Errorf("failed to add agency personnel: %w", err)
	}
	return nil
}
func GetUserAgencyInfo(ctx context.Context, userID uuid.UUID) (*models.Agency, error) {
	query := `
		SELECT a.id, a.name, a.acronym, a.type, a.jurisdiction_scope, a.hq_address, a.contact_phone, a.created_at, a.updated_at
		FROM agencies a
		JOIN agency_personnel ap ON a.id = ap.agency_id
		WHERE ap.user_id = $1 AND ap.is_active = TRUE
		LIMIT 1
	`

	var a models.Agency
	err := Pool.QueryRow(ctx, query, userID).Scan(
		&a.ID, &a.Name, &a.Acronym, &a.Type, &a.JurisdictionScope, &a.HQAddress, &a.ContactPhone, &a.CreatedAt, &a.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get user agency: %w", err)
	}

	return &a, nil
}

// GetVillageLocation retrieves the coordinates of a village
func GetVillageLocation(ctx context.Context, villageID uuid.UUID) (float64, float64, error) {
	query := `
		SELECT st_x(location), st_y(location)
		FROM villages
		WHERE id = $1
	`
	var lon, lat float64
	err := Pool.QueryRow(ctx, query, villageID).Scan(&lon, &lat)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to get village location: %w", err)
	}
	return lat, lon, nil
}

// VerifyAlert increments the verification count of an alert
func VerifyAlert(ctx context.Context, alertID uuid.UUID) error {
	query := `
		UPDATE alerts 
		SET verification_count = verification_count + 1, updated_at = current_timestamp()
		WHERE id = $1
	`
	result, err := Pool.Exec(ctx, query, alertID)
	if err != nil {
		return fmt.Errorf("failed to verify alert: %w", err)
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("alert not found")
	}

	return nil
}

// CreateMission inserts a new mission record
func CreateMission(ctx context.Context, mission *models.Mission) error {
	query := `
		INSERT INTO missions (
			id, alert_id, asset_id, commander_id, status, priority, eta_minutes, dispatch_time
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := Pool.Exec(ctx, query,
		mission.ID, mission.AlertID, mission.AssetID, mission.CommanderID,
		mission.Status, mission.Priority, mission.ETAMinutes, mission.DispatchTime,
	)
	if err != nil {
		return fmt.Errorf("failed to create mission: %w", err)
	}
	return nil
}

// GetActiveMissions retrieves all missions that are not completed or aborted
func GetActiveMissions(ctx context.Context) ([]models.Mission, error) {
	query := `
		SELECT id, alert_id, asset_id, commander_id, status, priority, eta_minutes, dispatch_time, arrival_time, completion_time, created_at, updated_at
		FROM missions
		WHERE status NOT IN ('COMPLETED', 'ABORTED')
		ORDER BY created_at DESC
	`
	rows, err := Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active missions: %w", err)
	}
	defer rows.Close()

	var missions []models.Mission
	for rows.Next() {
		var m models.Mission
		err := rows.Scan(
			&m.ID, &m.AlertID, &m.AssetID, &m.CommanderID, &m.Status, &m.Priority,
			&m.ETAMinutes, &m.DispatchTime, &m.ArrivalTime, &m.CompletionTime,
			&m.CreatedAt, &m.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan mission: %w", err)
		}
		missions = append(missions, m)
	}
	return missions, nil
}

// UpdateMissionStatus updates the status of a mission and its related timestamps
func UpdateMissionStatus(ctx context.Context, missionID uuid.UUID, status string) error {
	var query string
	switch status {
	case "ON_SITE":
		query = "UPDATE missions SET status = $1, arrival_time = current_timestamp(), updated_at = current_timestamp() WHERE id = $2"
	case "COMPLETED", "ABORTED":
		query = "UPDATE missions SET status = $1, completion_time = current_timestamp(), updated_at = current_timestamp() WHERE id = $2"
	default:
		query = "UPDATE missions SET status = $1, updated_at = current_timestamp() WHERE id = $2"
	}

	_, err := Pool.Exec(ctx, query, status, missionID)
	if err != nil {
		return fmt.Errorf("failed to update mission status: %w", err)
	}
	return nil
}

// UpdateUserLocation updates the last known location of a user
func UpdateUserLocation(ctx context.Context, userID uuid.UUID, lat, lon float64) error {
	query := `
		UPDATE users 
		SET last_known_location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
		    updated_at = current_timestamp()
		WHERE id = $3
	`
	_, err := Pool.Exec(ctx, query, lon, lat, userID)
	return err
}

// UpdateDeviceFCMToken updates the FCM token for a device
func UpdateDeviceFCMToken(ctx context.Context, userID uuid.UUID, token string) error {
	query := `
		UPDATE devices 
		SET fcm_token = $1, updated_at = current_timestamp()
		WHERE user_id = $2
		ORDER BY last_seen_at DESC
		LIMIT 1
	`
	_, err := Pool.Exec(ctx, query, token, userID)
	return err
}

// UpdateUserClearance updates a user's clearance level
func UpdateUserClearance(ctx context.Context, userID uuid.UUID, level string) error {
	query := `UPDATE users SET clearance_level = $1, updated_at = current_timestamp() WHERE id = $2`
	_, err := Pool.Exec(ctx, query, level, userID)
	return err
}

// UpdateAlertClassification updates an alert's classification level
func UpdateAlertClassification(ctx context.Context, alertID uuid.UUID, level string) error {
	query := `UPDATE alerts SET classification_level = $1, updated_at = current_timestamp() WHERE id = $2`
	_, err := Pool.Exec(ctx, query, level, alertID)
	return err
}

// GetAllUsers retrieves all users for administrative management
func GetAllUsers(ctx context.Context) ([]models.User, error) {
	query := `
		SELECT id, phone_number, full_name, nin, role, 
		       monarch_grade, domain_territory, hierarchy_weight,
		       trust_score, clearance_level, village_id, lga_id, state_id, status, 
		       nin_verified, nin_verification_date, identity_provider, biometric_enrolled, identity_notes,
		       created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`

	rows, err := Pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID,
			&user.PhoneNumber,
			&user.FullName,
			&user.NIN,
			&user.Role,
			&user.MonarchGrade,
			&user.DomainTerritory,
			&user.HierarchyWeight,
			&user.TrustScore,
			&user.ClearanceLevel,
			&user.VillageID,
			&user.LGAID,
			&user.StateID,
			&user.Status,
			&user.NINVerified,
			&user.NINVerificationDate,
			&user.IdentityProvider,
			&user.BiometricEnrolled,
			&user.IdentityNotes,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}
	return users, nil
}

// UpdateUserIdentityStatus updates the NIMC/NIN verification status for a user
func UpdateUserIdentityStatus(ctx context.Context, userID uuid.UUID, verified bool, provider string, providerRef string) error {
	query := `
		UPDATE users 
		SET nin_verified = $1, 
		    nin_verification_date = current_timestamp(),
		    identity_provider = $2,
		    identity_notes = $3,
		    trust_score = CASE WHEN $1 = TRUE THEN LEAST(1.0, trust_score + 0.3) ELSE trust_score END,
		    updated_at = current_timestamp()
		WHERE id = $4
	`
	notes := fmt.Sprintf("Verified via %s (Ref: %s)", provider, providerRef)
	_, err := Pool.Exec(ctx, query, verified, provider, notes, userID)
	return err
}

// CreateIdentityVerificationLog records a verification attempt in the audit trail
func CreateIdentityVerificationLog(ctx context.Context, log *models.IdentityVerificationLog) error {
	query := `
		INSERT INTO identity_verification_logs (
			id, user_id, checked_by, provider_reference, verification_status, failure_reason, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, current_timestamp())
	`
	_, err := Pool.Exec(ctx, query,
		log.ID, log.UserID, log.CheckedBy, log.ProviderReference,
		log.VerificationStatus, log.FailureReason,
	)
	return err
}
