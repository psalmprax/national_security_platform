#!/bin/bash

# Seeding script for National Security Platform CockroachDB

CONTAINER_NAME="national_security_platform-cockroachdb-1"

echo "⏳ Starting database seeding..."

# List of files in a strict dependency order
FILES=(
    "platform/schema/001_initial_schema.sql"           # Users, Alerts
    "platform/schema/003_extended_schema.sql"          # States, LGAs, Devices, Media
    "platform/schema/007_agency_schema.sql"            # Agencies, Assets, Agency Personnel
    "platform/schema/008_security_sentinel_schema.sql" # Security Scans
    "platform/schema/009_spatial_tuning.sql"           # Spatial indices
    "platform/schema/012_location_source.sql"          # Alerts location source
    "platform/schema/016_add_updated_at.sql"           # Add updated_at column to alerts
    "platform/schema/004_rbac_roles.sql"               # RBAC test users (deletes from agency_personnel)
    "platform/schema/002_test_data.sql"                # Traditional rulers
    "platform/schema/010_test_agencies.sql"            # Real agency data
    "platform/schema/011_seed_agency_personnel.sql"    # Linking users to agencies
    "platform/schema/006_auth_and_status.sql"          # Users auth fields (MUST RUN AFTER USER CREATION)
    "platform/schema/005_simulation_data.sql"          # Scenario-specific alerts
    "platform/schema/013_real_seeding_data.sql"        # REAL Nigerian location data
    "platform/schema/014_national_coverage.sql"        # National Coverage (37 States + FCT)
    "platform/schema/015_procedural_fill.sql"          # Procedural Villages for Load Testing
    "platform/schema/017_classified_alerts.sql"        # Classified/Redacted test alerts
    "platform/schema/018_mission_schema.sql"           # Mission schema
    "platform/schema/019_lga_centroids.sql"            # LGA Centroids
    "platform/schema/020_public_alerts.sql"            # Public Alerts
    "platform/schema/021_safety_scores.sql"            # Safety Scores
    "platform/schema/022_anonymous_tips.sql"           # Anonymous Tips
    "platform/schema/023_advanced_features.sql"        # Advanced Features
    "platform/schema/024_add_updated_at_timestamps.sql" # Add updated_at columns and auto-update triggers
    "platform/schema/025_standardize_all_remaining_timestamps.sql" # Standardize all remaining timestamps
    "platform/schema/026_notification_support.sql" # Notification and spatial tracking support
    "platform/schema/027_dynamic_access_control.sql" # Dynamic Access Control
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📄 Applying $file..."
        docker exec -i "$CONTAINER_NAME" ./cockroach sql --insecure --database=defaultdb < "$file"
    else
        echo "⚠️ Warning: $file not found!"
    fi
done

echo "✅ Database seeding complete!"
