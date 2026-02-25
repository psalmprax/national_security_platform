#!/bin/bash
# backend/backup-runner/scripts/backup_minio.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/app/backups/minio"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="minio_backup_${DATE}"
MINIO_ALIAS="minio_server"
BUCKETS=("alerts-media" "user-uploads" "documents" "evidence")
RETENTION_DAYS=7

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Configure mc client
echo "Configuring MinIO client..."
mc alias set "${MINIO_ALIAS}" "${MINIO_URL}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

# Backup each bucket
for bucket in "${BUCKETS[@]}"; do
    echo "Backing up bucket: ${bucket}..."
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/${bucket}"
    
    # Use mc mirror to sync from remote to local
    mc mirror --quiet "${MINIO_ALIAS}/${bucket}" "${BACKUP_DIR}/${BACKUP_NAME}/${bucket}"
done

# Compress
echo "Compressing MinIO backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Clean up uncompressed dir
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

# Retention
echo "Cleaning up old backups..."
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "✅ MinIO backup completed: ${BACKUP_NAME}.tar.gz"
