package middleware

import (
	"context"
	"net/http"
	"strings"

	"national_security_platform/backend/core-api/internal/security"
)

type contextKey string

const (
	UserIDKey   contextKey = "userID"
	UserRoleKey contextKey = "userRole"
)

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		claims, err := security.VerifyToken(parts[1])
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, UserRoleKey, claims.Role)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func RequireRole(role string, next http.HandlerFunc) http.HandlerFunc {
	return AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		userRole, ok := r.Context().Value(UserRoleKey).(string)
		if !ok || userRole != role {
			http.Error(w, "Forbidden: insufficient permissions", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
