package main

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"national_security_platform/backend/core-api/internal/db"
	igrpc "national_security_platform/backend/core-api/internal/grpc"
	"national_security_platform/backend/core-api/internal/middleware"
	"national_security_platform/backend/core-api/internal/models"
	"national_security_platform/backend/core-api/internal/mq"
	"national_security_platform/backend/core-api/internal/security"
	"national_security_platform/backend/core-api/internal/service"
	proto "national_security_platform/backend/core-api/pkg"

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

	// Initialize NATS
	if err := mq.InitNATS(); err != nil {
		log.Printf("⚠️ Warning: Failed to initialize NATS: %v", err)
		// We don't fatal here to allow partial functionality
	}
	defer mq.Close()

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

	// Setup routes
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("National Security Platform - Core API (Golang) is Running!"))
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	http.HandleFunc("/api/v1/alerts", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS for web dashboard
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		// GET - Retrieve recent alerts (for dashboard)
		if r.Method == http.MethodGet {
			log.Printf("📥 Dashboard fetching alerts (Client: %s)", r.RemoteAddr)
			alerts, err := db.GetRecentAlerts(context.Background(), 50)
			if err != nil {
				log.Printf("Error retrieving alerts: %v", err)
				respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve alerts"})
				return
			}
			respondJSON(w, http.StatusOK, alerts)
			return
		}

		// POST - Submit new alert (requires authentication)
		if r.Method == http.MethodPost {
			// Apply auth middleware manually for POST requests
			tokenUserID, ok := r.Context().Value(middleware.UserIDKey).(string)
			if !ok {
				// Extract and verify token
				authHeader := r.Header.Get("Authorization")
				if authHeader == "" {
					respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Missing authorization"})
					return
				}
				// For now, skip auth for development - in production, verify JWT here
			}

			var req SubmitAlertRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
				return
			}

			// Security: Match UserID from Token with UserID from Request (skip in dev if no auth)
			if tokenUserID != "" && tokenUserID != req.UserID {
				respondJSON(w, http.StatusForbidden, Response{Success: false, Message: "Identity mismatch"})
				return
			}

			userID, err := uuid.Parse(req.UserID)
			if err != nil {
				respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid user ID"})
				return
			}

			alert, err := alertService.SubmitAlert(context.Background(), userID, req.AlertType, req.Latitude, req.Longitude, req.Content)
			if err != nil {
				log.Printf("Error submitting alert: %v", err)
				respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to submit alert"})
				return
			}

			// Opportunistic Intelligence Analysis via gRPC
			if intelClient != nil {
				go func() {
					resp, err := intelClient.AnalyzeAlert(context.Background(), alert.ID.String(), req.Content, "en")
					if err != nil {
						log.Printf("Failed to analyze alert %s: %v", alert.ID, err)
						return
					}
					log.Printf("🔍 Intelligence Analysis for %s: Severity=%.2f, Category=%s", alert.ID, resp.SeverityScore, resp.Category)
				}()
			}

			respondJSON(w, http.StatusCreated, Response{
				Success:    true,
				Message:    "Alert submitted successfully",
				TrackingID: alert.ID.String(),
			})
			return
		}

		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	})

	// Helper for authentication logic to be reused
	authenticateUser := func(ctx context.Context, phoneNumber, password string) (*models.User, error) {
		if !strings.HasPrefix(phoneNumber, "+") {
			phoneNumber = "+" + phoneNumber
		}

		user, err := db.GetUserByPhoneNumber(ctx, phoneNumber)
		if err != nil {
			return nil, err // User not found
		}

		if user.Status != "ACTIVE" {
			log.Printf("❌ Login failed: Account status is %s for user=%s", user.Status, user.ID)
			return nil, bcrypt.ErrMismatchedHashAndPassword // Treat as auth failure generic
		}

		if user.PasswordHash == nil {
			return nil, bcrypt.ErrMismatchedHashAndPassword
		}

		err = bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password))
		if err != nil {
			return nil, err
		}

		return user, nil
	}

	http.HandleFunc("/api/v1/auth/login", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
			return
		}

		log.Printf("🔐 Mobile Login attempt: phone=%s from client=%s", req.PhoneNumber, r.RemoteAddr)

		user, err := authenticateUser(context.Background(), req.PhoneNumber, req.Password)
		if err != nil {
			log.Printf("❌ Mobile Login failed: %v", err)
			respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Invalid credentials"})
			return
		}

		log.Printf("✅ Mobile Login successful: user=%s, role=%s", user.ID, user.Role)

		token, err := security.GenerateToken(user.ID, user.Role)
		if err != nil {
			respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Token generation failed"})
			return
		}

		respondJSON(w, http.StatusOK, Response{
			Success: true,
			Message: "Login successful",
			Token:   token,
		})
	})

	http.HandleFunc("/api/v1/auth/dashboard-login", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
			return
		}

		log.Printf("🔐 Dashboard Login attempt: phone=%s form client=%s", req.PhoneNumber, r.RemoteAddr)

		user, err := authenticateUser(context.Background(), req.PhoneNumber, req.Password)
		if err != nil {
			log.Printf("❌ Dashboard Login failed: %v", err)
			respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Invalid credentials"})
			return
		}

		// STRICT ROLE CHECK FOR DASHBOARD
		allowedRoles := map[string]bool{
			"ADMIN":             true,
			"CYBER_ANALYST":     true,
			"STRATEGIC_PLANNER": true,
			"TACTICAL_COMMAND":  true, // Allowed as they have a dashboard view
		}

		if !allowedRoles[user.Role] {
			log.Printf("⛔ Dashboard Login DENIED: Role %s is not authorized for dashboard access. User=%s", user.Role, user.ID)
			respondJSON(w, http.StatusForbidden, Response{Success: false, Message: "Access Denied: Your role is not authorized for the command dashboard."})
			return
		}

		log.Printf("✅ Dashboard Login successful: user=%s, role=%s", user.ID, user.Role)

		token, err := security.GenerateToken(user.ID, user.Role)
		if err != nil {
			respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Token generation failed"})
			return
		}

		respondJSON(w, http.StatusOK, Response{
			Success: true,
			Message: "Dashboard Access Granted",
			Token:   token,
		})
	})

	http.HandleFunc("/api/v1/auth/request-access", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req RequestAccessRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request"})
			return
		}

		// Hash password
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
			TrustScore:     0.1, // Initial low trust for new requests
			ClearanceLevel: "UNCLASSIFIED",
		}

		err = db.CreateUserRequest(context.Background(), user)
		if err != nil {
			log.Printf("Failed to create user request: %v", err)
			respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to submit request"})
			return
		}

		respondJSON(w, http.StatusCreated, Response{
			Success: true,
			Message: "Registration request submitted. Awaiting approval.",
		})
	})

	http.HandleFunc("/api/v1/auth/onboard", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req OnboardRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request body"})
			return
		}

		// 1. Verify PKI Signature (Proof of Possession)
		// We verify that the signature provided is a valid signature of the HWID made by the provided PublicKey
		isValid, err := security.VerifySignature(req.PublicKey, req.DeviceHWID, req.Signature)
		if err != nil || !isValid {
			log.Printf("❌ Onboarding failed: Signature verification failed for HWID=%s. Error: %v", req.DeviceHWID, err)
			respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Cryptographic verification failed"})
			return
		}

		userID, err := uuid.Parse(req.UserID)
		if err != nil {
			respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid user ID"})
			return
		}

		// 2. Register/Bind Device in Database
		device := &models.Device{
			ID:          uuid.New(),
			UserID:      userID,
			HWID:        req.DeviceHWID,
			PublicKey:   req.PublicKey,
			DeviceModel: req.DeviceModel,
			OSVersion:   req.OSVersion,
			Status:      "ACTIVE",
			LastSeenAt:  nil,
		}

		err = db.RegisterDevice(context.Background(), device)
		if err != nil {
			log.Printf("❌ Onboarding failed: Database error for HWID=%s: %v", req.DeviceHWID, err)
			respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Internal server error during registration"})
			return
		}

		log.Printf("✅ Node Bound Successfully: HWID=%s, UserID=%s", req.DeviceHWID, req.UserID)
		respondJSON(w, http.StatusOK, Response{
			Success: true,
			Message: "Hardware node successfully bound and verified",
		})
	})

	http.HandleFunc("/api/v1/auth/me", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Missing authorization"})
			return
		}

		// Remove "Bearer " prefix if present
		tokenString := authHeader
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
		}

		claims, err := security.VerifyToken(tokenString)
		if err != nil {
			respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Invalid token"})
			return
		}

		userID, _ := uuid.Parse(claims.UserID)
		user, err := db.GetUserByID(context.Background(), userID)
		if err != nil {
			respondJSON(w, http.StatusNotFound, Response{Success: false, Message: "User not found"})
			return
		}

		respondJSON(w, http.StatusOK, user)
	})

	http.HandleFunc("/api/v1/system/status", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		log.Printf("📊 Dashboard fetching system status")
		stats, err := db.GetSystemStats(context.Background())
		if err != nil {
			log.Printf("Error retrieving system stats: %v", err)
			respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve system stats"})
			return
		}

		respondJSON(w, http.StatusOK, stats)
	})

	http.HandleFunc("/api/v1/system/nodes", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		log.Printf("📥 Dashboard fetching trusted nodes")
		devices, err := db.GetAllDevices(context.Background())
		if err != nil {
			log.Printf("Error retrieving devices: %v", err)
			respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve trusted nodes"})
			return
		}

		respondJSON(w, http.StatusOK, devices)
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

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
