package service

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
)

// SMSService defines the capabilities for sending SMS notifications
type SMSService interface {
	SendSMS(ctx context.Context, phone string, message string) error
	SendOTP(ctx context.Context, phone string, code string) error
}

// MockSMSService is a development implementation that logs to console
type MockSMSService struct{}

func NewMockSMSService() *MockSMSService {
	return &MockSMSService{}
}

func (s *MockSMSService) SendSMS(ctx context.Context, phone string, message string) error {
	log.Printf("📱 [SMS GATEWAY] To: %s, Message: %s", phone, message)
	return nil
}

func (s *MockSMSService) SendOTP(ctx context.Context, phone string, code string) error {
	message := fmt.Sprintf("National Security Platform: Your verification code is %s. Security Level: ELEVATED.", code)
	return s.SendSMS(ctx, phone, message)
}

// AfricasTalkingSMSService is the production provider for Nigerian/African SMS
type AfricasTalkingSMSService struct {
	Username string
	APIKey   string
}

func NewAfricasTalkingService(username, apiKey string) *AfricasTalkingSMSService {
	return &AfricasTalkingSMSService{
		Username: username,
		APIKey:   apiKey,
	}
}

func (s *AfricasTalkingSMSService) SendSMS(ctx context.Context, phone string, message string) error {
	apiUrl := "https://api.africastalking.com/version1/messaging"

	data := url.Values{}
	data.Set("username", s.Username)
	data.Set("to", phone)
	data.Set("message", message)

	req, err := http.NewRequestWithContext(ctx, "POST", apiUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Add("Accept", "application/json")
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Add("apiKey", s.APIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("provider returned non-OK status: %d", resp.StatusCode)
	}

	log.Printf("📡 [AfricasTalking] SMS sent to %s via live gateway", phone)
	return nil
}

func (s *AfricasTalkingSMSService) SendOTP(ctx context.Context, phone string, code string) error {
	message := fmt.Sprintf("National Security Platform: Your verification code is %s. DO NOT SHARE.", code)
	return s.SendSMS(ctx, phone, message)
}
