# Implementation Plan - National Security Platform

This document provides a comprehensive record of all implementation phases for the National Security Platform, from foundation to future enhancements.

---

## Phase 1: Foundation & Core Infrastructure ✅ COMPLETE

Built the foundational architecture and core services for the platform.

### What Was Implemented

#### Infrastructure
- **Docker Compose Orchestration**: Multi-service container orchestration with health checks
- **CockroachDB**: Distributed SQL database with spatial extensions (PostGIS)
- **MinIO**: S3-compatible object storage for media/evidence
- **NATS JetStream**: Event streaming infrastructure

#### Backend - Core API (Go)
- RESTful API with Gin framework
- Basic alert ingestion endpoints
- Database schema v0.1 with tables:
  - `users` - User registry
  - `alerts` - Alert submissions
  - `devices` - Device bindings
  - `audit_logs` - Activity tracking

#### Mobile Client (Flutter)
- Flutter web-based mobile client
- Basic alert submission UI
- Offline-first architecture with local SQLite
- Multi-platform support (Android, iOS, Web)

#### Web Dashboard (Next.js)
- Real-time situational awareness dashboard
- Mapbox GL JS integration for geospatial visualization
- Live alert display with auto-refresh

### Port Assignments
- Core API: `8084`
- Mobile Client: `8082`
- Web Dashboard: `3000` (internal), `8083` (external)
- CockroachDB UI: `8081`
- MinIO Console: `9001`

---

## Phase 2: Intelligence Layer ✅ COMPLETE

Added AI-powered intelligence analysis and enhanced data models.

### What Was Implemented

#### Intelligence Service (Python)
- Python-based AI analysis service
- gRPC server for inter-service communication
- Mock threat classification models
- Alert severity scoring
- Entity extraction from alert content

#### Database Schema v0.2
Extended schema with:
- `media_attachments` - Evidence storage metadata
- `corroborations` - Peer verification system
- `states`, `lgas`, `villages` - Geographical hierarchy
- Spatial indexes for geospatial queries

#### Enhanced Core API
- Integration with Intelligence Service via gRPC
- Media upload endpoints
- Enhanced alert metadata (priority_class, threat_level)

---

## Phase 3: Security Hardening ✅ COMPLETE

Implemented comprehensive security measures for data protection and trust.

### What Was Implemented

#### Application-Layer Encryption
- AES-GCM (256-bit) encryption for sensitive alert content
- Field-level encryption before database storage
- Secure key management

#### Transport Security
- TLS 1.3 enforcement for Core API
- mTLS for service-to-service gRPC communication
- Certificate-based authentication

#### Identity & Access Control
- JWT-based authentication with role-based access control (RBAC)
- Device fingerprinting and hardware ID (HWID) binding
- PKI registry for trusted device management
- Multi-factor authentication support

#### Audit & Accountability
- SHA-256 evidence hashing for all alerts
- Immutable audit ledger (write-once-read-many)
- Comprehensive activity logging
- Non-repudiation through digital signatures

#### Database Schema v0.3
- Enhanced security fields in all tables
- `signature` and `content_hash` columns
- `trust_score` for user reliability tracking
- `duress_flag` for panic PIN detection

---

## Phase 4: Event-Driven Architecture ✅ COMPLETE

Established asynchronous event-driven communication between services.

### What Was Implemented

#### NATS JetStream Integration
- Event bus for decoupled service communication
- Persistent message queuing
- Stream processing for alert events
- Consumer groups for parallel processing

#### gRPC Service Communication
- Bidirectional streaming between Core API and Intelligence Service
- Protocol Buffers for efficient serialization
- Service discovery and health checks
- Error handling and retry logic

#### Real-Time Features
- Live alert updates via WebSocket/SSE
- Event-driven dashboard refresh
- Asynchronous AI analysis pipeline

### Bug Fixes & Optimizations
- **Go Version Upgrade**: Updated to Go 1.24.0 for latest features
- **Flutter Build Fix**: Migrated to `cirruslabs/flutter:stable` image
- **Port Conflict Resolution**: Remapped Core API from 8080 → 8084
- **Protobuf Fix**: Resolved Python descriptor creation error with `PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python`
- **Docker Optimization**: Added `.dockerignore` to reduce build context size

---

## Phase 5: Advanced Encryption & Security 🔄 PLANNED

Further security hardening to ensure data sovereignty, privacy, and integrity.

### Proposed Changes

#### [Component] Core API (Go)
- **Field-Level Encryption (FLE)**: Encrypt sensitive fields individually for granular access control
- **TLS 1.3 Only**: Disable legacy TLS versions, use only secure cipher suites
- **NIN Verification**: Integrate National Identity Number mock-verification middleware

#### [Component] Intelligence Service (Python)
- **mTLS Enforcement**: Require client certificates for all gRPC calls
- **Secret Vault**: Migrate from environment variables to HashiCorp Vault or similar

#### [Component] Infrastructure
- **CockroachDB Encryption-at-Rest**: Enable volume encryption
- **NATS Token Auth**: Implement token-based authentication for clients

### Verification Plan

#### Automated Tests
1. Run `gosec` security scanner on Core API
2. Verify mTLS rejection of unauthenticated gRPC calls
3. Verify encrypted database content is unreadable without keys

#### Manual Verification
1. Validate TLS 1.3 handshake with `openssl s_client`
2. Test NATS connection rejection for unauthorized clients

---

## Dashboard Agency Views - Multi-Agency Support 🔄 PLANNED

Implement distinct dashboard versions tailored for different security agencies (Cyber, Tactical, Strategic).

### User Review Required

> [!NOTE]
> **Proposed Agency Views**
> 1. **Cyber Command (Current)**: Dark, neon, "hacker" aesthetic. Best for SOC/Cyber ops.
> 2. **Tactical Operations (Police/Army)**: High-contrast, map-centric, fewer distractions. Best for field command.
> 3. **Strategic Intelligence (Executive/NSA)**: Analytics-heavy, clean data visualization, report generation. Best for decision makers.

### Proposed Changes

#### [Components] Web Dashboard (Next.js)

#### [NEW] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Refactor of current `page.tsx` content into a reusable component.

#### [NEW] [TacticalDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/TacticalDashboard.tsx)
- New simplified, high-visibility layout.
- Focus on Map and Alerts.
- Light/High-Contrast mode support.

#### [NEW] [StrategicDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/StrategicDashboard.tsx)
- New analytics-focused layout.
- Grid of charts and summary metrics (using `recharts` or similar if needed, or custom SVG).

#### [MODIFY] [page.tsx](file:///home/psalmprax/national_security_platform/web/app/page.tsx)
- Add "Agency View Toggle" to the UI (top bar or settings).
- State management for `currentAgencyView`.
- Conditional rendering of the selected dashboard component.

### Verification Plan

#### Manual Verification
1. Toggle between "Cyber", "Tactical", and "Strategic" views.
2. Verify state persistence (optional: save to local storage).
3. Ensure "Cyber" view remains identical to previous version.

---

## Dashboard Sidebar Icons - Interactive Navigation ✅ COMPLETE

Add interactive functionality to dashboard sidebar icons for improved UX.

### User Review Required

> [!IMPORTANT]
> **Icon Functionality Mapping**
> 
> Proposed functionality for each icon:
> 
> 1. **Map Icon** - Switch to map view (default/current view)
> 2. **AlertTriangle** - Switch to alerts list/triage view
> 3. **Database** - Switch to audit logs/data view
> 4. **Cpu** - Switch to system analytics/performance view
> 5. **Bell** - Toggle notifications panel
> 6. **Settings** - Open settings panel/modal
> 7. **User** - Open user profile/account menu

### Proposed Changes

#### [MODIFY] [page.tsx](file:///home/psalmprax/national_security_platform/web/app/page.tsx)

**Implementation Details:**
- Add `activeView` state: `'map' | 'alerts' | 'data' | 'analytics'`
- Add toggle states: `showNotifications`, `showSettings`, `showUserMenu`
- Implement click handlers for all sidebar icons
- Add visual feedback (highlighting) for active view
- Create conditional rendering for different main content areas
- Build placeholder views for:
  - Alerts list/triage view
  - Audit logs/data view
  - System analytics/performance view
- Create slide-out panels for:
  - Notifications
  - Settings
  - User profile menu

### Verification Plan

#### Automated Tests
- `npm run build` - Verify TypeScript compilation

#### Manual Verification
- Click each icon and verify correct action
- Verify active icon highlighting
- Verify view switching (Map, Alerts, Data, Analytics)
- Verify panel toggling (Bell, Settings, User)
- Verify smooth transitions and animations

---

## Summary

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| **Phase 1** | ✅ Complete | Foundation, Core API, Mobile Client, Dashboard, Database |
| **Phase 2** | ✅ Complete | Intelligence Service, AI Analysis, Enhanced Schema |
| **Phase 3** | ✅ Complete | Encryption, Identity, RBAC, Audit Logs |
| **Phase 4** | ✅ Complete | gRPC, NATS JetStream, Event-Driven Architecture |
| **Phase 5** | 🔄 Planned | Advanced Security, NIN Integration, Vault |
| **Dashboard Icons** | 🔄 Planned | Interactive Sidebar Navigation |

## Dashboard Data Integration - Real-time Feeds 🔄 PLANNED

Connect static dashboard components to real-time data feeds derived from alert telemetry.

### User Review Required

> [!NOTE]
> **Data Simulation Strategy**
> Since the backend does not currently provide system-level metrics (e.g., latency, active agent count) or historical analytics, these values will be **dynamically calculated** from the live alert feed:
> - **Threat Distribution**: Calculated from  frequencies.
> - **Trend Analysis**: Binned from alert timestamps.
> - **Active Agents**: Inferred from "Trusted Devices" count.
> - **Notifications**: Generated from latest alerts.

### Proposed Changes

#### [MODIFY] [StrategicDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/StrategicDashboard.tsx)
- Implement  hooks to calculate:
  -  (Pie Chart data)
  -  (Bar Chart data)
- Connect "Recent Reports" to actual PDF generation (or just properly link to alert details).

#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Populate "Notifications" panel with real recent alerts.
- Update "System Analytics" to use calculated stats.

#### [MODIFY] [TacticalDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/TacticalDashboard.tsx)
- Ensure all overlay counts match live data.

### Verification Plan

#### Manual Verification
1. Verify charts update when new alerts arrive (simulated or real).
2. Verify "Notifications" panel reflects recent activity.
3. Verify "Active Agents" count matches trusted device count.
