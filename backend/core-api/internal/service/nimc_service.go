package service

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"
)

// NIMCService handles interaction with the National Identity Management Commission database (Mocked)
type NIMCService struct{}

func NewNIMCService() *NIMCService {
	return &NIMCService{}
}

type NIMCPersonData struct {
	NIN         string `json:"nin"`
	FullName    string `json:"full_name"`
	DateOfBirth string `json:"dob"`
	Gender      string `json:"gender"`
	Verified    bool   `json:"verified"`
}

// VerifyNIN simulates a lookup in the NIMC database
func (s *NIMCService) VerifyNIN(ctx context.Context, nin string) (*NIMCPersonData, error) {
	// Simulate network latency for outward API call
	select {
	case <-time.After(1200 * time.Millisecond):
	case <-ctx.Done():
		return nil, ctx.Err()
	}

	if len(nin) != 11 {
		return nil, errors.New("invalid NIN format: must be 11 digits")
	}

	// Mocking some predictable behavior for testing
	// NIN ending in '0' fails verification
	if nin[10] == '0' {
		return &NIMCPersonData{
			NIN:      nin,
			Verified: false,
		}, nil
	}

	// NIN ending in '9' throws a provider error (Simulation)
	if nin[10] == '9' {
		return nil, errors.New("NIMC upstream provider timeout")
	}

	return &NIMCPersonData{
		NIN:         nin,
		FullName:    "MOCK VERIFIED CITIZEN",
		DateOfBirth: "1990-01-01",
		Gender:      "M",
		Verified:    true,
	}, nil
}

// LogIdentityVerification simulates writing to the judicial chain of custody log
func (s *NIMCService) LogIdentityVerification(ctx context.Context, userID string, status string) (string, error) {
	ref := fmt.Sprintf("NIMC-LOG-%d-%d", time.Now().Unix(), rand.Intn(1000))
	return ref, nil
}
