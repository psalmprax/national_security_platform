package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMockSMSService_SendSMS(t *testing.T) {
	svc := NewMockSMSService()
	err := svc.SendSMS(context.Background(), "+2348000000000", "Test Message")
	if err != nil {
		t.Errorf("MockSMSService.SendSMS returned unexpected error: %v", err)
	}
}

func TestMockSMSService_SendOTP(t *testing.T) {
	svc := NewMockSMSService()
	err := svc.SendOTP(context.Background(), "+2348000000000", "123456")
	if err != nil {
		t.Errorf("MockSMSService.SendOTP returned unexpected error: %v", err)
	}
}

func TestAfricasTalkingSMSService_SendSMS(t *testing.T) {
	// Setup mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check headers
		if r.Header.Get("apiKey") != "test-api-key" {
			t.Errorf("Expected apiKey test-api-key, got %s", r.Header.Get("apiKey"))
		}
		if r.Header.Get("Content-Type") != "application/x-www-form-urlencoded" {
			t.Errorf("Expected Content-Type application/x-www-form-urlencoded, got %s", r.Header.Get("Content-Type"))
		}

		// Mock successful response (AfricasTalking usually returns 201 Created)
		w.WriteHeader(http.StatusCreated)
		w.Write([]byte(`{"SMSMessageData": {"Message": "Sent to 1/1 Total Cost: KES 0.8000", "Recipients": [{"number": "+2348000000000", "status": "Success", "cost": "KES 0.8000", "messageId": "AT_ID_123"}]}}`))
	}))
	defer server.Close()

	svc := &AfricasTalkingSMSService{
		Username: "test-user",
		APIKey:   "test-api-key",
		BaseURL:  server.URL,
	}

	err := svc.SendSMS(context.Background(), "+2348000000000", "Critical Alert")
	if err != nil {
		t.Errorf("AfricasTalkingSMSService.SendSMS returned unexpected error: %v", err)
	}
}

func TestAfricasTalkingSMSService_SendSMS_Failure(t *testing.T) {
	// Setup mock server for failure
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	svc := &AfricasTalkingSMSService{
		Username: "test-user",
		APIKey:   "test-api-key",
		BaseURL:  server.URL,
	}

	err := svc.SendSMS(context.Background(), "+2348000000000", "Critical Alert")
	if err == nil {
		t.Error("AfricasTalkingSMSService.SendSMS should have returned an error for 500 status")
	}
}
