package agency

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"national_security_platform/backend/core-api/internal/db"
	"national_security_platform/backend/core-api/internal/models"

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
		LastUpdatedAt: time.Now(),
		CreatedAt:     time.Now(),
	}

	if err := db.CreateAsset(r.Context(), asset); err != nil {
		log.Printf("Failed to create asset: %v", err)
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to create asset"})
		return
	}

	respondJSON(w, http.StatusCreated, Response{Success: true, Message: "Asset created successfully", Data: asset})
}

// ListAssetsHandler retrieves all assets
func ListAssetsHandler(w http.ResponseWriter, r *http.Request) {
	assets, err := db.GetAllAssets(r.Context())
	if err != nil {
		log.Printf("Failed to retrieve assets: %v", err)
		respondJSON(w, http.StatusInternalServerError, Response{Success: false, Message: "Failed to retrieve assets"})
		return
	}

	respondJSON(w, http.StatusOK, assets)
}
