#!/bin/bash
# backend/backup-runner/scripts/backup_config.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/app/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="config_backup_${DATE}"
RETENTION_DAYS=7

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup Docker Compose and Env (Assuming they are available in the container or we just want to track schema)
# Since we are in a container, we might not have direct access to the host's .env unless mounted.
# We will focus on the database schema export which was previously done via docker exec.

# Backup database schema as a lightweight alternative to full dumps
echo "Exporting database schema..."
# DATABASE_URL should be provided as an env var
cockroach sql \
  "${DATABASE_URL}" \
  --execute="SHOW CREATE ALL TABLES;" > "${BACKUP_DIR}/${BACKUP_NAME}/schema.sql"

# Compress
echo "Compressing Config backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Clean up
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

# Retention
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "✅ Configuration backup completed: ${BACKUP_NAME}.tar.gz"
