# National Security Platform: Capability & Performance Roadmap

This roadmap outlines the strategic enhancement of the platform's backend and frontend services to ensure high scalability, real-time intelligence, and operational resilience.

## Phase 1: Foundation & Real-Time Performance (The "Speed" Phase)
**Objective**: Architecture optimization for sub-second latency and high throughput.

### [1.1] Redis Spatial Caching
**Problem**: Complex spatial queries (`ST_Distance` + Suitability Math) are CPU-intensive for the database.
**Solution**: Implement a Redis caching layer for the "Triangulation Engine".
- Cache key: `alert:{id}:triangulation`
- TTL: 30 seconds (dynamic based on asset volatility)
- **Impact**: Reduces DB load by ~80% during high-concurrency incident management.

### [1.2] Server-Sent Events (SSE) Pipeline
**Problem**: Frontend polling (every 30s) allows for critical intelligence gaps.
**Solution**: Replace polling with a unidirectional SSE stream.
- Channel: `/api/v1/events/stream`
- Events: `new_alert`, `asset_movement`, `scan_complete`
- **Impact**: Real-time situational awareness with reduced network overhead.

### [1.3] Spatial Index Tuning (CockroachDB)
**Problem**: default indexes may not be optimized for complex bounding box queries.
**Solution**: Verify and tune spatial indexes on `assets` and `alerts` tables using inverted indexes appropriate for CockroachDB.
- **Impact**: Faster geospatial lookups.

---

## Phase 2: Advanced Capability (The "Intelligence" Phase)
**Objective**: Smarter data processing and granular security controls.

### [2.1] Asynchronous Audit Hashing
**Problem**: Synchronous SHA-256 hashing during alert ingestion adds latency.
**Solution**: Offload hashing to NATS JetStream workers.
- Flow: Core API -> NATS `audit.log` -> Worker (Hash & Store)
- **Impact**: Higher ingestion throughput for the Core API.

### [2.2] Predictive Coverage Analysis
**Problem**: Reactive positioning leaves gaps in security coverage.
**Solution**: A background service analyzing historical asset positions vs. incident clusters.
- **Impact**: Proactive suggestions for asset deployment.

### [2.3] Attribute-Based Access Control (ABAC)
**Problem**: RBAC is too coarse for "Only view assets in *my* sector".
**Solution**: Implement dynamic policy evaluation based on user attributes and resource tags.
- **Impact**: Tighter security compliance for multi-agency operations.

---

## Phase 3: Operational Resilience (The "Interface" Phase)
**Objective**: Ensuring the platform works in degraded environments.

### [3.1] Mapbox Vector Tiles (MVT)
**Problem**: GeoJSON rendering lags with 1000+ points.
**Solution**: Server-side vector tile generation for heavy layers.
- **Impact**: 60fps map interaction at scale.

### [3.2] Offline-First PWA Mode
**Problem**: Field operations often suffer from network intermittency.
**Solution**: Service Workers + IndexedDB for local data persistence.
- **Impact**: Dashboard remains functional during comms blackouts.

### [3.3] Web Workers for Tactical Calculation
**Problem**: Complex filtering freezes the UI thread.
**Solution**: Offload suitability logic to background Web Workers.
- **Impact**: Smooth UI interactions even during heavy data processing.

### [3.4] Tactical Overlay API
**Problem**: Need for weather/infrastructure context.
**Solution**: Standardized WMS/WMTS endpoints for layer ingestion.
- **Impact**: Richer context for decision makers.
