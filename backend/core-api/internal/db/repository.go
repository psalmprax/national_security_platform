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
			location_source
		) VALUES (
			$1, $2, $3, $4,
			ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8,
			$9, $10, $11, $12
		)
	`

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
		       trust_score, clearance_level, village_id, lga_id, state_id, status, password_hash, created_at
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
		&user.PasswordHash,
		&user.CreatedAt,
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
		       trust_score, clearance_level, village_id, lga_id, state_id, status, password_hash, created_at
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
		&user.PasswordHash,
		&user.CreatedAt,
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
		INSERT INTO assets (id, agency_id, name, type, location, status, description, call_sign, capacity_level, last_updated_at, created_at)
		VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8, $9, $10, $11, $12)
	`
	_, err := Pool.Exec(ctx, query, asset.ID, asset.AgencyID, asset.Name, asset.Type, asset.Longitude, asset.Latitude, asset.Status, asset.Description, asset.CallSign, asset.CapacityLevel, asset.LastUpdatedAt, asset.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create asset: %w", err)
	}
	return nil
}

// GetAllAssets retrieves all assets
func GetAllAssets(ctx context.Context) ([]models.Asset, error) {
	query := `
		SELECT id, agency_id, name, type, st_x(location), st_y(location), status, description, call_sign, capacity_level, last_updated_at, created_at
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
		err := rows.Scan(&a.ID, &a.AgencyID, &a.Name, &a.Type, &a.Longitude, &a.Latitude, &a.Status, &a.Description, &a.CallSign, &a.CapacityLevel, &a.LastUpdatedAt, &a.CreatedAt)
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
		SELECT id, agency_id, name, type, st_x(location), st_y(location), status, description, call_sign, capacity_level, last_updated_at, created_at
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
		err := rows.Scan(&a.ID, &a.AgencyID, &a.Name, &a.Type, &a.Longitude, &a.Latitude, &a.Status, &a.Description, &a.CallSign, &a.CapacityLevel, &a.LastUpdatedAt, &a.CreatedAt)
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
	// Added spatial join to resolve LGA and State names
	query := `
		SELECT 
			a.id, a.user_id, a.status, a.priority_class,
			ST_X(a.location::geometry) as longitude, 
			ST_Y(a.location::geometry) as latitude,
			a.impact_radius_meters, a.alert_type,
			a.content_text, a.content_media_url, a.severity_score, a.verification_count,
			a.created_at,
			COALESCE(l.name, 'Unknown') as lga_name,
			COALESCE(s.name, s2.name, 'Unknown') as state_name
		FROM alerts a
		LEFT JOIN lgas l ON ST_Contains(l.boundary_geom, a.location)
		LEFT JOIN states s ON s.id = l.state_id -- Optimization: Use relational link if LGA found
		LEFT JOIN states s2 ON ST_Contains(s2.boundary_geom, a.location) -- Fallback: Direct spatial lookup if LGA lookup fails
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
			&alert.VerificationCount,
			&alert.CreatedAt,
			&lgaName,
			&stateName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}

		// ABAC Filtering: Redact PII for low clearance
		// Example rule: Confidential/Secret alerts need check
		// For now, let's say if it's a "KIDNAPPING" or high severity, we redact content for lowest level
		if userScore < 3 { // Below CONFIDENTIAL
			if alert.PriorityClass == "CRITICAL" || alert.AlertType == "KIDNAPPING" {
				redacted := "[REDACTED - INSUFFICIENT CLEARANCE]"
				alert.ContentText = &redacted
				alert.UserID = uuid.Nil // Hide reporter ID
			}
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
			id, user_id, hwid, public_key, device_model, os_version, status, last_seen_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8
		)
		ON CONFLICT (hwid) DO UPDATE SET
			user_id = EXCLUDED.user_id,
			public_key = EXCLUDED.public_key,
			device_model = EXCLUDED.device_model,
			os_version = EXCLUDED.os_version,
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
		SELECT id, user_id, hwid, public_key, device_model, os_version, status, last_seen_at, created_at
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
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan device: %w", err)
		}
		devices = append(devices, d)
	}

	return devices, nil
}

// GetDeviceByHWID retrieves a device by its hardware identifier
func GetDeviceByHWID(ctx context.Context, hwid string) (*models.Device, error) {
	query := `
		SELECT id, user_id, hwid, public_key, device_model, os_version, status, last_seen_at, created_at
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
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get device: %w", err)
	}

	return &d, nil
}

// GetRecentSecurityScans retrieves recent security scans
func GetRecentSecurityScans(ctx context.Context, limit, offset int) ([]models.SecurityScan, error) {
	query := `
		SELECT id, scan_time, target_service, status, findings, meta_data
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
			a.id, a.agency_id, a.name, a.type, st_x(a.location), st_y(a.location), a.status, a.description, a.call_sign, a.capacity_level, a.last_updated_at, a.created_at,
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
			&ta.Asset.ID, &ta.Asset.AgencyID, &ta.Asset.Name, &ta.Asset.Type, &ta.Asset.Longitude, &ta.Asset.Latitude, &ta.Asset.Status, &ta.Asset.Description, &ta.Asset.CallSign, &ta.Asset.CapacityLevel, &ta.Asset.LastUpdatedAt, &ta.Asset.CreatedAt,
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
		SET status = $1, last_updated_at = current_timestamp()
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
		SELECT a.id, a.name, a.acronym, a.type, a.jurisdiction_scope, a.hq_address, a.contact_phone, a.created_at
		FROM agencies a
		JOIN agency_personnel ap ON a.id = ap.agency_id
		WHERE ap.user_id = $1 AND ap.is_active = TRUE
		LIMIT 1
	`

	var a models.Agency
	err := Pool.QueryRow(ctx, query, userID).Scan(
		&a.ID, &a.Name, &a.Acronym, &a.Type, &a.JurisdictionScope, &a.HQAddress, &a.ContactPhone, &a.CreatedAt,
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
