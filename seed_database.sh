#!/bin/bash

# Seeding script for National Security Platform CockroachDB

CONTAINER_NAME="national_security_platform-cockroachdb-1"

echo "⏳ Starting database seeding..."

# List of files in order
FILES=(
    "platform/schema/001_initial_schema.sql"
    "platform/schema/003_extended_schema.sql"
    "platform/schema/002_test_data.sql"
    "platform/schema/004_rbac_roles.sql"
    "platform/schema/005_simulation_data.sql"
    "platform/schema/006_auth_and_status.sql"
    "platform/schema/007_agency_schema.sql"
    "platform/schema/008_security_sentinel_schema.sql"
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
