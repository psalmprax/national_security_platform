# Making Sector Reports Dynamic by Agency

This plan outlines the changes required to make the Sector Intelligence Report dynamic based on the user's agency, replacing the hardcoded "LAGOS_CENTRAL_COMMAND" string.

## User Review Required

> [!IMPORTANT]
> The `/api/v1/system/reports/sector` endpoint was previously restricted to `ADMIN` only. I will expand this to include `CYBER_ANALYST`, `TACTICAL_COMMAND`, and `AGENCY_OFFICER` so they can see reports for their respective sectors.

## Proposed Changes

### Backend (Golang)

---

#### [MODIFY] [repository.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/db/repository.go)
- Implement `GetUserAgencyInfo(ctx context.Context, userID uuid.UUID) (*models.Agency, error)` to fetch agency details via the `agency_personnel` link table.

#### [MODIFY] [rbac.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/middleware/rbac.go)
- Add `RequireAnyRole(roles ...string)` middleware to support multi-role access to specific endpoints.

#### [MODIFY] [main.go](file:///home/psalmprax/national_security_platform/backend/core-api/cmd/server/main.go)
- Update `handleGetSectorReport` to use `GetUserAgencyInfo`.
- Set `SectorID` to the Agency Name if available, otherwise default to "NATIONAL_OPERATIONS_CENTER".
- Move `/api/v1/system/reports/sector` to a group that allows `ADMIN`, `CYBER_ANALYST`, `TACTICAL_COMMAND`, and `AGENCY_OFFICER`.

---

### Frontend (Next.js)

---

#### [MODIFY] [TriageSidebar.tsx](file:///home/psalmprax/national_security_platform/web/components/TriageSidebar.tsx)
- Update the "Generate Sector Report" button's `disabled` logic to allow non-admin roles (who are authorized by the backend).

#### [MODIFY] [api.ts](file:///home/psalmprax/national_security_platform/web/lib/api.ts)
- Fix the duplicate `return await response.json()` bug in `fetchSectorReport`.
- Applied global `.scrollbar-cyber` styles to the dashboard for consistent UI.

---

### Database (SQL Seed)

---

#### [NEW] [011_seed_agency_personnel.sql](file:///home/psalmprax/national_security_platform/platform/schema/011_seed_agency_personnel.sql)
- Seed `agency_personnel` mappings for the test users used in the simulation.

---

### 7. System Operational Modes (NEW)
Implementing a central "Operation Mode" control that reconfigures the UI theme and behavioral logic.

#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Define `OperationMode` type: `NOMINAL`, `SURGICAL`, `TACTICAL`, `DARK_OPS`.
- Implement `activeTheme` state that maps modes to HEX colors.
- Add "Operation Mode" selector in the Top HUD for high visibility.
- **Functionality**:
    - `NOMINAL`: Default green theme, standard view.
    - `SURGICAL`: Blue theme, auto-enables "Secure" alert filtering.
    - `TACTICAL`: Yellow theme, auto-triggers triangulation radar for selected alerts.
    - `DARK_OPS`: Red theme, highlights high-severity and unverified alerts.
- **UI Polish**:
    - Applied the designated `scrollbar-cyber` class to all internal scroll containers (Alerts, Analytics, Profile) to match the Intelligence Triage sidebar style.

## Verification Plan

### Automated Tests
- No automated tests currently exist for this specific flow, but I will verify via the UI and logs.

### Manual Verification
1. Log in as `Tactical Command` (+2348000000103).
2. Generate Sector Report.
3. Verify the report header shows "Nigerian Army - 7th Division" (or similar) instead of "LAGOS_CENTRAL_COMMAND".
4. Repeat for `Cyber Analyst`.
