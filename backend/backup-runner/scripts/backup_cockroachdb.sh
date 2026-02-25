#!/bin/bash
# backend/backup-runner/scripts/backup_cockroachdb.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/app/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="national_security_${DATE}.sql"
RETENTION_DAYS=7

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "Starting full SQL dump of defaultdb..."
# Use cockroach dump connecting over the network
# DATABASE_URL should include necessary SSL parameters
cockroach dump \
  "${DATABASE_URL}" \
  --database=defaultdb > "${BACKUP_DIR}/${BACKUP_NAME}"

# Compress for archival
echo "Compressing backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Clean up uncompressed file
rm -f "${BACKUP_DIR}/${BACKUP_NAME}"

# Clean up old backups
echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "✅ Database backup completed successfully: ${BACKUP_NAME}.tar.gz"
