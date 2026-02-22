#!/bin/bash
# scripts/setup_vault.sh

echo "waiting for vault..."
# simple wait loop
while ! curl -s http://localhost:8200/v1/sys/health > /dev/null; do
  sleep 1
done

export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='root'

echo "Vault is up. Configuring..."

# Enable KV v2 at secret/ if not enabled (dev mode enables it by default usually at secret/)
# We'll validte/ensure it exists or just write to it.
# In dev mode, secret/ is mounted as kv v2.

# Write secrets
# In a real scenario, these would come from a secure source or user input, not hardcoded.
# For this migration, we are moving them from docker-compose envs to Vault.
echo "Writing secrets to Vault..."
docker exec national_security_platform-vault-1 sh -c "export VAULT_ADDR='http://127.0.0.1:8200'; export VAULT_TOKEN='root'; vault kv put secret/national-security-platform/core-api \
  DB_PASSWORD='insecure_password' \
  JWT_SECRET='super-secret-jwt-key-change-in-production' \
  NATS_TOKEN='s3cr3t_t0k3n' \
  AT_API_KEY='mock-api-key'"

echo "✅ Secrets written to secret/national-security-platform/core-api"

# Create a policy for core-api
echo "Creating core-api-policy..."
echo 'path "secret/data/national-security-platform/core-api" {
  capabilities = ["read"]
}' | docker exec -i national_security_platform-vault-1 sh -c "export VAULT_ADDR='http://127.0.0.1:8200'; export VAULT_TOKEN='root'; vault policy write core-api-policy -"

# Create AppRole
echo "Enabling AppRole auth..."
docker exec national_security_platform-vault-1 sh -c "export VAULT_ADDR='http://127.0.0.1:8200'; export VAULT_TOKEN='root'; vault auth enable approle" || true

echo "Creating core-api role..."
docker exec national_security_platform-vault-1 sh -c "export VAULT_ADDR='http://127.0.0.1:8200'; export VAULT_TOKEN='root'; vault write auth/approle/role/core-api \
    token_policies='core-api-policy' \
    token_ttl=1h \
    token_max_ttl=4h"

# Get RoleID and SecretID
ROLE_ID=$(docker exec national_security_platform-vault-1 sh -c "export VAULT_ADDR='http://127.0.0.1:8200'; export VAULT_TOKEN='root'; vault read -field=role_id auth/approle/role/core-api/role-id")
SECRET_ID=$(docker exec national_security_platform-vault-1 sh -c "export VAULT_ADDR='http://127.0.0.1:8200'; export VAULT_TOKEN='root'; vault write -f -field=secret_id auth/approle/role/core-api/secret-id")

echo "---------------------------------------------------"
echo "Vault Setup Complete."
echo "ROLE_ID: $ROLE_ID"
echo "SECRET_ID: $SECRET_ID"
echo "---------------------------------------------------"
