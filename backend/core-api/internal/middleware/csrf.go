package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
)

// CSRFMiddleware implements a simple double-submit cookie pattern
func CSRFMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Skip check for safe methods
		if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" || r.Method == "TRACE" {
			// Ensure a CSRF token exists for the next request
			if _, err := r.Cookie("csrf_token"); err != nil {
				setCSRFCookie(w)
			}
			next.ServeHTTP(w, r)
			return
		}

		// 2. Skip check for specific public/auth endpoints (Mobile/Public API)
		path := r.URL.Path
		if path == "/api/v1/tips/submit" ||
			(len(path) >= 13 && path[:13] == "/api/v1/auth/") ||
			path == "/api/v1/events/stream" ||
			path == "/api/v1/logs" ||
			path == "/api/v1/logs/batch" {
			next.ServeHTTP(w, r)
			return
		}

		// 2. Extract tokens
		cookie, err := r.Cookie("csrf_token")
		if err != nil {
			http.Error(w, "CSRF token missing in cookie", http.StatusForbidden)
			return
		}

		header := r.Header.Get("X-CSRF-Token")
		if header == "" {
			http.Error(w, "CSRF token missing in header", http.StatusForbidden)
			return
		}

		// 3. Compare tokens
		if cookie.Value != header {
			http.Error(w, "CSRF token mismatch", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func setCSRFCookie(w http.ResponseWriter) {
	token := generateRandomToken(32)
	http.SetCookie(w, &http.Cookie{
		Name:     "csrf_token",
		Value:    token,
		Path:     "/",
		HttpOnly: false, // Must be readable by frontend JS
		Secure:   false, // Set to false for HTTP debugging on port 8086
		SameSite: http.SameSiteLaxMode,
	})
}

func generateRandomToken(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return hex.EncodeToString(b)
}
