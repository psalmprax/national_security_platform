package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestAuthMiddleware(t *testing.T) {
	// Note: Fully testing AuthMiddleware requires mocking security.VerifyToken
	// which might be complex without an interface.
	// For now, we'll focus on the logic that extracts values from context.
}

func TestRequireRole(t *testing.T) {
	tests := []struct {
		name           string
		userRole       string
		requiredRole   string
		expectedStatus int
	}{
		{"Authorized", "ADMIN", "ADMIN", http.StatusOK},
		{"Unauthorized", "USER", "ADMIN", http.StatusForbidden},
		{"No Role", "", "ADMIN", http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := RequireRole(tt.requiredRole)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			req := httptest.NewRequest("GET", "/", nil)
			if tt.userRole != "" {
				ctx := context.WithValue(req.Context(), UserRoleKey, tt.userRole)
				req = req.WithContext(ctx)
			}

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v", status, tt.expectedStatus)
			}
		})
	}
}

func TestRequireAnyRole(t *testing.T) {
	tests := []struct {
		name           string
		userRole       string
		requiredRoles  []string
		expectedStatus int
	}{
		{"Authorized (First)", "ADMIN", []string{"ADMIN", "USER"}, http.StatusOK},
		{"Authorized (Second)", "USER", []string{"ADMIN", "USER"}, http.StatusOK},
		{"Unauthorized", "GUEST", []string{"ADMIN", "USER"}, http.StatusForbidden},
		{"No Role", "", []string{"ADMIN", "USER"}, http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := RequireAnyRole(tt.requiredRoles...)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			req := httptest.NewRequest("GET", "/", nil)
			if tt.userRole != "" {
				ctx := context.WithValue(req.Context(), UserRoleKey, tt.userRole)
				req = req.WithContext(ctx)
			}

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v", status, tt.expectedStatus)
			}
		})
	}
}

func TestRequireClearance(t *testing.T) {
	tests := []struct {
		name           string
		userClearance  string
		minClearance   string
		expectedStatus int
	}{
		{"Sufficient (Equal)", "SECRET", "SECRET", http.StatusOK},
		{"Sufficient (Higher)", "TOP_SECRET", "SECRET", http.StatusOK},
		{"Insufficient", "CONFIDENTIAL", "SECRET", http.StatusForbidden},
		{"No Clearance", "", "SECRET", http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := RequireClearance(tt.minClearance)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			}))

			req := httptest.NewRequest("GET", "/", nil)
			if tt.userClearance != "" {
				ctx := context.WithValue(req.Context(), UserClearanceKey, tt.userClearance)
				req = req.WithContext(ctx)
			}

			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v", status, tt.expectedStatus)
			}
		})
	}
}
