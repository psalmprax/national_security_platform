package config

import (
	"fmt"
	"log"
	"os"

	vault "github.com/hashicorp/vault/api"
)

var (
	vaultClient *vault.Client
	secrets     map[string]string
)

// InitVault initializes the Vault client and loads secrets.
// It prioritizes reloading from Vault but falls back to env vars if Vault is unreachable in Dev.
func InitVault() error {
	vaultAddr := os.Getenv("VAULT_ADDR")
	if vaultAddr == "" {
		log.Println("⚠️  VAULT_ADDR not set. Skipping Vault integration.")
		return nil
	}

	config := vault.DefaultConfig()
	config.Address = vaultAddr

	client, err := vault.NewClient(config)
	if err != nil {
		return fmt.Errorf("unable to initialize Vault client: %w", err)
	}

	// For Development/POC: Use Root Token if provided
	if token := os.Getenv("VAULT_TOKEN"); token != "" {
		client.SetToken(token)
	} else {
		// Production Path: AppRole
		roleID := os.Getenv("VAULT_ROLE_ID")
		secretID := os.Getenv("VAULT_SECRET_ID")

		if roleID != "" && secretID != "" {
			// Authenticate via AppRole
			resp, err := client.Logical().Write("auth/approle/login", map[string]interface{}{
				"role_id":   roleID,
				"secret_id": secretID,
			})
			if err != nil {
				return fmt.Errorf("approle authentication failed: %w", err)
			}
			client.SetToken(resp.Auth.ClientToken)
		} else {
			log.Println("⚠️  No Vault Token or AppRole credentials found. Vault client initialized but unauthenticated.")
		}
	}

	vaultClient = client
	log.Println("🔐 Vault client initialized.")

	return LoadSecrets()
}

// LoadSecrets fetches secrets from the KV engine
func LoadSecrets() error {
	if vaultClient == nil {
		return nil
	}

	// Path convention: secret/data/national-security-platform/core-api
	secretPath := "secret/data/national-security-platform/core-api"

	secret, err := vaultClient.Logical().Read(secretPath)
	if err != nil {
		return fmt.Errorf("failed to read secret path %s: %w", secretPath, err)
	}

	if secret == nil || secret.Data == nil {
		log.Printf("⚠️  No secrets found at %s", secretPath)
		return nil
	}

	// KV v2 stores data in "data" key
	data, ok := secret.Data["data"].(map[string]interface{})
	if !ok {
		log.Printf("⚠️  Invalid secret format at %s", secretPath)
		return nil
	}

	secrets = make(map[string]string)
	for k, v := range data {
		if strVal, ok := v.(string); ok {
			secrets[k] = strVal
		}
	}

	log.Printf("✅ Loaded %d secrets from Vault.", len(secrets))
	return nil
}

// GetSecret returns a secret value, prioritizing Vault then Env Var
func GetSecret(key string) string {
	if val, ok := secrets[key]; ok {
		return val
	}
	return os.Getenv(key)
}
