# Security Implementation Plan

## 1. Secrets Management

### HashiCorp Vault Integration
```yaml
# Add to docker-compose.yml
  vault:
    image: vault:1.14.0
    ports:
      - "8200:8200"
    environment:
      - VAULT_ADDR=http://localhost:8200
      - VAULT_DEV_ROOT_TOKEN_ID=dev-token
    volumes:
      - vault_data:/vault/file
    command: server -dev

  vault-unseal:
    image: vault:1.14.0
    environment:
      - VAULT_ADDR=http://vault:8200
    depends_on:
      - vault
    command: |
      sh -c "
      vault operator init -key-shares=1 -key-threshold=1
      vault operator unseal
      "
```

### Environment Variables Migration
```bash
# Current .env variables to move to Vault:
- JWT_SECRET
- MASTER_ENCRYPTION_KEY
- NATS_TOKEN
- MINIO_ROOT_PASSWORD
- DATABASE_PASSWORD (if added)
```

### Vault Configuration Scripts
```bash
#!/bin/bash
# scripts/setup_vault.sh

export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=dev-token

# Enable secrets engine
vault secrets enable kv-v2

# Store secrets
vault kv put secret/national-security \
  jwt_secret=$(openssl rand -base64 32) \
  master_encryption_key=$(openssl rand -base64 32) \
  nats_token=$(openssl rand -base64 32) \
  minio_password=$(openssl rand -base64 16)

# Create policy for applications
vault policy write app-policy - <<EOF
path "secret/data/national-security" {
  capabilities = ["read"]
}
EOF

# Create token for applications
vault token create -policy=app-policy -ttl=24h
```

## 2. Security Scanning Pipeline

### Enhanced GitHub Actions
```yaml
# .github/workflows/security.yml
name: Security Scanning

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Go security analysis
        run: |
          go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
          cd backend/core-api
          gosec -fmt=json -out=results.json ./...
      - name: Python security analysis
        run: |
          pip install bandit safety
          cd backend/intelligence-service
          bandit -r . -f json -o bandit-results.json
          safety check --json --output safety-results.json
      - name: Node.js security analysis
        run: |
          cd web
          npm audit --json > audit-results.json || true

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t national-security/core-api ./backend/core-api
          docker build -t national-security/intelligence-service ./backend/intelligence-service
          docker build -t national-security/web ./web
      - name: Run Trivy on Docker images
        run: |
          trivy image --format json --output core-api-results.json national-security/core-api
          trivy image --format json --output intelligence-service-results.json national-security/intelligence-service
          trivy image --format json --output web-results.json national-security/web

  penetration-test:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker-compose up -d
      - name: Wait for services
        run: sleep 60
      - name: Run OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:8085'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

## 3. Security Hardening

### Nginx Security Headers
```nginx
# gateway/nginx.conf
server {
    listen 443 ssl http2;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://core-api:8080;
    }

    location /login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://web-dashboard:3000;
    }
}
```

### Database Security
```sql
-- Security hardening SQL
-- Create security roles
CREATE ROLE security_admin;
CREATE ROLE app_user;
CREATE ROLE readonly_user;

-- Grant minimum privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Enable row-level security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY alert_access_policy ON alerts
    FOR ALL TO app_user
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Audit logging
CREATE OR REPLACE VIEW audit_trail AS
SELECT 
    table_name,
    operation,
    user_name,
    timestamp,
    old_values,
    new_values
FROM audit_logs;
```

### Application Security
```go
// backend/core-api/internal/security/security.go
package security

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "io"
    "time"
    
    "github.com/vault-project/vault/api"
)

type SecurityManager struct {
    vaultClient *api.Client
    gcm         cipher.AEAD
}

func NewSecurityManager(vaultAddr, vaultToken string) (*SecurityManager, error) {
    config := api.DefaultConfig()
    config.Address = vaultAddr
    
    client, err := api.NewClient(config)
    if err != nil {
        return nil, err
    }
    
    client.SetToken(vaultToken)
    
    // Get encryption key from Vault
    secret, err := client.Logical().Read("secret/data/national-security")
    if err != nil {
        return nil, err
    }
    
    key := secret.Data["data"].(map[string]interface{})["master_encryption_key"].(string)
    keyBytes, err := base64.StdEncoding.DecodeString(key)
    if err != nil {
        return nil, err
    }
    
    block, err := aes.NewCipher(keyBytes)
    if err != nil {
        return nil, err
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    
    return &SecurityManager{
        vaultClient: client,
        gcm:         gcm,
    }, nil
}

func (sm *SecurityManager) Encrypt(plaintext string) (string, error) {
    nonce := make([]byte, sm.gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", err
    }
    
    ciphertext := sm.gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (sm *SecurityManager) Decrypt(ciphertext string) (string, error) {
    data, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", err
    }
    
    nonceSize := sm.gcm.NonceSize()
    if len(data) < nonceSize {
        return "", fmt.Errorf("ciphertext too short")
    }
    
    nonce, ciphertext_bytes := data[:nonceSize], data[nonceSize:]
    plaintext, err := sm.gcm.Open(nil, nonce, ciphertext_bytes, nil)
    if err != nil {
        return "", err
    }
    
    return string(plaintext), nil
}

func (sm *SecurityManager) RotateSecrets() error {
    // Rotate JWT secret
    newJWTSecret := generateRandomString(32)
    _, err := sm.vaultClient.Logical().Write("secret/data/national-security", map[string]interface{}{
        "data": map[string]interface{}{
            "jwt_secret": newJWTSecret,
        },
    })
    return err
}
```

## 4. Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# scripts/backup_database.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="national_security_backup_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup CockroachDB
docker exec cockroachdb cockroach dump --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  defaultdb > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to secure storage (AWS S3 or similar)
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" \
  s3://national-security-backups/database/

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Recovery Script
```bash
#!/bin/bash
# scripts/restore_database.sh

BACKUP_FILE=$1
BACKUP_DIR="/backups"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Download from secure storage
aws s3 cp "s3://national-security-backups/database/${BACKUP_FILE}" \
  "${BACKUP_DIR}/${BACKUP_FILE}"

# Decompress
gunzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Restore database
docker exec -i cockroachdb cockroach sql --insecure \
  --host=localhost \
  --port=26257 \
  --user=root \
  defaultdb < "${BACKUP_DIR}/${BACKUP_FILE%.gz}"

echo "Database restored from: ${BACKUP_FILE}"
```

## 5. Validation Checklist

### Secrets Management Validation ✅
- [ ] Vault deployed and configured
- [ ] All secrets moved from .env to Vault
- [ ] Applications retrieve secrets from Vault
- [ ] Secret rotation implemented
- [ ] Access policies configured

### Security Scanning Validation ✅
- [ ] Dependency scanning automated
- [ ] Static code analysis implemented
- [ ] Container scanning configured
- [ ] Penetration testing scheduled
- [ ] Security reports generated

### Security Hardening Validation ✅
- [ ] Security headers configured
- [ ] SSL/TLS hardening completed
- [ ] Database security implemented
- [ ] Application security enhanced
- [ ] Network security configured

### Backup and Recovery Validation ✅
- [ ] Automated backups implemented
- [ ] Backup encryption enabled
- [ ] Off-site backup storage
- [ ] Recovery procedures tested
- [ ] Backup retention policies

## 6. Success Metrics

### Security Metrics
- **Vulnerability Response Time**: <24 hours for critical issues
- **Security Scan Coverage**: 100% of code and dependencies
- **Secret Rotation**: Monthly rotation for all secrets
- **Backup Success Rate**: >99% successful backups
- **Recovery Time**: <4 hours for full system recovery

### Compliance Metrics
- **Security Policy Compliance**: 100%
- **Access Control Audit**: Quarterly reviews
- **Penetration Testing**: Biannual assessments
- **Security Training**: Annual for all staff
- **Incident Response**: <1 hour for critical incidents

## 7. Implementation Timeline

### Week 1: Secrets Management
- Deploy HashiCorp Vault
- Migrate secrets from .env
- Update applications to use Vault
- Test secret rotation

### Week 2: Security Scanning
- Configure security scanning pipeline
- Implement static analysis
- Set up container scanning
- Schedule penetration testing

### Week 3: Security Hardening
- Harden Nginx configuration
- Implement database security
- Enhance application security
- Configure network security

### Week 4: Backup and Recovery
- Implement automated backups
- Configure off-site storage
- Test recovery procedures
- Document backup processes