package middleware

import (
	"context"
	"net/http"
	"strings"

	"national_security_platform/backend/core-api/internal/security"
)

type contextKey string

const (
	UserIDKey        contextKey = "userID"
	UserRoleKey      contextKey = "userRole"
	UserClearanceKey contextKey = "userClearance"
)

var clearanceLevels = map[string]int{
	"UNCLASSIFIED": 1,
	"RESTRICTED":   2,
	"CONFIDENTIAL": 3,
	"SECRET":       4,
	"TOP_SECRET":   5,
}

// AuthMiddleware is chi-compatible middleware for JWT verification
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := ""

		// 1. Try Authorization Header
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// 2. Try Cookie if Header failed
		if tokenString == "" {
			cookie, err := r.Cookie("auth_token")
			if err == nil {
				tokenString = cookie.Value
			}
		}

		if tokenString == "" {
			http.Error(w, "Unauthorized: No token found", http.StatusUnauthorized)
			return
		}

		claims, err := security.VerifyToken(tokenString)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		ctx = context.WithValue(ctx, UserRoleKey, claims.Role)
		ctx = context.WithValue(ctx, UserClearanceKey, claims.ClearanceLevel)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole enforces a specific role. Must be used AFTER AuthMiddleware.
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole, ok := r.Context().Value(UserRoleKey).(string)
			if !ok || userRole != role {
				http.Error(w, "Forbidden: insufficient permissions", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAnyRole enforces that the user has at least one of the provided roles.
func RequireAnyRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userRole, ok := r.Context().Value(UserRoleKey).(string)
			if !ok {
				http.Error(w, "Forbidden: role not found", http.StatusForbidden)
				return
			}

			found := false
			for _, r := range roles {
				if userRole == r {
					found = true
					break
				}
			}

			if !found {
				http.Error(w, "Forbidden: insufficient permissions", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireClearance enforces a minimum clearance level.
func RequireClearance(minimumLevel string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userClearance, ok := r.Context().Value(UserClearanceKey).(string)
			if !ok {
				http.Error(w, "Forbidden: clearance not found", http.StatusForbidden)
				return
			}

			userLevel := clearanceLevels[userClearance]
			requiredLevel := clearanceLevels[minimumLevel]

			if userLevel < requiredLevel {
				http.Error(w, "Forbidden: insufficient clearance", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
