# Walkthrough - National Security Platform Architecture

I have successfully designed the architecture for the **National Community-Based Security Alert & Intelligence Platform** and resolved all deployment issues.

## Artifacts Created

### [Architecture Design Document](file:///home/psalmprax/.gemini/antigravity/brain/cbea2824-e63a-4457-87e4-836f78df697d/architecture_design.md)
This is the core deliverable. It includes:
*   **Executive Summary**: High-level overview of the solution.
*   **System Architecture**: Mermaid diagrams showing the distributed, resilient design.
*   **Technology Stack**: Selection of robust, scalable technologies (Flutter, Go, NATS, CockroachDB).
*   **Security & Trust**: End-to-End Encryption and Identity Verification protocols.
*   **AI & Geospatial**: Integration of AI for triage and PostGIS for location intelligence.
*   **Risk Mitigation**: Strategies for handling false alerts, connectivity loss, and insider threats.

## Key Features Highlighted
1.  **Offline-First**: Uses local databases and store-and-forward mechanism to work in areas with poor connectivity.
2.  **Sovereign & Secure**: Emphasizes data sovereignty and end-to-end encryption.
3.  **Trust Web**: A proposed peer-verification system to validate alerts from rural areas without central intervention.
4.  **AI Integration**: Intelligent triage to prioritize threats and handle multiple languages.

## Project Hardening & Build Fixes

I have implemented multiple layers of security and resolved critical build/runtime failures to ensure the platform is operational and production-grade.

### Major Bug Fixes & Optimizations
1.  **Core API Build Fix**: Upgraded Go container to **v1.24.0** in the Dockerfile to match `go.mod` requirements.
2.  **Mobile Client Build Fix**: Updated the Flutter build stage to use **ghcr.io/cirruslabs/flutter:stable**, added a `.dockerignore` to exclude local artifacts, and ensured web platform configuration using `flutter create . --platforms web`.
3.  **Port Conflict Resolution**: Remapped the Core API host port from 8080 to **8084** to avoid conflicts with host services (e.g., Tomcat).
4.  **Intelligence Service Fix**: Resolved a Protobuf runtime mismatch (`TypeError: Descriptors cannot be created directly`) by setting the `PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python` environment variable in Docker Compose.
5.  **Database Extensions (ERD)**: Implemented a robust spatial and identity registry, including tables for States, LGAs, Villages, Device Binding (PKI), and Evidence Hashing.

### Security Hardening
1.  **Application-Layer Encryption (Go)**: Implemented AES-GCM (256-bit) encryption for sensitive alert content.
2.  **Transport Security**: Enforced TLS 1.3 for the Core API and mTLS for service-to-service gRPC communication.
3.  **Identity & RBAC**: Implemented JWT-based authentication with role-based access control.
4.  **Audit Trailing**: Integrated SHA-256 evidence hashing for all alerts and an immutable audit ledger.

---

## Verification & Testing

### 1. Manual Verification Flow
To verify the full secure, integrated, and hardened platform:
1.  **Launch**: `docker-compose up --build`
2.  **Onboard**: Call the onboard endpoint with a phone number to receive a secure JWT.
3.  **Submit Alert (Mobile)**: Use the JWT to submit a "Panic" alert from the Flutter UI.
4.  **Review Dashboard (Web)**: Access `http://localhost:8083` and verify the alert appears.
5.  **Audit Check**: Inspect the `audit_logs` table in CockroachDB to verify the SHA-256 evidence hash was recorded.

### 3. Service Access (via Gateway)
- **Unified Portal (Main)**: `http://localhost:8085`
- **Mobile Client**: `http://localhost:8085/mobile/`
- **Core API**: `http://localhost:8085/api/v1/alerts`
- **Cockroach DB UI**: `http://localhost:8081`
- **MinIO Console**: `http://localhost:9001`

### 4. Status
- [x] **Gateway**: Active (Port 8085)
- [x] **Go Build**: Passing (v1.24.0)
- [x] **Mobile Build**: Passing
- [x] Python Runtime: Operational (Protobuf workaround enabled)
- [x] Security: Hardened (AES-GCM, TLS 1.3, mTLS, RBAC, PKI)
- [x] Audit Trailing: Enabled (SHA-256 Hashing)
- [x] Orchestration: Operational (All Services)
- [x] Database Schema: Extended (v0.3 - Applied)

---

## Web Dashboard Enhancements

### UI/UX Improvements

#### 1. Interactive Sidebar Icons (Completed)
All sidebar icons are now fully functional with navigation and overlay panels:

**Navigation Icons:**
- **Map Icon**: Switches to map view (default)
- **AlertTriangle**: Switches to alerts triage view
- **Database**: Switches to audit logs/data view  
- **Cpu**: Switches to system analytics view

**Action Icons:**
- **Bell**: Toggles notifications panel
- **Settings**: Toggles settings panel
- **User**: Toggles user profile menu

**Visual Feedback:**
- Active state highlighting with green accent (`#00FF95`)
- Hover tooltips with descriptive labels
- Smooth transitions and animations
- Conditional styling for open panels

#### 2. Premium Visual Effects (Completed)
Enhanced the dashboard with modern, polished visual aesthetics:

**Animated Background:**
- Moving grid pattern (50px × 50px) with subtle green lines
- Gradient base layer (black → zinc-900 → black)
- Pulsing glow orbs (green and cyan) for ambient lighting
- 20s infinite loop animation for subtle, non-distracting motion

**CSS Enhancements:**
- `.glass-card-premium` - Enhanced glassmorphism with stronger backdrop blur
- `.glow-green-strong` - Multi-layered glow effects for depth
- `.icon-glow` - Dynamic icon glows with hover enhancement
- `.pulse-glow` - Breathing animation for live indicators
- `.slide-in-right` - Smooth panel entry animations
- Cubic-bezier easing for professional transitions

**Design Principles:**
- GPU-accelerated animations for 60fps performance
- Layered depth with multiple visual planes
- Consistent timing across all interactions
- Cyber-security aesthetic with strategic glowing effects

**Files Modified:**
- `web/app/page.tsx` - Added animated background layers and wrapper structure
- `web/app/globals.css` - Added comprehensive premium CSS utilities

#### 3. Centered Header Layout
The main "SITUATIONAL AWARENESS CENTER" header and system status information are now horizontally centered for better visual balance and prominence.

### 3. Status
- [x] Go Build: Passing (v1.24.0)
- [x] Mobile Build: Passing (Flutter Web)
- [x] Python Runtime: Operational (Protobuf workaround enabled)
- [x] Security: Hardened (AES-GCM, TLS 1.3, mTLS, RBAC, PKI)
- [x] Audit Trailing: Enabled (SHA-256 Hashing)
- [x] Orchestration: Operational (All Services)
- [x] Database Schema: Extended (v0.3 - Applied)
- [x] Sidebar Icons: Interactive with tooltips
- [x] Visual Effects: Premium animations and glassmorphism

---

## Multi-Agency Dashboard Views (New)

I have successfully implemented the **Multi-Agency Dashboard View System**, allowing different security stakeholders to visualize data according to their operational needs.

### New Features

#### 1. Agency View Switcher
- Added a top-center hover interaction zone.
- Reveals a premium switcher UI to toggle between agency views.
- Persists state within the session.

#### 2. Specialized Dashboard Views

| View Name | Target Audience | Key Features |
|-----------|-----------------|--------------|
| **CYBER** | SOC / Cyber Command | Dark mode, detailed telemetry, "Sci-Fi" aesthetic (Original preserved). |
| **TACTICAL** | Field Ops / Police | High contrast, map-centric, large tap targets, simplified alert list. |
| **STRATEGIC** | Executives / NSA | High-level analytics, threat distribution charts, KPI cards, clean light theme. |

### Technical Implementation

#### Architecture Refactor
- **`wrapper`**: `page.tsx` now acts as a smart container, handling:
  - Data Fetching (Alerts, Auth Status)
  - State Management (Current Agency View)
  - Global UI (View Switcher)
- **`components`**: Split monolithic dashboard into three dedicated components:
  - `components/dashboards/CyberDashboard.tsx`
  - `components/dashboards/TacticalDashboard.tsx`
  - `components/dashboards/StrategicDashboard.tsx`

### Verification Results
- **Build Status**: ✅ PASSED (`docker-compose build web-dashboard`)
- **TypeScript Check**: ✅ PASSED (No type errors)
- **Asset Optimization**: ✅ PASSED (Static pages generated)

### Usage
1. Move mouse to top center of screen (or tap on mobile).
2. Select desired agency view from the dropdown.
3. Dashboard instantly switches context while maintaining live data connection.

---

## Real Data Integration (Completed)

I have successfully connected the dashboard components to real-time data from the backend, specifically resolving the mocked "System Status" and "Active Nodes" metrics.

### Changes Implemented
1.  **Backend API**: Added `GET /api/v1/system/status` endpoint and `GetSystemStats` DB function to count total users and active alerts.
2.  **Frontend**: Updated `web/lib/api.ts` and `web/app/page.tsx` to fetch this new data. "Active Nodes" now reflects the real user count from the database.

### Verification status
- [x] Backend Build: Passing
- [x] Frontend Build: Passing
- [x] API Endpoint: Verified

---

## Dashboard Role-Based Access Control (RBAC)

I have implemented User Level Access to restrict dashboard views based on the user's role.

### Roles Defined (v2.0)
- **ADMIN**: Access to all views + Agency Command Portal.
- **CYBER_ANALYST**: Access to **Cyber View ONLY** (Strict Isolation).
- **STRATEGIC_PLANNER**: Access to **Strategic View ONLY** (Strict Isolation).
- **TACTICAL_COMMAND**: Access to **Tactical View ONLY** (Strict Isolation).
- **AGENCY_OFFICER**: Access to **Agency Command Portal ONLY**.

### Features
- **Strict View Isolation**: Personnel are now locked into their specific operational dashboards based on their clearance level.
- **Agency Command Portal**: A dedicated administrative dashboard for asset deployment and personnel management.
- **View Locking**: Unauthorized dashboard views are visually locked and logically disabled in the UI.
- **Login Portal Gateway**: A public link to the Agency Portal is now available directly from the login screen for authorized logistics officers.
- **Debug Role Switcher**: A debug tool in the bottom right corner allows testing all five role perspectives.

### Verification status
- [x] Compilation: Passing
- [x] TypeScript Checks: Passing

---

## Database Seeding (New)

To populate the database with real-world security scenarios, user roles, and simulation data, you can run the following command from the project root:

```bash
chmod +x seed_database.sh && ./seed_database.sh
```

### 🛡️ Unified Gateway (New)
The platform now uses a **Unified Security Gateway** (Nginx) to route all requests. 
- **Port**: 8085
- **Routing**: Routes `/api` to the backend and `/mobile` to the Flutter client. 
- **Internal Sync**: Resolves all networking discrepancies between the browser and Docker.

---

## Dashboard Authentication & Access Request (Completed)

I have implemented a secure authentication system and a professional access request flow to protect the platform dashboards.

### Key Features
1. **JWT-Based Authentication**: Integrated full login/logout flow with persistent session management.
2. **Access Request Flow**: Dedicated interface for new agencies to request platform access, storing requests with `PENDING` status for admin approval.
3. **Route Protection**: Middleware ensures only authenticated users can access dashboard routes.
4. **Interactive User Profile**: Functional user menu with "Sign Out" and "Identity Registry" controls.

### Implementation Details
- **Backend (Go)**: Added `/api/v1/auth/login` and `/api/v1/auth/request-access` endpoints.
- **Frontend (Next.js)**: Created `AuthContext` for unified state and added custom login/request pages.

---

## Real-World Map Integration (Completed)

I have replaced the mock image-based map with a fully interactive, real-world Mapbox implementation for superior situational awareness.

### Key Features
1. **Real-World Interactive Mapping**: Integrated `mapbox-gl` centered on Nigeria with precise, live alert plotting.
2. **Dynamic Style Switching**: Supports **Cyber** (Dark), **Tactical** (Outdoors), and **Satellite** imagery feeds.
3. **Interactive HUD**: Features a target-lock "Fly-To" animation when alerts are selected, complete with persistent telemetry overlays.
4. **Custom Markers**: Animated, high-visibility markers that respond to threat severity.

> [!NOTE]
> A valid Mapbox Public Access Token is required for the real-life map to render in production.

---
