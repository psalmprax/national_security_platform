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

	"national_security_platform/backend/core-api/handlers"
	"national_security_platform/backend/core-api/internal/agency"
	"national_security_platform/backend/core-api/internal/audit"
	"national_security_platform/backend/core-api/internal/config"
	"national_security_platform/backend/core-api/internal/db"
	igrpc "national_security_platform/backend/core-api/internal/grpc"
	"national_security_platform/backend/core-api/internal/middleware"
	"national_security_platform/backend/core-api/internal/models"
	"national_security_platform/backend/core-api/internal/mq"
	"national_security_platform/backend/core-api/internal/security"
	"national_security_platform/backend/core-api/internal/service"
	"national_security_platform/backend/core-api/internal/sse"
	"national_security_platform/backend/core-api/internal/storage"
	"national_security_platform/backend/core-api/internal/telemetry"
	proto "national_security_platform/backend/core-api/pkg"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/riandyrn/otelchi"
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
	PhoneNumber     string `json:"phone_number"`
	FullName        string `json:"full_name"`
	Email           string `json:"email"`
	Password        string `json:"password"`
	Role            string `json:"role"`
	NIN             string `json:"nin"`
	StateID         string `json:"state_id"`
	LGAID           string `json:"lga_id"`
	AgencyID        string `json:"agency_id,omitempty"`
	Rank            string `json:"rank,omitempty"`
	BadgeNumber     string `json:"badge_number,omitempty"`
	MonarchGrade    string `json:"monarch_grade,omitempty"`
	DomainTerritory string `json:"domain_territory,omitempty"`
}

type VerifyNINRequest struct {
	NIN string `json:"nin"`
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize Telemetry
	shutdown, err := telemetry.InitTracer(ctx)
	if err != nil {
		log.Printf("⚠️  Telemetry initialization failed: %v", err)
	} else {
		defer shutdown(ctx)
	}

	// Initialize Vault and load secrets
	if err := config.InitVault(); err != nil {
		log.Printf("⚠️  Vault initialization failed: %v", err)
	}

	// Inject Vault secrets into Env for compatibility
	if val := config.GetSecret("JWT_SECRET"); val != "" {
		os.Setenv("JWT_SECRET", val)
	}
	if val := config.GetSecret("AT_API_KEY"); val != "" {
		os.Setenv("AT_API_KEY", val)
	}
	if val := config.GetSecret("AT_USERNAME"); val != "" {
		os.Setenv("AT_USERNAME", val)
	}
	// Reconstruct DATABASE_URL if password is provided
	if pwd := config.GetSecret("DB_PASSWORD"); pwd != "" {
		dbURL := fmt.Sprintf("postgresql://root:%s@cockroachdb:26257/defaultdb?sslmode=disable", pwd)
		os.Setenv("DATABASE_URL", dbURL)
	}

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

	// Initialize Storage Provider (MinIO/S3 by default)
	minioEndpoint := os.Getenv("MINIO_ENDPOINT")
	if minioEndpoint == "" {
		minioEndpoint = "minio:9000"
	}
	minioAccessKey := os.Getenv("MINIO_ACCESS_KEY")
	if minioAccessKey == "" {
		minioAccessKey = "minioadmin"
	}
	minioSecretKey := os.Getenv("MINIO_SECRET_KEY")
	if minioSecretKey == "" {
		minioSecretKey = "minioadmin"
	}
	minioUseSSL := os.Getenv("MINIO_USE_SSL") == "true"

	storageProvider, err := storage.NewS3Provider(minioEndpoint, minioAccessKey, minioSecretKey, minioUseSSL, "MINIO")
	if err != nil {
		log.Printf("⚠️ Warning: Failed to initialize storage provider: %v", err)
	}

	// Initialize SMS Service (Resilient Communications)
	var smsService service.SMSService
	if os.Getenv("SMS_PROVIDER") == "africastalking" {
		username := os.Getenv("AT_USERNAME")
		apiKey := os.Getenv("AT_API_KEY")
		if username == "" || apiKey == "" {
			log.Printf("⚠️ Warning: SMS_PROVIDER is set to africastalking but credentials missing. Falling back to Mock.")
			smsService = service.NewMockSMSService()
		} else {
			log.Printf("📱 [SMS] Initializing AfricasTalking gateway...")
			smsService = service.NewAfricasTalkingService(username, apiKey)
		}
	} else {
		smsService = service.NewMockSMSService()
	}
	alertService := service.NewAlertService(smsService)
	meshNetworkHandler := handlers.NewMeshNetworkHandler()
	h := handlers.NewHandler(db.Pool, log.Default(), storageProvider)

	// Setup Router
	r := chi.NewRouter()

	// OpenTelemetry Middleware
	r.Use(otelchi.Middleware("core-api", otelchi.WithChiRoutes(r)))

	middleware.SecurityStack(r)

	// --- PUBLIC ROUTES ---
	r.Handle("/metrics", promhttp.Handler())

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("National Security Platform - Core API (Golang) is Running!"))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		status := "OPERATIONAL"
		dependencies := make(map[string]string)

		// 1. Check CockroachDB
		if err := db.Pool.Ping(r.Context()); err != nil {
			dependencies["database"] = "OFFLINE"
			status = "DEGRADED"
		} else {
			dependencies["database"] = "OPERATIONAL"
		}

		// 2. Check Redis
		if db.RedisClient != nil {
			if err := db.RedisClient.Ping(r.Context()).Err(); err != nil {
				dependencies["redis"] = "OFFLINE"
				if status == "OPERATIONAL" {
					status = "DEGRADED"
				}
			} else {
				dependencies["redis"] = "OPERATIONAL"
			}
		} else {
			dependencies["redis"] = "DISABLED"
		}

		// 3. Check NATS
		if mq.NC != nil && mq.NC.IsConnected() {
			dependencies["nats"] = "OPERATIONAL"
		} else {
			dependencies["nats"] = "OFFLINE"
			status = "DEGRADED"
		}

		// 4. Check Intelligence Service (gRPC)
		// Since we don't have a simple Ping in IntelligenceClient yet, we'll check if connection is non-nil
		// In a real scenario, we'd use gRPC health checking
		if intelClient != nil {
			dependencies["intelligence_service"] = "CONNECTED"
		} else {
			dependencies["intelligence_service"] = "DISCONNECTED"
			if status == "OPERATIONAL" {
				status = "DEGRADED"
			}
		}

		resp := map[string]interface{}{
			"status":       status,
			"dependencies": dependencies,
			"timestamp":    time.Now().Format(time.RFC3339),
		}

		w.Header().Set("Content-Type", "application/json")
		if status == "OPERATIONAL" {
			w.WriteHeader(http.StatusOK)
		} else {
			// Still return 200 so the platform doesn't crash, but status indicates degradation
			w.WriteHeader(http.StatusOK)
		}
		json.NewEncoder(w).Encode(resp)
	})

	r.Post("/api/v1/auth/login", handleLogin)
	r.Post("/api/v1/auth/dashboard-login", handleDashboardLogin)
	r.Post("/api/v1/auth/request-access", handleRequestAccess)
	r.Post("/api/v1/auth/logout", handleLogout)

	// Phase 1 Features: Public Endpoints
	handlers.RegisterAnonymousTipRoutes(r, h) // Anonymous tip submission is public

	// Server-Sent Events Pattern
	r.Get("/api/v1/events/stream", sse.Stream.HandleEvents)

	// Logging & telemetry
	r.Post("/api/v1/logs", handlers.HandleLog)
	r.Post("/api/v1/logs/batch", handlers.HandleLogBatch)

	// --- PROTECTED ROUTES ---
	r.Group(func(r chi.Router) {
		// All routes here require a valid token
		r.Use(middleware.AuthMiddleware)

		r.Get("/api/v1/auth/me", handleMe)
		r.Get("/api/v1/alerts", handleGetAlerts)
		r.Get("/api/v1/alerts/{alertID}/related", h.GetRelatedAlerts)
		// Mesh network status - available to authenticated users
		r.Get("/api/v1/system/mesh-network", meshNetworkHandler.GetMeshNetworkStatus)
		r.Post("/api/v1/alerts", func(w http.ResponseWriter, r *http.Request) {
			handleSubmitAlert(w, r, alertService, intelClient)
		})

		// Phase 1 Features: Protected Endpoints
		handlers.RegisterPublicAlertRoutes(r, h)
		handlers.RegisterSafetyScoreRoutes(r, h)
		handlers.RegisterAdminTipRoutes(r, h)
		handlers.RegisterSOSRoutes(r, h)

		// Agency & Asset Management (Agency/Tactical Roles)
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAnyRole("ADMIN", "AGENCY_OFFICER", "TACTICAL_COMMAND", "SECURITY_OFFICER", "SYSTEM_ADMIN"))
			r.Post("/api/v1/assets/{id}/dispatch", agency.DispatchAssetHandler)
			r.Post("/api/v1/alerts/{id}/verify", handleVerifyAlert)
		})

		// Missions (High-Privilege Tactical Roles)
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAnyRole("ADMIN", "TACTICAL_COMMAND", "SECURITY_OFFICER", "SYSTEM_ADMIN"))
			r.Post("/api/v1/missions", handleCreateMission)
			r.Get("/api/v1/missions/active", handleGetActiveMissions)
			r.Patch("/api/v1/missions/{id}/status", handleUpdateMissionStatus)
		})

		// Onboarding (authenticated/verified)
		r.Post("/api/v1/auth/onboard", handleOnboard)
		r.Post("/api/v1/auth/verify-nin", func(w http.ResponseWriter, r *http.Request) {
			handleVerifyNIN(w, r, smsService)
		})
		r.Post("/api/v1/auth/device-token", handleUpdateDeviceToken)
		r.Post("/api/v1/auth/location", handleUpdateLocation)

		// Media & Evidence
		r.Post("/api/v1/media/upload", h.HandleMediaUpload)
		r.Get("/api/v1/media/access", h.HandleGetMediaDownloadURL)

		// Missing Persons Registry
		r.Get("/api/v1/missing-persons", h.GetMissingPersons)
		r.Post("/api/v1/missing-persons", h.ReportMissingPerson)
	})

	// --- SYSTEM ADMIN ROUTES (Infrastructure & Health) ---
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Use(middleware.RequireAnyRole("ADMIN", "SYSTEM_ADMIN"))

		r.Get("/api/v1/system/status", handleSystemStatus)
		r.Get("/api/v1/system/nodes", handleSystemNodes)
		r.Get("/api/v1/system/mesh-network", meshNetworkHandler.GetMeshNetworkStatus)
		r.Get("/api/v1/system/security-scans", handleGetSecurityScans)
		r.Get("/api/v1/system/telemetry/satcom", handlers.HandleSatcomTelemetry)
	})

	// --- SECURITY OFFICER ROUTES (Access & Classification) ---
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Use(middleware.RequireAnyRole("ADMIN", "SECURITY_OFFICER"))

		r.Get("/api/v1/admin/users", handleGetAllUsers)
		r.Post("/api/v1/admin/users/{id}/clearance", handleUpdateUserClearance)
		r.Post("/api/v1/admin/alerts/{id}/classify", handleUpdateAlertClassification)
		r.Get("/api/v1/admin/audit-logs", handleGetAuditLogs)
		r.Get("/api/v1/admin/roles", handleGetRoles)
		r.Get("/api/v1/admin/permissions", handleGetPermissions)
	})

	// --- AGENCY & ASSET MANAGEMENT (Shared Admin/Operations) ---
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Use(middleware.RequireAnyRole("ADMIN", "SYSTEM_ADMIN", "SECURITY_OFFICER", "TACTICAL_COMMAND", "AGENCY_OFFICER"))

		r.Post("/api/v1/agencies", agency.RegisterAgencyHandler)
		r.Get("/api/v1/assets", agency.ListAssetsHandler)
		r.Post("/api/v1/assets", agency.CreateAssetHandler)
	})

	// Reporting & Analysis Routes (Restricted)
	r.Group(func(r chi.Router) {
		r.Use(middleware.AuthMiddleware)
		r.Use(middleware.RequireAnyRole("ADMIN", "SYSTEM_ADMIN", "SECURITY_OFFICER", "CYBER_ANALYST", "STRATEGIC_PLANNER", "TACTICAL_COMMAND", "AGENCY_OFFICER"))

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
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	grpcServer.GracefulStop()
	if err := server.Shutdown(shutdownCtx); err != nil {
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
		Secure:   false, // Set to false for HTTP debugging on port 8086
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
		"SYSTEM_ADMIN":      true,
		"SECURITY_OFFICER":  true,
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
		Secure:   false, // Set to false for HTTP debugging on port 8086
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
	stateID, _ := uuid.Parse(req.StateID)
	lgaID, _ := uuid.Parse(req.LGAID)

	user := &models.User{
		ID:              uuid.New(),
		PhoneNumber:     req.PhoneNumber,
		Email:           &req.Email,
		FullName:        &fullName,
		NIN:             &req.NIN,
		Role:            req.Role,
		MonarchGrade:    &req.MonarchGrade,
		DomainTerritory: &req.DomainTerritory,
		Status:          "PENDING",
		PasswordHash:    &pwStr,
		TrustScore:      0.1,
		ClearanceLevel:  "UNCLASSIFIED",
		StateID:         &stateID,
		LGAID:           &lgaID,
	}

	if err := db.CreateUserRequest(r.Context(), user); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to submit request: " + err.Error()})
		return
	}

	// Handle Agency Link if provided
	if req.AgencyID != "" {
		agencyID, _ := uuid.Parse(req.AgencyID)
		if err := db.AddAgencyPersonnel(r.Context(), user.ID, agencyID, req.Rank, "OPERATOR", req.BadgeNumber); err != nil {
			log.Printf("Warning: failed to link user to agency during registration: %v", err)
		}
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

func handleCreateMission(w http.ResponseWriter, r *http.Request) {
	var req models.CreateMissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	commanderIDStr, _ := r.Context().Value(middleware.UserIDKey).(string)
	commanderID, _ := uuid.Parse(commanderIDStr)
	alertID, _ := uuid.Parse(req.AlertID)
	assetID, _ := uuid.Parse(req.AssetID)

	// In a real scenario, we would calculate ETA here
	eta := 15
	mission := &models.Mission{
		ID:           uuid.New(),
		AlertID:      alertID,
		AssetID:      assetID,
		CommanderID:  commanderID,
		Status:       "ASSIGNED",
		Priority:     req.Priority,
		ETAMinutes:   &eta,
		DispatchTime: time.Now(),
	}

	if err := db.CreateMission(r.Context(), mission); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to create mission"})
		return
	}

	// Also update asset status to DISPATCHED
	if err := db.UpdateAssetStatus(r.Context(), assetID, "DISPATCHED"); err != nil {
		log.Printf("Warning: failed to update asset status: %v", err)
	}

	respondJSON(w, http.StatusCreated, mission)
}

func handleGetActiveMissions(w http.ResponseWriter, r *http.Request) {
	missions, err := db.GetActiveMissions(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve missions"})
		return
	}
	respondJSON(w, http.StatusOK, missions)
}

func handleUpdateMissionStatus(w http.ResponseWriter, r *http.Request) {
	missionIDStr := chi.URLParam(r, "id")
	missionID, err := uuid.Parse(missionIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid mission ID"})
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	if err := db.UpdateMissionStatus(r.Context(), missionID, req.Status); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to update mission"})
		return
	}

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Mission status updated"})
}

func handleVerifyNIN(w http.ResponseWriter, r *http.Request, sms service.SMSService) {
	var req VerifyNINRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	tokenUserID, _ := r.Context().Value(middleware.UserIDKey).(string)
	userID, _ := uuid.Parse(tokenUserID)

	nimc := service.NewNIMCService()
	data, err := nimc.VerifyNIN(r.Context(), req.NIN)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Identity provider error: " + err.Error()})
		return
	}

	status := "REJECTED"
	if data.Verified {
		status = "VERIFIED"
	}

	// Create Log
	logRef, _ := nimc.LogIdentityVerification(r.Context(), userID.String(), status)
	vLog := &models.IdentityVerificationLog{
		ID:                 uuid.New(),
		UserID:             userID,
		ProviderReference:  logRef,
		VerificationStatus: status,
	}
	db.CreateIdentityVerificationLog(r.Context(), vLog)

	if !data.Verified {
		respondJSON(w, http.StatusUnprocessableEntity, Response{Success: false, Message: "NIN verification failed: identity not found or data mismatch"})
		return
	}

	// Update User
	if err := db.UpdateUserIdentityStatus(r.Context(), userID, true, "NIMC", logRef); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to update identity status"})
		return
	}

	// Fetch user for phone number to send confirmation SMS
	user, err := db.GetUserByID(r.Context(), userID)
	if err == nil && sms != nil {
		go func() {
			smsMsg := "Trust Level Elevated: Your National Identity (NIN) has been successfully verified. You now have access to classified situational intelligence."
			if err := sms.SendSMS(context.Background(), user.PhoneNumber, smsMsg); err != nil {
				log.Printf("⚠️ Failed to send verification confirmation SMS: %v", err)
			}
		}()
	}

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Identity successfully verified via NIMC"})
}

func handleUpdateDeviceToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	userIDStr, _ := r.Context().Value(middleware.UserIDKey).(string)
	userID, _ := uuid.Parse(userIDStr)

	if err := db.UpdateDeviceFCMToken(r.Context(), userID, req.Token); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to update token"})
		return
	}

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Device token updated"})
}

func handleUpdateLocation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	userIDStr, _ := r.Context().Value(middleware.UserIDKey).(string)
	userID, _ := uuid.Parse(userIDStr)
	if err := db.UpdateUserLocation(r.Context(), userID, req.Latitude, req.Longitude); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to update location"})
		return
	}
	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Location updated"})
}

func handleGetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := db.GetAllUsers(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve users"})
		return
	}
	respondJSON(w, http.StatusOK, users)
}

func handleUpdateUserClearance(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid user ID"})
		return
	}

	var req struct {
		Level string `json:"level"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	if err := db.UpdateUserClearance(r.Context(), userID, req.Level); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to update clearance"})
		return
	}

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "User clearance updated"})
}

func handleUpdateAlertClassification(w http.ResponseWriter, r *http.Request) {
	alertIDStr := chi.URLParam(r, "id")
	alertID, err := uuid.Parse(alertIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid alert ID"})
		return
	}

	var req struct {
		Level string `json:"level"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
		return
	}

	if err := db.UpdateAlertClassification(r.Context(), alertID, req.Level); err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to update classification"})
		return
	}

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Alert classification updated"})
}

func handleGetAuditLogs(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	page := 1
	limit := 20

	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	offset := (page - 1) * limit

	logs, err := db.GetAuditLogs(r.Context(), limit, offset)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve audit logs"})
		return
	}
	respondJSON(w, http.StatusOK, logs)
}

func handleGetRoles(w http.ResponseWriter, r *http.Request) {
	roles := []string{
		"ADMIN",
		"SYSTEM_ADMIN",
		"SECURITY_OFFICER",
		"CYBER_ANALYST",
		"STRATEGIC_PLANNER",
		"TACTICAL_COMMAND",
		"AGENCY_OFFICER",
		"TRADITIONAL_RULER",
		"GOVT_OFFICIAL",
		"CITIZEN",
	}
	respondJSON(w, http.StatusOK, roles)
}

func handleGetPermissions(w http.ResponseWriter, r *http.Request) {
	permissions := []string{
		"READ_ALERTS_UNCLASSIFIED",
		"READ_ALERTS_RESTRICTED",
		"READ_ALERTS_CONFIDENTIAL",
		"READ_ALERTS_SECRET",
		"READ_ALERTS_TOP_SECRET",
		"PROPOSER_ACCESS",
		"APPROVER_ACCESS",
		"DISPATCH_RESOURCES",
		"MANAGE_USERS",
		"AUDIT_VIEWER",
		"SYSTEM_CONFIGURATION",
	}
	respondJSON(w, http.StatusOK, permissions)
}
