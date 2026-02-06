package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// SecurityStack applies a suite of security headers and policies to the router
func SecurityStack(r *chi.Mux) {
	// 0. Secure Headers (Must be first to ensure they are set even on early returns)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("X-Content-Type-Options", "nosniff")
			w.Header().Set("X-Frame-Options", "DENY")
			w.Header().Set("X-XSS-Protection", "1; mode=block")
			w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-eval' https://api.mapbox.com; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; img-src 'self' data: blob: https://api.mapbox.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://api.mapbox.com; font-src 'self' data:;")
			w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

			next.ServeHTTP(w, r)
		})
	})

	// 1. CSRF Protection
	r.Use(CSRFMiddleware)

	// 2. Basic Middleware (Must run first for correct IP resolution)
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// 3. Rate Limiting (IP-based) - Now sees the Real IP
	limiter := NewRateLimiter(5, 10) // 5 req/s, burst 10
	r.Use(limiter.Handler)

	// 3. CORS Configuration (Dynamic)
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	origins := []string{"http://localhost:8085", "http://localhost:3000"} // Defaults
	if allowedOrigins != "" {
		origins = strings.Split(allowedOrigins, ",")
	}

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   origins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link", "X-Security-Status", "X-User-Role"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
}
