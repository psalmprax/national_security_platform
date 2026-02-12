# Backup and Disaster Recovery Implementation Plan

## 1. Backup Strategy Overview

### Backup Types
- **Full Backups**: Complete database dumps (daily)
- **Incremental Backups**: Transaction log backups (hourly)
- **Configuration Backups**: Application and system configs (weekly)
- **Media Backups**: User-uploaded content (real-time sync)

### Backup Storage
- **Local Storage**: Fast recovery for recent backups
- **Regional Storage**: AWS S3 West Africa (Cape Town)
- **National Storage**: Multiple Nigerian data centers
- **Air-gapped Storage**: Offline backup for critical data

## 2. Database Backup Implementation

### CockroachDB Backup Scripts
```bash
#!/bin/bash
# scripts/backup_cockroachdb.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="national_security_${DATE}"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Full backup
echo "Starting full backup..."
docker exec cockroachdb cockroach backup \
  --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  "nodelocal://backups/${BACKUP_NAME}/full" \
  defaultdb

# Incremental backup (if this isn't the first backup of the day)
LATEST_BACKUP=$(find "${BACKUP_DIR}" -maxdepth 1 -type d -name "national_security_*" | sort | tail -n 1)
if [ -n "$LATEST_BACKUP" ] && [ "$(date -d "$LATEST_BACKUP" +%Y%m%d)" = "$(date +%Y%m%d)" ]; then
    echo "Starting incremental backup..."
    docker exec cockroachdb cockroach backup \
      --insecure \
      --host=localhost \
      --port=26257 \
      --user=root \
      "nodelocal://backups/${BACKUP_NAME}/incremental" \
      --incremental-from="nodelocal://backups/$(basename $LATEST_BACKUP)/full" \
      defaultdb
fi

# Verify backup
echo "Verifying backup..."
docker exec cockroachdb cockroach verify \
  --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  "nodelocal://backups/${BACKUP_NAME}/full"

# Compress and upload to cloud storage
echo "Uploading to cloud storage..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Upload to multiple regions
upload_to_s3() {
    local bucket=$1
    local region=$2
    
    aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
      "s3://${bucket}/database/${BACKUP_NAME}.tar.gz" \
      --region "${region}" \
      --storage-class GLACIER_IR
    
    echo "Uploaded to ${bucket} (${region})"
}

# Upload to different regions
upload_to_s3 "national-security-backups-africa" "af-south-1"
upload_to_s3 "national-security-backups-europe" "eu-west-1"
upload_to_s3 "national-security-backups-us" "us-east-1"

# Clean up local files
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"
rm -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Clean up old backups
echo "Cleaning up old backups..."
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed successfully: ${BACKUP_NAME}"
```

### Point-in-Time Recovery
```bash
#!/bin/bash
# scripts/restore_cockroachdb.sh

set -euo pipefail

# Configuration
BACKUP_NAME=$1
RESTORE_TIME=$2  # Format: "2024-02-08 14:30:00"
BACKUP_DIR="/backups/database"

if [ -z "$BACKUP_NAME" ] || [ -z "$RESTORE_TIME" ]; then
    echo "Usage: $0 <backup_name> <restore_time>"
    echo "Example: $0 national_security_20240208_143000 '2024-02-08 14:30:00'"
    exit 1
fi

# Download backup from cloud storage
echo "Downloading backup..."
aws s3 cp "s3://national-security-backups-africa/database/${BACKUP_NAME}.tar.gz" \
  "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
  --region af-south-1

# Extract backup
echo "Extracting backup..."
tar -xzf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}"

# Stop applications
echo "Stopping applications..."
docker-compose stop core-api intelligence-service web-dashboard mobile-client

# Restore database
echo "Restoring database..."
docker exec cockroachdb cockroach restore \
  --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  "nodelocal://backups/${BACKUP_NAME}/full" \
  --restore-to="${RESTORE_TIME}" \
  defaultdb

# Verify restore
echo "Verifying restore..."
docker exec cockroachdb cockroach sql --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  -e "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM alerts;"

# Start applications
echo "Starting applications..."
docker-compose start core-api intelligence-service web-dashboard mobile-client

# Clean up
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"
rm -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

echo "Restore completed successfully"
```

## 3. Media Backup Implementation

### MinIO Backup Script
```bash
#!/bin/bash
# scripts/backup_minio.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/backups/minio"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="minio_backup_${DATE}"
MINIO_ALIAS="minio"
BUCKETS=("alerts-media" "user-uploads" "documents" "evidence")

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup each bucket
for bucket in "${BUCKETS[@]}"; do
    echo "Backing up bucket: ${bucket}"
    
    # Create bucket directory
    mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}/${bucket}"
    
    # Sync bucket to local backup
    docker exec minio mc mirror "${MINIO_ALIAS}/${bucket}" \
      "/backup/${BACKUP_NAME}/${bucket}"
    
    # Create checksum file
    docker exec minio mc find "${MINIO_ALIAS}/${bucket}" \
      --exec "md5sum {}" > "${BACKUP_DIR}/${BACKUP_NAME}/${bucket}_checksums.txt"
done

# Create backup manifest
cat > "${BACKUP_DIR}/${BACKUP_NAME}/manifest.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "backup_name": "${BACKUP_NAME}",
  "buckets": [$(printf '"%s",' "${BUCKETS[@]}" | sed 's/,$//')],
  "total_objects": $(docker exec minio mc ls --recursive "${MINIO_ALIAS}" | wc -l),
  "total_size": "$(docker exec minio mc du --human-readable "${MINIO_ALIAS}" | tail -n1 | awk '{print $1}')"
}
EOF

# Compress and encrypt backup
echo "Compressing and encrypting backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Encrypt with GPG
gpg --symmetric --cipher-algo AES256 --compress-algo 1 \
  --output "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz.gpg" \
  "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Remove unencrypted backup
rm -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

# Upload to cloud storage
echo "Uploading to cloud storage..."
aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz.gpg" \
  "s3://national-security-backups-africa/media/${BACKUP_NAME}.tar.gz.gpg" \
  --region af-south-1 \
  --storage-class DEEP_ARCHIVE

# Clean up local files
rm -f "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz.gpg"

echo "MinIO backup completed: ${BACKUP_NAME}"
```

## 4. Configuration Backup

### Application Configuration Backup
```bash
#!/bin/bash
# scripts/backup_config.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="config_backup_${DATE}"

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup Docker Compose configuration
echo "Backing up Docker Compose configuration..."
cp docker-compose.yml "${BACKUP_DIR}/${BACKUP_NAME}/"
cp .env "${BACKUP_DIR}/${BACKUP_NAME}/" 2>/dev/null || true

# Backup Nginx configuration
echo "Backing up Nginx configuration..."
cp -r gateway/nginx.conf "${BACKUP_DIR}/${BACKUP_NAME}/nginx/"
cp -r gateway/certs "${BACKUP_DIR}/${BACKUP_NAME}/nginx/" 2>/dev/null || true

# Backup database schema
echo "Backing up database schema..."
docker exec cockroachdb cockroach sql --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  --format=tsv \
  -e "SHOW CREATE ALL TABLES;" > "${BACKUP_DIR}/${BACKUP_NAME}/schema.sql"

# Backup monitoring configuration
echo "Backing up monitoring configuration..."
cp -r monitoring/ "${BACKUP_DIR}/${BACKUP_NAME}/" 2>/dev/null || true

# Backup SSL certificates
echo "Backing up SSL certificates..."
cp -r gateway/certs/ "${BACKUP_DIR}/${BACKUP_NAME}/ssl/" 2>/dev/null || true

# Create backup manifest
cat > "${BACKUP_DIR}/${BACKUP_NAME}/manifest.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "backup_name": "${BACKUP_NAME}",
  "components": [
    "docker-compose",
    "nginx",
    "database-schema",
    "monitoring",
    "ssl-certificates"
  ],
  "git_commit": "$(git rev-parse HEAD)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD)"
}
EOF

# Compress backup
echo "Compressing backup..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"

# Upload to cloud storage
echo "Uploading to cloud storage..."
aws s3 cp "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
  "s3://national-security-backups-africa/config/${BACKUP_NAME}.tar.gz" \
  --region af-south-1

# Clean up
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

echo "Configuration backup completed: ${BACKUP_NAME}"
```

## 5. Automated Backup Scheduling

### Cron Jobs Configuration
```bash
# Add to crontab with: crontab -e

# Database backups
0 2 * * * /opt/national-security/scripts/backup_cockroachdb.sh >> /var/log/backups/database.log 2>&1

# Media backups
0 3 * * * /opt/national-security/scripts/backup_minio.sh >> /var/log/backups/minio.log 2>&1

# Configuration backups
0 4 * * 0 /opt/national-security/scripts/backup_config.sh >> /var/log/backups/config.log 2>&1

# Backup verification
0 5 * * * /opt/national-security/scripts/verify_backups.sh >> /var/log/backups/verify.log 2>&1

# Cleanup old logs
0 6 * * * find /var/log/backups -name "*.log" -mtime +30 -delete
```

### Backup Verification Script
```bash
#!/bin/bash
# scripts/verify_backups.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
ALERT_EMAIL="admin@national-security.gov.ng"
LOG_FILE="/var/log/backups/verify.log"

# Function to send alert
send_alert() {
    local message=$1
    echo "$(date): ${message}" >> "${LOG_FILE}"
    # Send email alert
    echo "${message}" | mail -s "Backup Alert - National Security Platform" "${ALERT_EMAIL}"
}

# Verify recent database backups
echo "Verifying database backups..."
LATEST_DB_BACKUP=$(aws s3 ls s3://national-security-backups-africa/database/ \
  --region af-south-1 \
  | sort | tail -n 1 | awk '{print $4}')

if [ -z "$LATEST_DB_BACKUP" ]; then
    send_alert "CRITICAL: No database backups found"
    exit 1
fi

# Check backup age (should be less than 25 hours)
BACKUP_AGE=$(aws s3 head-object s3://national-security-backups-africa/database/"${LATEST_DB_BACKUP}" \
  --region af-south-1 \
  --query 'LastModified' \
  --output text)

BACKUP_TIMESTAMP=$(date -d "$BACKUP_AGE" +%s)
CURRENT_TIMESTAMP=$(date +%s)
AGE_HOURS=$(( (CURRENT_TIMESTAMP - BACKUP_TIMESTAMP) / 3600 ))

if [ $AGE_HOURS -gt 25 ]; then
    send_alert "WARNING: Database backup is ${AGE_HOURS} hours old"
fi

# Verify media backups
echo "Verifying media backups..."
LATEST_MEDIA_BACKUP=$(aws s3 ls s3://national-security-backups-africa/media/ \
  --region af-south-1 \
  | sort | tail -n 1 | awk '{print $4}')

if [ -z "$LATEST_MEDIA_BACKUP" ]; then
    send_alert "CRITICAL: No media backups found"
    exit 1
fi

# Test restore procedure (non-destructive)
echo "Testing restore procedure..."
TEST_DB="test_restore_$(date +%s)"
docker exec cockroachdb cockroach sql --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  -e "CREATE DATABASE ${TEST_DB};"

# Restore to test database
docker exec cockroachdb cockroach restore \
  --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  --to-database="${TEST_DB}" \
  "nodelocal://backups/${LATEST_DB_BACKUP%.tar.gz}/full"

# Verify test database
RECORD_COUNT=$(docker exec cockroachdb cockroach sql --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  --database="${TEST_DB}" \
  -t "SELECT COUNT(*) FROM alerts;" 2>/dev/null || echo "0")

if [ "$RECORD_COUNT" -eq 0 ]; then
    send_alert "CRITICAL: Database restore test failed"
else
    echo "$(date): Database restore test passed - ${RECORD_COUNT} records restored" >> "${LOG_FILE}"
fi

# Clean up test database
docker exec cockroachdb cockroach sql --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  -e "DROP DATABASE ${TEST_DB};"

echo "Backup verification completed"
```

## 6. Disaster Recovery Plan

### Recovery Procedures
```markdown
# Disaster Recovery Procedures

## 1. System Failure Recovery

### Minor Outage (<1 hour)
1. Check service status: `docker-compose ps`
2. Restart failed services: `docker-compose restart <service>`
3. Verify functionality: Run health checks
4. Monitor logs: `docker-compose logs -f <service>`

### Major Outage (1-4 hours)
1. Assess damage: Check all systems and data
2. Restore from latest backup: Use backup scripts
3. Verify data integrity: Run verification scripts
4. Test all functionality: End-to-end testing
5. Monitor performance: Watch for issues

### Catastrophic Failure (>4 hours)
1. Activate disaster recovery site
2. Restore from regional backup
3. Re-establish services in priority order
4. Communicate with stakeholders
5. Document lessons learned

## 2. Data Corruption Recovery

### Database Corruption
1. Stop all applications
2. Identify corruption point
3. Restore from last known good backup
4. Apply transaction logs up to corruption point
5. Verify data integrity
6. Restart applications

### Media File Corruption
1. Identify corrupted files
2. Restore from backup
3. Verify file integrity
4. Update database references
5. Test functionality

## 3. Security Incident Recovery

### Data Breach
1. Isolate affected systems
2. Preserve evidence
3. Assess damage
4. Restore from clean backup
5. Patch vulnerabilities
6. Monitor for suspicious activity

### Ransomware
1. Isolate infected systems
2. Do not pay ransom
3. Restore from clean backup
4. Change all credentials
5. Scan for malware
6. Strengthen security
```

## 7. Validation Checklist

### Backup Implementation Validation ✅
- [ ] Database backup script working
- [ ] Media backup script working
- [ ] Configuration backup script working
- [ ] Automated scheduling configured
- [ ] Backup verification working

### Recovery Procedures Validation ✅
- [ ] Database recovery tested
- [ ] Media recovery tested
- [ ] Configuration recovery tested
- [ ] Point-in-time recovery tested
- [ ] Disaster recovery documented

### Backup Storage Validation ✅
- [ ] Local backup storage working
- [ ] Regional cloud storage working
- [ ] Multi-region replication working
- [ ] Backup encryption working
- [ ] Access controls configured

### Monitoring and Alerting Validation ✅
- [ ] Backup success monitoring
- [ ] Backup failure alerting
- [ ] Storage capacity monitoring
- [ ] Recovery time monitoring
- [ ] Compliance reporting

## 8. Success Metrics

### Backup Metrics
- **Backup Success Rate**: >99.5%
- **Backup Completion Time**: <2 hours for full backup
- **Recovery Time Objective (RTO)**: <4 hours
- **Recovery Point Objective (RPO)**: <1 hour
- **Storage Utilization**: <80% of allocated space

### Disaster Recovery Metrics
- **Disaster Recovery Time**: <8 hours
- **Data Integrity**: 100% verification
- **Service Availability**: >99.9%
- **Security Incident Response**: <1 hour
- **Business Continuity**: >95% functionality maintained

## 9. Implementation Timeline

### Week 1: Database Backup
- Implement database backup scripts
- Configure automated scheduling
- Test backup and recovery procedures
- Set up monitoring and alerting

### Week 2: Media Backup
- Implement media backup scripts
- Configure real-time sync
- Test media recovery procedures
- Set up encryption and access controls

### Week 3: Configuration Backup
- Implement configuration backup scripts
- Document all configurations
- Test configuration recovery
- Set up version control

### Week 4: Disaster Recovery
- Create disaster recovery procedures
- Test disaster recovery scenarios
- Set up monitoring and alerting
- Train staff on recovery procedures