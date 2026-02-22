#!/bin/bash
# scripts/backup_config.sh

set -euo pipefail

# Configuration
BACKUP_DIR="scripts/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="config_backup_${DATE}"
RETENTION_DAYS=7

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup Docker Compose and Env
echo "Backing up Docker and Env configs..."
cp docker-compose.yml "${BACKUP_DIR}/${BACKUP_NAME}/"
cp .env "${BACKUP_DIR}/${BACKUP_NAME}/" 2>/dev/null || echo "Warning: .env not found"

# Backup Nginx configuration
echo "Backing up Nginx configuration..."
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/nginx"
cp gateway/nginx.conf "${BACKUP_DIR}/${BACKUP_NAME}/nginx/"

# Backup database schema as a lightweight alternative to full dumps
echo "Exporting database schema..."
docker exec agri_platform-db-1 cockroach sql \
  --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  -e "SHOW CREATE ALL TABLES;" > "${BACKUP_DIR}/${BACKUP_NAME}/schema.sql"

# Compress
echo "Compressing Config backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Clean up
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

# Retention
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "✅ Configuration backup completed: ${BACKUP_NAME}.tar.gz"
