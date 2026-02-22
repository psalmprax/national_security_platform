#!/bin/bash
# scripts/backup_cockroachdb.sh

set -euo pipefail

# Configuration
BACKUP_DIR="scripts/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="national_security_${DATE}"
RETENTION_DAYS=7

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

echo "Starting full backup of defaultdb..."
# Use docker exec to trigger the backup inside the container
# Note: CockroachDB needs the backup path to be accessible to the container
# We assume the /backups directory inside the container is mapped to scripts/backups
docker exec agri_platform-db-1 cockroach backup \
  --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  "nodelocal://backups/${BACKUP_NAME}" \
  defaultdb

echo "Verifying backup..."
docker exec agri_platform-db-1 cockroach verify \
  --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  "nodelocal://backups/${BACKUP_NAME}"

# Compress for archival
echo "Compressing backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Clean up uncompressed dir
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

# Clean up old backups
echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "✅ Database backup completed successfully: ${BACKUP_NAME}.tar.gz"
