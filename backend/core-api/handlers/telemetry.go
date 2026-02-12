package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"
)

type SatcomTelemetry struct {
	LinkStatus     string  `json:"linkStatus"`
	Downlink       string  `json:"downlink"`
	Uplink         string  `json:"uplink"`
	Latency        string  `json:"latency"`
	SatelliteID    string  `json:"satelliteId"`
	SignalStrength int     `json:"signalStrength"`
	Timestamp      float64 `json:"timestamp"`
}

// HandleSatcomTelemetry returns server-side simulated telemetry data.
// It uses the current time to generate predictable but shifting values.
func HandleSatcomTelemetry(w http.ResponseWriter, r *http.Request) {
	now := time.Now().UnixNano()
	seconds := float64(now) / float64(time.Second)

	// Use sine waves based on time to create smooth but fluctuating "live" data
	// signalStrength fluctuates between 90 and 100
	signalStrength := int(95 + 5*math.Sin(seconds/10.0))

	// downlink fluctuates around 125 Mbps
	downlink := 125.0 + 10.0*math.Sin(seconds/5.0)

	// uplink fluctuates around 42 Mbps
	uplink := 42.0 + 5.0*math.Sin(seconds/7.0)

	// latency fluctuates between 15ms and 25ms
	latency := int(20 + 5*math.Sin(seconds/15.0))

	telemetry := SatcomTelemetry{
		LinkStatus:     "ACTIVE",
		Downlink:       fmt.Sprintf("%.1f Mbps", downlink),
		Uplink:         fmt.Sprintf("%.1f Mbps", uplink),
		Latency:        fmt.Sprintf("%dms", latency),
		SatelliteID:    "NGR-SAT-1",
		SignalStrength: signalStrength,
		Timestamp:      seconds,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(telemetry)
}
