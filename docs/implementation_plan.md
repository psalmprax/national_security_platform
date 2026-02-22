# Universal Display Mode Implementation

The goal is to provide a consistent visual experience mapping across all dashboards (Cyber, Tactical, Strategic, and Access Management). Themes like Dark, Light, OLED, Contrast, and Terminal will be shared globally and persist across sessions.

## Proposed Changes

### Core UI Overlay
#### [MODIFY] [page.tsx](file:///home/psalmprax/national_security_platform/web/app/page.tsx)
- Lift `displayMode` state to the root `DashboardPage` component.
- Implement `localStorage` persistence for the selected theme.
- Pass `displayMode` and `setDisplayMode` as props to all child dashboards.
- Apply `data-theme` to the root container in `page.tsx`.
- **Watermark Visibility**: Set the main dashboard container to `bg-transparent` to allow the global watermark (on `body::before`) to be visible.

### Dashboards
#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Remove local `displayMode` state.
- Use `displayMode` and `setDisplayMode` from props.
- **Background Fix**: Change root `div` background from `bg-[#050505]/60` to `bg-transparent` for watermark visibility.

#### [MODIFY] [StrategicDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/StrategicDashboard.tsx)
- Remove local `displayMode` state.
- Use `displayMode` and `setDisplayMode` from props.
- Ensure the settings menu updates the global state.
- **Background Fix**: Change root `div` background from `bg-slate-50` to `bg-transparent` for watermark visibility.

#### [MODIFY] [TacticalDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/TacticalDashboard.tsx)
- Remove local `displayMode` state.
- Use `displayMode` and `setDisplayMode` from props.
- Ensure the settings menu updates the global state.
- **Background Fix**: Change root `div` background from `bg-[#050505]/60` to `bg-transparent` for watermark visibility.

#### [MODIFY] [AccessManagement.tsx](file:///home/psalmprax/national_security_platform/web/components/admin/AccessManagement.tsx)
- Implement `displayMode` prop support.
- Apply `data-theme` to the container to ensure administrative views match the chosen agency-wide theme.
- **Add Settings Toggle**: Implement a settings button/menu within the registry view to allow theme switching without leaving the page.

#### [NEW] [Agency Command Portal] [page.tsx](file:///home/psalmprax/national_security_platform/web/app/agency/portal/page.tsx)
- Implement `displayMode` state with `localStorage` persistence (since it's a separate route).
- Apply `data-theme` to the root container.
- Add a settings button and theme switcher modal (consistent with other dashboards).

#### [MODIFY] [Login & Registration] [login/page.tsx](file:///home/psalmprax/national_security_platform/web/app/login/page.tsx) and [request-access/page.tsx](file:///home/psalmprax/national_security_platform/web/app/request-access/page.tsx)
- Add `localStorage` reader in `useEffect` to fetch `nsp_display_mode`.
- Apply `data-theme` to the root container to ensure brand consistency during onboarding.

## Verification Plan
### Manual Verification
- Log in and navigate to the **Cyber Dashboard**.
- Change theme to **OLED**.
- Switch to **Strategic Dashboard** via the command view switcher.
- Verify that **Strategic Dashboard** is also in **OLED** mode.
- Refresh the page and verify that the theme persists.
- Navigate to **Access Management** and verify theme consistency.

## Mobile Responsiveness & Navigation Refinement (Session Update)

### Global Components
#### [NEW] [Portal.tsx](file:///home/psalmprax/national_security_platform/web/components/Portal.tsx)
- Implement a React Portal wrapper to render children at the `document.body` root.
- Used to decouple dropdowns and modals from parent CSS stacking contexts.

#### [MODIFY] [CommandBar.tsx](file:///home/psalmprax/national_security_platform/web/components/CommandBar.tsx)
- Hide the primary navigation links on mobile viewports (`hidden md:flex`).
- Add a persistent hamburger menu button for mobile users (`md:hidden`).
- Implement a full-screen mobile navigation drawer leveraging `Portal` and `framer-motion`.

#### [MODIFY] [UserMenu.tsx](file:///home/psalmprax/national_security_platform/web/components/UserMenu.tsx)
- Enforce root-level rendering by wrapping the menu in the `Portal` component.
- Fixes z-index and overflow issues on mobile.

#### [MODIFY] [Agency Portal] [page.tsx](file:///home/psalmprax/national_security_platform/web/app/agency/portal/page.tsx)
- Wrap the Settings Modal in `Portal`.
- Resolves the layout shift where opening the modal would displace the header/toolbar.

## Database Stability (Session Update)
- Define `mock_data_points` table to fix broken simulation data seeding.
- Standardize all timestamps to `TIMESTAMPTZ` for PostgreSQL/CockroachDB compatibility.

## Dashboard Monolith Refactoring (Phase 3)
Decompose large dashboard components into modular, manageable sub-components to improve maintainability and testability.

### Strategic Dashboard
- **StrategicKPIs**: Top-level performance indicators.
- **StrategicOverview**: situational awareness charts and logs.
- **StrategicAnalytics**: Deep-dive data processing.
- **StrategicRegistry**: Agency identity nodes.
- **StrategicProfile**: User profile and settings.
- **IncidentTraceModal**: Detailed record exploration.

### Cyber Dashboard
- **CyberCompliance**: Regulatory status monitoring.
- **CyberAnalytics**: Mock-driven intelligence forecasting.

## Feature 28: Intelligence Satellite Layer
Implementation of a "Ground Truth" visual layer for high-priority border monitoring.

- **Mapbox Integration**: Added `satellite-v9` style and `mapbox-terrain-dem-v1` source.
- **Animation Hull**: Custom CSS-based "Scanning Uplink" overlay during style transitions.
- **Autonomous Triggers**: Severity-based switching (`severity > 0.8`) for automated focus on critical incidents.

## Security Hardening (Sentinel Resolution)
Mitigation of high-impact vulnerabilities discovered during the Phase 3 audit.

- **DoS Mitigation**: Precise tuning of Go middleware rate limits.
- **CSP Hardening**: Full elimination of `'unsafe-inline'` and `'unsafe-eval'` to prevent XSS.
- **Static Asset Exemption**: Middleware logic update to prevent MIME errors on static files.
- **Indentation & Logic Fixes**: Resolution of syntax errors in the Python gRPC server to ensure 100% service uptime.

## Infrastructure Harmonization & CI/CD (Session Update)
Resolution of cross-project resource conflicts and implementation of automated delivery for the Viral Forge component.

### Port Shift (NSP)
- **Redis**: 6379 -> **6380** (Avoids conflict with Viral Forge Redis).
- **Grafana**: 3000 -> **5000** (Avoids conflict with Viral Forge Nginx).

### Jenkins Pipeline (Viral Forge)
- **File**: `viral_forge/Jenkinsfile.remote`.
- **Auth**: SSH-key based authentication for `130.61.26.105`.
- **Process**: Git checkout -> SSH rsync -> Docker Compose build/up -> Automated DB Seeding.
