#!/bin/bash
# scripts/backup_minio.sh

set -euo pipefail

# Configuration
BACKUP_DIR="scripts/backups/minio"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="minio_backup_${DATE}"
MINIO_ALIAS="minio"
BUCKETS=("alerts-media" "user-uploads" "documents" "evidence")
RETENTION_DAYS=7

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup each bucket
# We use 'docker exec mc' assuming the minio/mc client is available or we use the minio container itself
for bucket in "${BUCKETS[@]}"; do
    echo "Backing up bucket: ${bucket}..."
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/${bucket}"
    
    # Using 'mc mirror' to sync to the local filesystem (mapped to the container)
    # This assumes the mc client is configured inside the container or we use a separate container
    # For simplicity in this local env, we'll try to use 'docker cp' if mc is not readily configured 
    # OR better, if the minio data dir is mapped locally, we could just copy it.
    # But to follow the plan's 'mc mirror' logic:
    docker exec agri_platform-minio-1 mc mirror \
      --quiet \
      "local/${bucket}" \
      "/backup/${BACKUP_NAME}/${bucket}"
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
