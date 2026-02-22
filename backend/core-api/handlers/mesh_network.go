package handlers

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"sync"
	"time"
)

// MeshNode represents a node in the mesh network
type MeshNode struct {
	ID          string   `json:"id"`
	Label       string   `json:"label"`
	Status      string   `json:"status"` // "online", "offline", "relay"
	Latency     float64  `json:"latency"`
	Connections []string `json:"connections"`
	Type        string   `json:"type"` // "HUB", "NODE", "LORA", "SATELLITE"
	Location    string   `json:"location"`
}

// MeshNetworkStatus represents the overall mesh network status
type MeshNetworkStatus struct {
	Nodes            []MeshNode `json:"nodes"`
	ReliabilityIndex float64    `json:"reliability_index"`
	LastUpdated      time.Time  `json:"last_updated"`
	TotalNodes       int        `json:"total_nodes"`
	OnlineNodes      int        `json:"online_nodes"`
	BackhaulType     string     `json:"backhaul_type"`
	LocalMeshType    string     `json:"local_mesh_type"`
}

// MeshNetworkHandler handles mesh network status requests
type MeshNetworkHandler struct {
	mu         sync.RWMutex
	meshStatus *MeshNetworkStatus
	lastUpdate time.Time
}

// NewMeshNetworkHandler creates a new mesh network handler
func NewMeshNetworkHandler() *MeshNetworkHandler {
	handler := &MeshNetworkHandler{
		meshStatus: initializeMeshNetwork(),
		lastUpdate: time.Now(),
	}

	// Start background simulation
	go handler.simulateNetworkChanges()

	return handler
}

func initializeMeshNetwork() *MeshNetworkStatus {
	return &MeshNetworkStatus{
		Nodes: []MeshNode{
			{ID: "1", Label: "HUB-ALPHA", Status: "online", Latency: 42, Connections: []string{"2", "3"}, Type: "HUB", Location: "Command Center"},
			{ID: "2", Label: "NODE-02", Status: "online", Latency: 85, Connections: []string{"1", "4"}, Type: "NODE", Location: "Sector A"},
			{ID: "3", Label: "NODE-03", Status: "relay", Latency: 120, Connections: []string{"1"}, Type: "NODE", Location: "Sector B"},
			{ID: "4", Label: "LORA-RELAY", Status: "online", Latency: 450, Connections: []string{"2"}, Type: "LORA", Location: "Remote Outpost"},
			{ID: "5", Label: "SAT-GATEWAY", Status: "online", Latency: 380, Connections: []string{"1", "3"}, Type: "SATELLITE", Location: "Orbital"},
			{ID: "6", Label: "FIELD-UNIT-01", Status: "online", Latency: 95, Connections: []string{"2", "5"}, Type: "NODE", Location: "Mobile Unit"},
			{ID: "7", Label: "FIELD-UNIT-02", Status: "offline", Latency: 0, Connections: []string{}, Type: "NODE", Location: "Unknown"},
			{ID: "8", Label: "LORA-RELAY-02", Status: "relay", Latency: 380, Connections: []string{"4"}, Type: "LORA", Location: "Sector C"},
		},
		ReliabilityIndex: 98.4,
		LastUpdated:      time.Now(),
		TotalNodes:       8,
		OnlineNodes:      7,
		BackhaulType:     "SATELLITE",
		LocalMeshType:    "LORA/P2P",
	}
}

// simulateNetworkChanges simulates network changes in the background
func (h *MeshNetworkHandler) simulateNetworkChanges() {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		h.mu.Lock()

		// Randomly update latencies for online nodes
		for i := range h.meshStatus.Nodes {
			if h.meshStatus.Nodes[i].Status == "online" || h.meshStatus.Nodes[i].Status == "relay" {
				// Add random fluctuation (-5 to +5 ms)
				change := (rand.Float64() * 10) - 5
				h.meshStatus.Nodes[i].Latency = max(30, h.meshStatus.Nodes[i].Latency+change)
			}
		}

		// Occasionally change a node status
		if rand.Float64() > 0.9 {
			randomIdx := rand.Intn(len(h.meshStatus.Nodes))
			if h.meshStatus.Nodes[randomIdx].Status != "HUB" {
				// 10% chance to toggle status
				if h.meshStatus.Nodes[randomIdx].Status == "online" {
					h.meshStatus.Nodes[randomIdx].Status = "offline"
					h.meshStatus.Nodes[randomIdx].Latency = 0
				} else if h.meshStatus.Nodes[randomIdx].Status == "offline" {
					h.meshStatus.Nodes[randomIdx].Status = "online"
					h.meshStatus.Nodes[randomIdx].Latency = 100 + rand.Float64()*100
				}
			}
		}

		// Update counts
		online := 0
		for _, n := range h.meshStatus.Nodes {
			if n.Status == "online" || n.Status == "relay" {
				online++
			}
		}
		h.meshStatus.OnlineNodes = online
		h.meshStatus.ReliabilityIndex = float64(online) / float64(h.meshStatus.TotalNodes) * 100
		h.meshStatus.LastUpdated = time.Now()

		h.mu.Unlock()
	}
}

// GetMeshNetworkStatus returns the current mesh network status
func (h *MeshNetworkHandler) GetMeshNetworkStatus(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache")

	json.NewEncoder(w).Encode(h.meshStatus)
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}
