# Mission Dispatch Tracking Implementation

This walkthrough details the implementation of real-time mission dispatch and tracking, enhancing the operational capabilities of the Tactical Operational Command dashboard.

## Overview
The "Mission Dispatch" feature allows commanders to assign field assets to specific alerts, monitor their progress in real-time, and track operational ETAs.

## Key Changes

### Database Layer
- Created `platform/schema/018_mission_schema.sql` to define the `missions` table.
- Added indexes for tracking active missions efficiently.

### Backend (Go Core API)
- **Models**: Added `Mission` and `CreateMissionRequest` structs in `backend/core-api/internal/models/models.go`.
- **Repository**: Implemented `CreateMission`, `GetActiveMissions`, and `UpdateMissionStatus` in `backend/core-api/internal/db/repository.go`.
- **API**: Added REST endpoints for mission management:
    - `POST /api/v1/missions`
    - `GET /api/v1/missions/active`
    - `PATCH /api/v1/missions/{id}/status`
- **Asset Integration**: Automatically updates asset status to `DISPATCHED` upon mission creation.

### Frontend (Web Dashboard)
- **API Client**: Added mission-related interfaces and functions to `web/lib/api.ts`.
- **MissionSidebar**: Developed [MissionSidebar.tsx](file:///home/psalmprax/national_security_platform/web/components/MissionSidebar.tsx) to provide a real-time list of active dispatches.
- **Tactical Dashboard Integration**: Integrated the sidebar into [TacticalDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/TacticalDashboard.tsx) and updated the "Tactical Proximity Radar" to use the new Mission API for asset activation.

## Verification

### Backend Stability
The Core API with the new mission logic was successfully built.
```bash
cd backend/core-api && go build ./...
```
Verification result: `Exit code: 0`.

### Database Schema
The schema was applied and the `missions` table is operational.

### UI Integration
Validated the following operational flows:
1. **Asset Activation**: Clicking "Activate" on a triangulated asset now triggers a mission creation and updates the asset status.
2. **Mission Monitoring**: Active missions appear in the new `MissionSidebar`.
3. **Status Transitions**: Missions can be advanced through their lifecycle (ASSIGNED → EN_ROUTE → ON_SITE → COMPLETED) using interactive controls in the sidebar.

## Future Enhancements
- Integrate dynamic ETA calculation using Mapbox routing.
- Real-time mission updates via the SSE (Server-Sent Events) pipeline.
- Visualizing mission paths on the Mapbox map.

---

# Security Hardening: CSP Regulation

Successfully hardened the platform against XSS and policy violations by implementing a strict Content Security Policy.

## Improvements
- **Strict CSP**: Removed `'unsafe-inline'` from `script-src` and `style-src` directives in the Core API middleware.
- **Compliance**: Resolved `WEAK_POLICY` findings flagged by the `Security Sentinel`.

## Verification Results
- **Active Scan**: `Security Sentinel` internal scan returned `PASSED` with 0 issues.
- **SAST**: Static analysis (Bandit/Gosec) confirmed clean code with no high-severity vulnerabilities.
- **Database Logs**: Confirmed `PASSED` entry in the `security_scans` table at `2026-02-02 01:31:38`.

---

# Mobile Service: ADS Settings Integration

Implemented a centralized settings ecosystem for managed acoustic detection, duress protection, and personalization.

## Key Changes
- **SettingsService**: Created a provider-based service for managing persistent preferences using `shared_preferences` and secure storage for PINs.
- **Settings UI**: Developed a comprehensive settings screen with 4 main categories:
  - **Acoustic Detection (ADS)**: Passive monitoring for gunshots/screams.
  - **Advanced Duress**: Strategic configuration for coerced reporting.
  - **Ads & Personalization**: Controls for targeted safety alerts.
  - **General Options**: System diagnostics and cache management.
- **Infrastructure**: Added `shared_preferences` dependency and updated app initialization logic.

## Verification
- **Navigation**: Confirmed the new settings icon in the Panic Screen header correctly navigates to the Settings Screen.
- **State Persistence**: Verified that toggles and sliders persist across application sessions.
- **Secure PIN Storage**: Verified that Duress PINs are saved using the secure storage layer.

---

# Identity Verification Hardening: Enhanced Registration

Reinforced the onboarding process by requiring National Identification Numbers (NIN) and operational context.

## Key Changes
- **Backend (Core API)**:
    - Expanded `RequestAccessRequest` to include `nin`, `state_id`, `lga_id`, `agency_id`, and `rank`.
    - Enhanced `db.CreateUserRequest` and added `db.AddAgencyPersonnel` to persist rich identity data.
- **Mobile Client**:
    - **UI**: Added NIN input validation (numeric), state/LGA dropdowns, and dynamic Agency/Rank fields (shown only for tactical/analyst roles).
    - **Services**: Updated `ApiService` and `AuthService` to transmit the enhanced payload.
- **Data Integrity**: Updated `002_test_data.sql` to ensure all historical test users have valid NIN data.
- **Documentation**: Updated `api_documentation.md` with the new registration schema.

## Verification
- **Form UI**: Verified that Agency/Rank fields correctly toggle based on the chosen role.
- **Database Persistence**: Confirmed that successful registration attempts correctly populate the `users` (nin/state/lga) and `agency_personnel` tables.
- **Schema Validation**: Verified that NIN is stored as a unique string to prevent identity spoofing.

## Phase 2: Full Profile Context
- **Comprehensive Metadata**: Every user role now collects its required authority markers:
    - **Traditional Rulers**: Monarch Grade (1st/2nd/3rd Class) and Domain.
    - **Security Personnel**: Badge Number and Rank.
    - **Universal**: Secure Email and Geospatial (LGA/State) anchoring.
- **Dynamic UX**: The mobile registration screen now intelligently refactors its layout based on the functional role selected, minimizing friction while maximizing data quality.
- **Infrastructure**: Added `email` column to the `users` table via CockroachDB migration.

## Maintenance & Hotfixes
- **Mobile Build Fix**: Resolved a compilation error in `settings_screen.dart` where an invalid `opacity` parameter was passed to `TextStyle`. Replaced with `.withOpacity()` on the color property to ensure compatibility with the Flutter web renderer.
