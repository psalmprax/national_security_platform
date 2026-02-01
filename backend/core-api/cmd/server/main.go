package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"national_security_platform/backend/core-api/internal/agency"
	"national_security_platform/backend/core-api/internal/audit"
	"national_security_platform/backend/core-api/internal/db"
	igrpc "national_security_platform/backend/core-api/internal/grpc"
	"national_security_platform/backend/core-api/internal/middleware"
	"national_security_platform/backend/core-api/internal/models"
	"national_security_platform/backend/core-api/internal/mq"
	"national_security_platform/backend/core-api/internal/security"
	"national_security_platform/backend/core-api/internal/service"
	"national_security_platform/backend/core-api/internal/sse"
	proto "national_security_platform/backend/core-api/pkg"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc"
)

type SubmitAlertRequest struct {
	UserID    string  `json:"user_id"`
	AlertType string  `json:"alert_type"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Content   string  `json:"content"`
}

type Response struct {
	Success    bool   `json:"success"`
	Message    string `json:"message,omitempty"`
	TrackingID string `json:"tracking_id,omitempty"`
	Token      string `json:"token,omitempty"`
}

type OnboardRequest struct {
	UserID      string  `json:"user_id"`
	DeviceHWID  string  `json:"device_hwid"`
	PublicKey   string  `json:"public_key"` // Hex encoded Ed25519 public key
	Signature   string  `json:"signature"`  // Proof of possession: Hex(Sign(DeviceHWID, PrivateKey))
	DeviceModel *string `json:"device_model,omitempty"`
	OSVersion   *string `json:"os_version,omitempty"`
}

type LoginRequest struct {
	PhoneNumber string `json:"phone_number"`
	Password    string `json:"password"`
}

type RequestAccessRequest struct {
	PhoneNumber string `json:"phone_number"`
	FullName    string `json:"full_name"`
	Password    string `json:"password"`
	Role        string `json:"role"`
}

func main() {
	// Initialize database
	if err := db.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Essential Security Check
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatalf("FATAL ERROR: JWT_SECRET environment variable is not set. Refusing to start in insecure state.")
	}

	// Initialize Redis
	if err := db.InitRedis(); err != nil {
		log.Printf("Failed to initialize Redis (caching disabled): %v", err)
		// We don't fatal here to allow partial functionality if Redis is down
	}

	// Initialize NATS
	if err := mq.InitNATS(); err != nil {
		log.Printf("⚠️ Warning: Failed to initialize NATS: %v", err)
	}
	defer mq.Close()

	// Start Audit Worker (Background Log Processing)
	go audit.StartAuditWorker(context.Background())

	// Initialize SSE
	sse.Init()

	// Subscribe to NATS alerts and broadcast to SSE
	go func() {
		err := mq.Subscribe(context.Background(), "alerts.>", func(msg []byte) {
			sse.Broadcast(string(msg))
		})
		if err != nil {
			log.Printf("Failed to subscribe to alerts: %v", err)
		}
	}()

	// Initialize Intelligence Service gRPC Client
	intelURL := os.Getenv("INTELLIGENCE_SERVICE_URL")
	if intelURL == "" {
		intelURL = "localhost:50051"
	}
	intelClient, err := igrpc.NewIntelligenceClient(intelURL)
	if err != nil {
		log.Printf("⚠️ Warning: Failed to initialize Intelligence Service client: %v", err)
	} else {
		defer intelClient.Close()
	}

	alertService := &service.AlertService{}

	// Setup Router
	r := chi.NewRouter()
	middleware.SecurityStack(r)

	// --- PUBLIC ROUTES ---
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("National Security Platform - Core API (Golang) is Running!"))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	r.Post("/api/v1/auth/login", handleLogin)
	r.Post("/api/v1/auth/dashboard-login", handleDashboardLogin)
	r.Post("/api/v1/auth/request-access", handleRequestAccess)
	r.Post("/api/v1/auth/logout", handleLogout)

	// Server-Sent Events Pattern
	r.Get("/api/v1/events/stream", sse.Stream.HandleEvents)

	// --- PROTECTED ROUTES ---
	r.Group(func(r chi.Router) {
		// All routes here require a valid token
		r.Use(middleware.AuthMiddleware)

		r.Get("/api/v1/auth/me", handleMe)
		r.Get("/api/v1/alerts", handleGetAlerts)
		r.Post("/api/v1/alerts", func(w http.ResponseWriter, r *http.Request) {
			handleSubmitAlert(w, r, alertService, intelClient)
		})
		r.Post("/api/v1/assets/{id}/dispatch", agency.DispatchAssetHandler)
		r.Post("/api/v1/alerts/{id}/verify", handleVerifyAlert)

		// Onboarding (authenticated/verified)
		r.Post("/api/v1/auth/onboard", handleOnboard)
	})

	// --- ADMIN & SYSTEM ROUTES (Highest Protection) ---
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Use(middleware.RequireRole("ADMIN"))

		r.Get("/api/v1/system/status", handleSystemStatus)
		r.Get("/api/v1/system/nodes", handleSystemNodes)
		r.Get("/api/v1/system/security-scans", handleGetSecurityScans)

		// Agency & Asset Management
		r.Post("/api/v1/agencies", agency.RegisterAgencyHandler)
		r.Get("/api/v1/assets", agency.ListAssetsHandler)
		r.Post("/api/v1/assets", agency.CreateAssetHandler)
	})

	// Reporting & Analysis Routes (Restricted)
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Use(middleware.RequireAnyRole("ADMIN", "CYBER_ANALYST", "STRATEGIC_PLANNER", "TACTICAL_COMMAND", "AGENCY_OFFICER"))

		r.Get("/api/v1/system/reports/sector", handleGetSectorReport)
		r.Get("/api/v1/alerts/{id}/triangulation", handleGetAlertTriangulation)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// TLS Configuration
	certFile := os.Getenv("TLS_CERT_FILE")
	keyFile := os.Getenv("TLS_KEY_FILE")
	useTLS := certFile != "" && keyFile != ""

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	if useTLS {
		server.TLSConfig = &tls.Config{
			MinVersion:               tls.VersionTLS13,
			PreferServerCipherSuites: true,
		}
	}

	// Graceful shutdown
	go func() {
		if useTLS {
			log.Printf("🚀 Core API starting on port %s (TLS 1.3 enabled)...", port)
			if err := server.ListenAndServeTLS(certFile, keyFile); err != nil && err != http.ErrServerClosed {
				log.Fatalf("Failed to start TLS server: %v", err)
			}
		} else {
			log.Printf("🚀 Core API starting on port %s (Insecure - TLS disabled)...", port)
			if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				log.Fatalf("Failed to start server: %v", err)
			}
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Start gRPC Server
	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50051"
	}
	lis, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		log.Fatalf("failed to listen for gRPC: %v", err)
	}
	grpcServer := grpc.NewServer()
	proto.RegisterCoreServiceServer(grpcServer, &service.GrpcServer{AlertService: alertService})

	go func() {
		log.Printf("📡 gRPC Server starting on port %s...", grpcPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	<-quit

	log.Println("Shutting down servers...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	grpcServer.GracefulStop()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Servers exited")
}

// --- HANDLERS ---

func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	log.Printf("🔐 Mobile Login attempt: phone=%s from client=%s", req.PhoneNumber, r.RemoteAddr)

	user, err := authenticateUser(r.Context(), req.PhoneNumber, req.Password)
	if err != nil {
		log.Printf("❌ Mobile Login failed: %v", err)
		respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Invalid credentials"})
		return
	}

	token, err := security.GenerateToken(user.ID, user.Role, user.ClearanceLevel)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Token generation failed"})
		return
	}

	// Set HttpOnly Cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   false, // Set to true in production (checking TLS)
		SameSite: http.SameSiteLaxMode,
	})

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Login successful", Token: token})
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	// Clear HttpOnly Cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true, // Should match the login cookie secure attribute (dynamic based on env ideally, but true is safer)
		SameSite: http.SameSiteLaxMode,
	})

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Logged out successfully"})
}

func handleDashboardLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	user, err := authenticateUser(r.Context(), req.PhoneNumber, req.Password)
	if err != nil {
		respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Invalid credentials"})
		return
	}

	allowedRoles := map[string]bool{
		"ADMIN":             true,
		"CYBER_ANALYST":     true,
		"STRATEGIC_PLANNER": true,
		"TACTICAL_COMMAND":  true,
		"AGENCY_OFFICER":    true,
	}

	if !allowedRoles[user.Role] {
		respondJSON(w, http.StatusForbidden, Response{Success: false, Message: "Access Denied: Insufficient permissions"})
		return
	}

	token, err := security.GenerateToken(user.ID, user.Role, user.ClearanceLevel)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Token generation failed"})
		return
	}

	// Set HttpOnly Cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   true, // Enforced by internal TLS and production usage
		SameSite: http.SameSiteLaxMode,
	})

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Dashboard Access Granted", Token: token})
}

func handleRequestAccess(w http.ResponseWriter, r *http.Request) {
	var req RequestAccessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Internal server error"})
		return
	}

	pwStr := string(hashedPassword)
	fullName := req.FullName
	user := &models.User{
		ID:             uuid.New(),
		PhoneNumber:    req.PhoneNumber,
		FullName:       &fullName,
		Role:           req.Role,
		Status:         "PENDING",
		PasswordHash:   &pwStr,
		TrustScore:     0.1,
		ClearanceLevel: "UNCLASSIFIED",
	}

	if err := db.CreateUserRequest(r.Context(), user); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to submit request"})
		return
	}

	respondJSON(w, http.StatusCreated, Response{Success: true, Message: "Registration request submitted. Awaiting approval."})
}

func handleGetAlerts(w http.ResponseWriter, r *http.Request) {
	userClearance, _ := r.Context().Value(middleware.UserClearanceKey).(string)
	// Default to UNCLASSIFIED if missing (should be caught by middleware though)
	if userClearance == "" {
		userClearance = "UNCLASSIFIED"
	}
	alerts, err := db.GetRecentAlerts(r.Context(), 50, userClearance)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve alerts"})
		return
	}
	respondJSON(w, http.StatusOK, alerts)
}

func handleSubmitAlert(w http.ResponseWriter, r *http.Request, alertService *service.AlertService, intelClient *igrpc.IntelligenceClient) {
	var req SubmitAlertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	// Strict identity mapping check
	tokenUserID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if ok && tokenUserID != req.UserID {
		respondJSON(w, http.StatusForbidden, Response{Success: false, Message: "Identity mismatch"})
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid user ID"})
		return
	}

	alert, err := alertService.SubmitAlert(r.Context(), userID, req.AlertType, req.Latitude, req.Longitude, req.Content)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to submit alert"})
		return
	}

	if intelClient != nil {
		go intelClient.AnalyzeAlert(context.Background(), alert.ID.String(), req.Content, "en")
	}

	respondJSON(w, http.StatusCreated, Response{Success: true, Message: "Alert submitted successfully", TrackingID: alert.ID.String()})
}

func handleOnboard(w http.ResponseWriter, r *http.Request) {
	var req OnboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request body"})
		return
	}

	isValid, err := security.VerifySignature(req.PublicKey, req.DeviceHWID, req.Signature)
	if err != nil || !isValid {
		respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Cryptographic verification failed"})
		return
	}

	userID, _ := uuid.Parse(req.UserID)
	device := &models.Device{
		ID: uuid.New(), UserID: userID, HWID: req.DeviceHWID, PublicKey: req.PublicKey,
		DeviceModel: req.DeviceModel, OSVersion: req.OSVersion, Status: "ACTIVE",
	}

	if err := db.RegisterDevice(r.Context(), device); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Internal server error during registration"})
		return
	}

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Hardware node successfully bound"})
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	tokenUserID, _ := r.Context().Value(middleware.UserIDKey).(string)
	userID, _ := uuid.Parse(tokenUserID)
	user, err := db.GetUserByID(r.Context(), userID)
	if err != nil {
		respondJSON(w, http.StatusNotFound, Response{Success: false, Message: "User not found"})
		return
	}
	respondJSON(w, http.StatusOK, user)
}

func handleSystemStatus(w http.ResponseWriter, r *http.Request) {
	stats, err := db.GetSystemStats(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve stats"})
		return
	}
	respondJSON(w, http.StatusOK, stats)
}

func handleSystemNodes(w http.ResponseWriter, r *http.Request) {
	devices, err := db.GetAllDevices(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve nodes"})
		return
	}
	respondJSON(w, http.StatusOK, devices)
}

func handleGetSecurityScans(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 10

	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	offset := (page - 1) * limit

	scans, err := db.GetRecentSecurityScans(r.Context(), limit, offset)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve security scans"})
		return
	}
	respondJSON(w, http.StatusOK, scans)
}

func handleGetAlertTriangulation(w http.ResponseWriter, r *http.Request) {
	alertIDStr := chi.URLParam(r, "id")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid alert ID format"})
		return
	}

	triangulated, err := db.GetTriangulatedAssets(r.Context(), alertID)
	if err != nil {
		log.Printf("Triangulation error: %v", err)
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to triangulate response teams"})
		return
	}

	respondJSON(w, http.StatusOK, triangulated)
}

func handleGetSectorReport(w http.ResponseWriter, r *http.Request) {
	userClearance, _ := r.Context().Value(middleware.UserClearanceKey).(string)
	if userClearance == "" {
		userClearance = "UNCLASSIFIED"
	}
	alerts, err := db.GetRecentAlerts(r.Context(), 100, userClearance)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to gather alert data"})
		return
	}

	report := models.SectorReport{
		SectorID:  "NATIONAL_OPERATIONS_CENTER",
		Timestamp: time.Now(),
	}

	// Try to get dynamic agency info if from a specific agency personnel
	tokenUserID, _ := r.Context().Value(middleware.UserIDKey).(string)
	if tokenUserID != "" {
		userID, _ := uuid.Parse(tokenUserID)
		if agency, err := db.GetUserAgencyInfo(r.Context(), userID); err == nil && agency != nil {
			report.SectorID = agency.Name
			if agency.Acronym != nil {
				report.SectorID = fmt.Sprintf("%s (%s)", agency.Name, *agency.Acronym)
			}
		}
	}

	for _, a := range alerts {
		report.TotalAlerts++
		if a.SeverityScore != nil && *a.SeverityScore > 0.8 {
			report.CriticalThreats++
		} else if a.SeverityScore != nil && *a.SeverityScore > 0.4 {
			report.RoutineAlerts++
		}

		if a.SeverityScore != nil {
			report.TrustScoreAvg += float64(a.VerificationCount)
		}
		report.LastIncidentType = a.AlertType
	}

	if report.TotalAlerts > 0 {
		report.TrustScoreAvg /= float64(report.TotalAlerts)
		report.SystemIntegrity = 100.0 - (float64(report.CriticalThreats) / float64(report.TotalAlerts) * 20.0)
	} else {
		report.SystemIntegrity = 100.0
	}

	if report.CriticalThreats > 2 {
		report.ThreatLevel = "CRITICAL"
	} else if report.CriticalThreats > 0 {
		report.ThreatLevel = "HIGH"
	} else if report.TotalAlerts > 5 {
		report.ThreatLevel = "MEDIUM"
	} else {
		report.ThreatLevel = "LOW"
	}

	respondJSON(w, http.StatusOK, report)
}

// authenticateUser remains as a helper
func authenticateUser(ctx context.Context, phoneNumber, password string) (*models.User, error) {
	if !strings.HasPrefix(phoneNumber, "+") {
		phoneNumber = "+" + phoneNumber
	}
	user, err := db.GetUserByPhoneNumber(ctx, phoneNumber)
	if err != nil {
		return nil, err
	}
	if user.Status != "ACTIVE" || user.PasswordHash == nil {
		return nil, bcrypt.ErrMismatchedHashAndPassword
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password)); err != nil {
		return nil, err
	}
	return user, nil
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func handleVerifyAlert(w http.ResponseWriter, r *http.Request) {
	alertIDStr := chi.URLParam(r, "id")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid alert ID format"})
		return
	}

	if err := db.VerifyAlert(r.Context(), alertID); err != nil {
		log.Printf("Verify alert error: %v", err)
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to verify alert"})
		return
	}

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Alert integrity verified"})
}
