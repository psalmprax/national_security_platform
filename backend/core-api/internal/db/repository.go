package db

import (
	"context"
	"fmt"

	"national_security_platform/backend/core-api/internal/models"

	"github.com/google/uuid"
)

// CreateAlert inserts a new alert into the database
func CreateAlert(ctx context.Context, alert *models.Alert) error {
	query := `
		INSERT INTO alerts (
			id, user_id, status, priority_class, 
			location, impact_radius_meters, alert_type,
			content_text, content_media_url, verification_count
		) VALUES (
			$1, $2, $3, $4,
			ST_SetSRID(ST_MakePoint($5, $6), 4326), $7, $8,
			$9, $10, $11
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
			id, phone_number, full_name, role, status, password_hash, trust_score, clearance_level
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8
		)
	`

	_, err := Pool.Exec(ctx, query,
		user.ID,
		user.PhoneNumber,
		user.FullName,
		user.Role,
		user.Status,
		user.PasswordHash,
		user.TrustScore,
		user.ClearanceLevel,
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

// GetRecentAlerts retrieves the most recent alerts with a limit
func GetRecentAlerts(ctx context.Context, limit int) ([]models.Alert, error) {
	query := `
		SELECT id, user_id, status, priority_class,
		       ST_X(location::geometry) as longitude, 
		       ST_Y(location::geometry) as latitude,
		       impact_radius_meters, alert_type,
		       content_text, content_media_url, verification_count,
		       created_at
		FROM alerts
		ORDER BY created_at DESC
		LIMIT $1
	`

	rows, err := Pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var alert models.Alert
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
			&alert.VerificationCount,
			&alert.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}
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
func GetRecentSecurityScans(ctx context.Context, limit int) ([]models.SecurityScan, error) {
	query := `
		SELECT id, scan_time, target_service, status, findings, meta_data
		FROM security_scans
		ORDER BY scan_time DESC
		LIMIT $1
	`

	rows, err := Pool.Query(ctx, query, limit)
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
