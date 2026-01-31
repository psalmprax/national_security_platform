# Refining Scrollbar Alignment and Consistency

This plan addresses the user's request to adjust the alignment of scrollbars in the CyberDashboard to be visually consistent with the Intelligence Triage sidebar, specifically positioning them at the far right edge of the screen.

## User Review Required

> [!NOTE]
> No critical user review required for these UI-only changes.

## Proposed Changes

### Frontend (Next.js)

---

#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- **Refactor Scrollbar Containers**: 
    - Move `overflow-y-auto` and `.scrollbar-cyber` classes from the inner content containers (max-w-6xl/4xl) to the outer full-width wrappers.
    - This ensures the scrollbar is permanently anchored to the right edge of the viewport, adjacent to the Triage Sidebar.
    - Apply this pattern to `alerts`, `data`, `analytics`, `profile`, and `compliance` views.
- **Maintain Center Alignment**:
    - Ensure inner content containers retain `mx-auto` to stay centered within the full-width scrolling area.

#### [MODIFY] [globals.css](file:///home/psalmprax/national_security_platform/web/app/globals.css) (If applicable)
- Verify `.scrollbar-cyber` styles are consistent (already done in previous step, but confirming).

---

## Verification Plan

### Manual Verification
1.  **Visual Inspection**: Open the CyberDashboard in the browser.
2.  **Alert Triage**: Switch to 'Alerts' view. Verify the scrollbar is at the far right edge of the screen, next to the Triage sidebar.
3.  **Data View**: Switch to 'Data' view. Verify scrollbar position.
4.  **Analytics View**: Switch to 'Analytics' view. Verify scrollbar position.
5.  **Profile View**: Switch to 'Profile' view. Verify scrollbar position.
6.  **Compliance View**: Switch to 'Compliance' view. Verify scrollbar position.
7.  **Responsiveness**: Resize the window to ensure the layout remains stable.

### Completed Items
- [x] Standardize "Intelligence Triage" sidebar across views
- [x] Implement consistent `.scrollbar-cyber` styling
- [x] Adjust scrollbar positioning to align with Triage Sidebar
- [x] Make Settings Box Draggable (Framer Motion)
- [x] Make Notifications Panel Draggable & Stacked
- [x] Wire Notifications Panel to Real-Time SSE Stream

## Governance & Location Intelligence Refinement

This phase enhances the accuracy of situational awareness through automated spatial resolution and monarch-specific governance protocols.

### Backend (Go / CockroachDB)
- **Spatial Triage Engine**:
    - Update `GetRecentAlerts` to perform `ST_Contains` joins with the `states` and `lgas` geometry tables.
    - Automated mapping of raw GPS coordinates to administrative sector names.
- **Traditional Ruler Protocol (TRP)**:
    - Implement "Governance Override" logic in `SubmitAlert`.
    - Detect `TRADITIONAL_RULER` role and "Community Threat" alert types.
    - Snap alert location to the Monarch's registered `VillageID` coordinates if they match the TRP criteria.
    - Introduce `location_source` (Enum: `GPS`, `GOVERNANCE_OVERRIDE`) for data integrity.

### Frontend (Next.js)
- **Tactical UX**:
    - Update `CyberDashboard.tsx` to handle selected alerts and provide a "Fly-To" map interaction.
    - Refine `TriageSidebar.tsx` to handle missing location data with a tactical `GRID` fallback.

## Verification Plan
- [x] **Spatial Join Test**: Ensure alerts correctly identify their LGA/State.
- [x] **Governance Override Test**: Simulate a Monarch reporting from a remote location and verify snapping to village coords.
- [x] **UX Interactive Test**: Click an alert in the list and verify map navigation.
- [x] **Tactical Fallback Test**: Verify "GRID" display for alerts outside administrative boundaries.

### Sector Intelligence Reporting

This phase adds automated intelligence summaries at the sector/agency level, enabling high-level situational awareness for administrators.

#### Backend (Go / CockroachDB)
- **Intelligence Schema**: 
    - Define `SectorReport` struct in `models.go`.
- **Reporting Engine**:
    - Implement `handleGetSectorReport` in `main.go`.
    - Integrate `GetUserAgencyInfo` to scope reports to the user's specific command.
    - Aggregation logic: Calculate threat levels, system integrity, and trust scores based on recent alert patterns.
- **Security & RBAC**:
    - Register protected route `GET /api/v1/system/reports/sector`.
    - Enforce `ADMIN` role requirement via existing auth middleware.

#### Frontend (Next.js)
- **API Client**:
    - Add `SectorReport` interface to `api.ts`.
    - Implement `fetchSectorReport` function.
- **Triage Sidebar**:
    - Add "Generate Sector Report" button with loading states.
    - Implement high-fidelity `SectorReportModal` with data visualization (progress bars, stats).
    - Add export functionality (JSON and print styles).

## Verification Plan
- [x] **RBAC Test**: Verify non-admin users cannot access the reporting endpoint.
- [x] **Data Integrity Test**: Ensure aggregated stats match actual database records.
- [x] **UI/UX Test**: Confirm modal transparency, glow effects, and transitions.
- [x] **Export Test**: Validate JSON and Print outputs.

### Phase 9: Backend Resiliency & Environment Hardening

This phase addresses critical stability issues discovered during live environment testing, specifically targeting 500/401 errors and database seeding freezes.

#### Infrastructure & Database
- **Storage Threshold Tuning**: 
    - Adjust CockroachDB settings to allow operations in resource-constrained (95%+ disk) environments.
    - Settings: `kv.allocator.max_disk_utilization_threshold = 0.99`, `kv.bulk_io_write.min_capacity_remaining_fraction = 0.01`.
- **Seeding Pipeline Optimization**:
    - Reorder `seed_database.sh` to ensure user credentials (password hashes) are applied *after* all user deletions/insertions.
    - Synchronize schema migrations (`007_agency_schema`, `012_location_source`) to ensure model consistency.

## Verification Plan
- [x] **Full Reseed Test**: Verify `./seed_database.sh` completes successfully in < 1 minute.
- [x] **Auth Loopback Test**: Confirm dashboard login grants a 24h JWT cookie.
- [x] **Data Integrity Test**: Verify 9 users and 4 agencies are active in CockroachDB.
