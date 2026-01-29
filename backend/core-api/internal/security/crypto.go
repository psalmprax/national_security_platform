package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"os"
)

var masterKey []byte

func init() {
	keyBase64 := os.Getenv("MASTER_ENCRYPTION_KEY")
	if keyBase64 == "" {
		// In a real app, we'd fail hard. For dev, we log a warning.
		// Never use a static fallback in production.
		fmt.Println("⚠️  WARNING: MASTER_ENCRYPTION_KEY not set. Using insecure default for development.")
		masterKey = make([]byte, 32) // 32 bytes for AES-256
	} else {
		var err error
		masterKey, err = base64.StdEncoding.DecodeString(keyBase64)
		if err != nil || len(masterKey) != 32 {
			fmt.Printf("❌ ERROR: Invalid MASTER_ENCRYPTION_KEY. Must be 32-byte base64 string. Error: %v\n", err)
			os.Exit(1)
		}
	}
}

// Encrypt plain text using AES-GCM
func Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt base64 encoded ciphertext using AES-GCM
func Decrypt(cryptoText string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(cryptoText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// GenerateRandomKey is a helper for the user to create a new master key
func GenerateRandomKey() string {
	key := make([]byte, 32)
	rand.Read(key)
	return base64.StdEncoding.EncodeToString(key)
}

// VerifySignature validates an Ed25519 signature against a message and hex-encoded public key
func VerifySignature(publicKeyHex, message, signatureHex string) (bool, error) {
	pubBytes, err := hex.DecodeString(publicKeyHex)
	if err != nil {
		return false, fmt.Errorf("invalid public key hex: %w", err)
	}

	if len(pubBytes) != ed25519.PublicKeySize {
		return false, fmt.Errorf("invalid public key size: expected %d, got %d", ed25519.PublicKeySize, len(pubBytes))
	}

	sigBytes, err := hex.DecodeString(signatureHex)
	if err != nil {
		return false, fmt.Errorf("invalid signature hex: %w", err)
	}

	if len(sigBytes) != ed25519.SignatureSize {
		return false, fmt.Errorf("invalid signature size: expected %d, got %d", ed25519.SignatureSize, len(sigBytes))
	}

	return ed25519.Verify(pubBytes, []byte(message), sigBytes), nil
}
