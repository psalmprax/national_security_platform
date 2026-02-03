package agency

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"national_security_platform/backend/core-api/internal/audit"
	"national_security_platform/backend/core-api/internal/db"
	"national_security_platform/backend/core-api/internal/middleware"
	"national_security_platform/backend/core-api/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CreateAgencyRequest struct {
	Name              string `json:"name"`
	Acronym           string `json:"acronym"`
	Type              string `json:"type"` // POLICE, MILITARY, etc.
	JurisdictionScope string `json:"jurisdiction_scope"`
	HQAddress         string `json:"hq_address"`
	ContactPhone      string `json:"contact_phone"`
}

type CreateAssetRequest struct {
	AgencyID      string  `json:"agency_id"`
	Name          string  `json:"name"`
	Type          string  `json:"type"` // STATION, CHECKPOINT, etc.
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	Status        string  `json:"status"`
	Description   string  `json:"description"`
	CallSign      string  `json:"call_sign"`
	CapacityLevel int     `json:"capacity_level"`
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

func respondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

// RegisterAgencyHandler handles the creation of a new agency
func RegisterAgencyHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateAgencyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request body"})
		return
	}

	agency := models.Agency{
		ID:                uuid.New(),
		Name:              req.Name,
		Acronym:           &req.Acronym,
		Type:              req.Type,
		JurisdictionScope: req.JurisdictionScope,
		HQAddress:         &req.HQAddress,
		ContactPhone:      &req.ContactPhone,
		CreatedAt:         time.Now(),
	}

	if err := db.CreateAgency(r.Context(), agency); err != nil {
		log.Printf("Failed to create agency: %v", err)
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to create agency"})
		return
	}

	respondJSON(w, http.StatusCreated, Response{Success: true, Message: "Agency registered successfully", Data: agency})
}

// CreateAssetHandler handles the creation of a new asset
func CreateAssetHandler(w http.ResponseWriter, r *http.Request) {
	var req CreateAssetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid request body"})
		return
	}

	agencyID, err := uuid.Parse(req.AgencyID)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid agency ID"})
		return
	}

	asset := models.Asset{
		ID:            uuid.New(),
		AgencyID:      agencyID,
		Name:          req.Name,
		Type:          req.Type,
		Latitude:      req.Latitude,
		Longitude:     req.Longitude,
		Status:        req.Status,
		Description:   &req.Description,
		CallSign:      &req.CallSign,
		CapacityLevel: req.CapacityLevel,
		UpdatedAt:     time.Now(),
		CreatedAt:     time.Now(),
	}

	if err := db.CreateAsset(r.Context(), asset); err != nil {
		log.Printf("Failed to create asset: %v", err)
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to create asset"})
		return
	}

	respondJSON(w, http.StatusCreated, Response{Success: true, Message: "Asset created successfully", Data: asset})
}

// ListAssetsHandler retrieves assets based on user role (Agency-Specific vs Global)
func ListAssetsHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Check User Role
	userRole, ok := r.Context().Value(middleware.UserRoleKey).(string)
	if !ok {
		// Should be caught by AuthMiddleware, but for safety:
		respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "Unauthorized"})
		return
	}

	// 2. Filter for Agency Officers
	if userRole == "AGENCY_OFFICER" {
		userIDStr, ok := r.Context().Value(middleware.UserIDKey).(string)
		if !ok {
			respondJSON(w, http.StatusUnauthorized, Response{Success: false, Message: "User ID not found in context"})
			return
		}
		userID, _ := uuid.Parse(userIDStr)

		// Get User's Agency
		agencyInfo, err := db.GetUserAgencyInfo(r.Context(), userID)
		if err != nil {
			log.Printf("Failed to get agency for user %s: %v", userID, err)
			respondJSON(w, http.StatusForbidden, Response{Success: false, Message: "You are not assigned to any agency"})
			return
		}

		// Get Agency Assets
		assets, err := db.GetAssetsByAgency(r.Context(), agencyInfo.ID)
		if err != nil {
			log.Printf("Failed to retrieve agency assets: %v", err)
			respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve agency assets"})
			return
		}
		respondJSON(w, http.StatusOK, assets)
		return
	}

	// 3. Admin/Strategic View (Global)
	assets, err := db.GetAllAssets(r.Context())
	if err != nil {
		log.Printf("Failed to retrieve assets: %v", err)
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve assets"})
		return
	}

	respondJSON(w, http.StatusOK, assets)
}

// DispatchAssetHandler activates/dispatches an asset
func DispatchAssetHandler(w http.ResponseWriter, r *http.Request) {
	assetIDStr := chi.URLParam(r, "id")
	assetID, err := uuid.Parse(assetIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, Response{Success: false, Message: "Invalid asset ID"})
		return
	}

	// 1. Update Status
	if err := db.UpdateAssetStatus(r.Context(), assetID, "DISPATCHED"); err != nil {
		log.Printf("Failed to dispatch asset: %v", err)
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to update asset status"})
		return
	}

	// 2. Create Audit Log
	// We need an actor ID. For now, we'll try to extract it from context or use a system ID if missing for this MVP.
	// ideally, middleware populates "user_id" in context.
	// middleware.UserIDKey might need to be imported or we just get it as string.
	// But `agency` package doesn't see `middleware`.
	// We'll skip the actor ID for the *strict* audit log check for this specific MVP step
	// or just use a nil UUID/zero UUID if not found, since the `db` package is imported.
	// Let's check `CreateAuditLog` signature: uses `actorID uuid.UUID`.

	// Quick fix: generate a random one or use nil if allow. User ID is usually in context.
	// Let's try to get it from header or just ignore for the "Success" response part to keep it simple
	// and consistent with specific instructions "Create Audit Log entry".

	// We will use a placeholder UUID for the system/API action for now to avoid circular dependency or context key import issues
	// unless we move the handler to main or make `middleware` available.
	// Actually `db.CreateAuditLog` is available.

	// 2. Create Audit Log
	auditAction := "ASSET_DISPATCH"
	auditChanges := map[string]string{"status": "DISPATCHED"}

	// Get User ID from context (set by AuthMiddleware)
	var actorID uuid.UUID
	if val, ok := r.Context().Value(middleware.UserIDKey).(string); ok {
		if id, err := uuid.Parse(val); err == nil {
			actorID = id
		}
	}

	// Use async audit logging
	if err := audit.LogAction(r.Context(), actorID, assetID, auditAction, auditChanges, "CONFIDENTIAL"); err != nil {
		log.Printf("Failed to publish audit log: %v", err)
	}

	respondJSON(w, http.StatusOK, Response{Success: true, Message: "Asset dispatched successfully"})
}
