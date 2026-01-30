# System Analysis & Audit Enhancements

This plan covers the implementation of specialized reports and audit trail improvements in the Cyber Dashboard.

## Proposed Changes

### 1. Sector Report Generation (Verified)
Implementation of a report generation tool for security administrators to analyze threats by sector.

#### [MODIFY] [main.go](file:///home/psalmprax/national_security_platform/backend/core-api/cmd/server/main.go)
- Implement `handleGetSectorReport` endpoint at `/api/v1/system/reports/sector`.
- Aggregate alert counts by sector using SQL `GROUP BY`.
- Enforce `ADMIN` role access.

#### [MODIFY] [TriageSidebar.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Add "Generate Sector Report" functionality within the Intelligence Triage sidebar.
- Implement report display modal.

---

### 2. Sentinel Audit Ledger Pagination (Completed)
Implementation of pagination for the security scan ledger to optimize performance and usability.

#### [MODIFY] [repository.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/db/repository.go)
- Update `GetRecentSecurityScans` to support `limit` and `offset` parameters.
- Add `OFFSET` clause to the SQL query.

#### [MODIFY] [main.go](file:///home/psalmprax/national_security_platform/backend/core-api/cmd/server/main.go)
- Update `handleGetSecurityScans` to parse `page` and `limit` from URL query parameters.
- Calculate database offset: `(page - 1) * limit`.

#### [MODIFY] [api.ts](file:///home/psalmprax/national_security_platform/web/lib/api.ts)
- Update `fetchSecurityScans` to accept `page` and `limit`.

#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Add reactivity to `currentPage` state.
- Implement Previous/Next buttons with theme-consistent styling.
- Add page indicator for navigation context.

### 3. Response Team Triangulation (Completed)
Identification of the most suitable response teams (Assets) for an incident based on spatial and capability metrics.

#### [MODIFY] [models.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/models/models.go)
- Add `TriangulatedAsset` struct with distance and suitability metrics.

#### [MODIFY] [repository.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/db/repository.go)
- Implement `GetTriangulatedAssets` using PostGIS/CockroachDB spatial functions.

#### [MODIFY] [main.go](file:///home/psalmprax/national_security_platform/backend/core-api/cmd/server/main.go)
- Register `GET /api/v1/alerts/:id/triangulation`.

#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Integrate a new "Tactical Proximity Radar" panel in the alert details.
- Visualize response team suitability (Capacity + Proximity).

---

### 4. Phase 1: Foundation & Real-Time Performance (Completed)
Implementation of Redis spatial caching and SSE pipeline for sub-second awareness.

#### [MODIFY] [repository.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/db/repository.go)
- Integrated Redis client and implemented caching in `GetTriangulatedAssets`.

#### [MODIFY] [main.go](file:///home/psalmprax/national_security_platform/backend/core-api/cmd/server/main.go)
- Implemented SSE broadcaster and `/api/v1/events/stream` handler.

---

### 5. Asset Activation & Dispatch (Completed)
Operational control for field units to respond to validated alerts.

#### [MODIFY] [handlers.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/agency/handlers.go)
- Added `DispatchAssetHandler`.

#### [MODIFY] [TacticalRadar.tsx]
- Integrated activation controls into the unified radar component.

---

### 6. Dynamic Command Architecture (Completed)
Migration from a static command center to an agency-aware platform.

#### [MODIFY] [rbac.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/middleware/rbac.go)
- Implemented `RequireAnyRole` middleware.

#### [MODIFY] [repository.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/db/repository.go)
- Implemented `GetUserAgencyInfo`.

### 7. System Operational Modes (Completed)
Implementation of situational awareness modes (NOMINAL, SURGICAL, TACTICAL, DARK_OPS) with coordinated theme propagation.

#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Implemented centralized `themes` configuration and `operationMode` state.
- Connected Mapbox map, triage sidebar, and telemetry elements to the dynamic design system.
- Replaced all hardcoded colors with theme-reactive properties.

### 8. Dashboard Access Control (Completed)

#### [MODIFY] [page.tsx](file:///home/psalmprax/national_security_platform/web/app/page.tsx)
- Restrict "Agency View Switcher" and "Debug Role Switcher" to `ADMIN` users only.
- Implement automatic view selection for non-admin roles upon login.
- Ensure `AGENCY_OFFICER` role is correctly redirected or handled (Locked out of dashboards, only portal).

---

### 9. Dashboard Type Refinement & RBAC Hardening (Completed)
Elimination of `any` types and strictly typed identity management to prevent lateral navigation regressions.

#### [MODIFY] [AuthContext.tsx](file:///home/psalmprax/national_security_platform/web/lib/AuthContext.tsx)
- Export the `User` interface to enable typed props across the component tree.

#### [MODIFY] [page.tsx](file:///home/psalmprax/national_security_platform/web/app/page.tsx)
- Explicitly type the `securityStatus` state using the `SystemStatus` interface.
- Replace `any` in `useAuth` consumption with the `User` type.

#### [MODIFY] [Dashboard Components]
- Update `CyberDashboard.tsx`, `StrategicDashboard.tsx`, and `TacticalDashboard.tsx` to use the `User` type for the `user` prop.
- Resolve internal state lints (e.g., `selectedAlert` typing).

## Verification Plan

### Automated Tests
- Manual verification of API responses, RBAC enforcement, and data mapping.

### Manual Verification
1. Log in as **ADMIN** or **TACTICAL_COMMAND**.
2. Verify "Generate Sector Report" displays context-aware agency names.
3. Verify **Asset Dispatch** results in instant status updates on the map.
4. Verify SSE connection remains stable through the Nginx gateway configuration.
