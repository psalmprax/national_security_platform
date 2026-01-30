# System Operational Modes & Access Control (Completed)

Implementation of dynamic situational awareness modes and strict role-based access control.

## Completed Changes

### 1. Dynamic System Operational Modes
- **Centralized Theming**: Implemented `themes` configuration and `operationMode` state in `CyberDashboard.tsx`.
- **Mapbox Integration**: Propagated dynamic theme colors to map markers, grid lines, and HUD elements.
- **Sidebar Integration**: Updated `TriageSidebar.tsx` to inherit active theme colors.
- **Visual Feedback**: Replaced hardcoded default colors with reactive theme properties.

### 2. Dashboard Access Control
- **Admin-Only Switching**: Restricted "Agency View Switcher" and "Debug Role Switcher" visibility to `ADMIN` users in `page.tsx`.
- **Auto-Routing**: Implemented logic to automatically set the correct dashboard view for `CYBER_ANALYST`, `TACTICAL_COMMAND`, and `STRATEGIC_PLANNER` roles.
- **Access Enforcement**: Added an "Access Restricted" screen for unauthorized view attempts.
- **Portal Link**: Providing a direct link to the Agency Command Portal for `AGENCY_OFFICER` users.

## Verification
- Validated theme changes across NOMINAL, SURGICAL, TACTICAL, and DARK_OPS modes.
- Verified that non-admin users cannot access the switcher UI.
- Confirmed that Agency Officers are redirected appropriately.

### Manual Verification
1. **Launch Dashboard**: Run `docker compose up --build web-dashboard`.
2. **Tactical View Layering**: 
   - Navigate to Tactical View.
   - Trigger/select a critical alert to ensure the red warning banner appears.
   - Open the View Switcher (System Admin menu).
   - Verify that the View Switcher appears **on top** of the red banner.
3. **Map Layering**: 
   - Select an alert with triangulation active.
   - Zoom in on a populated area.
   - Verify that the dashed triangulation lines are rendered **under** map labels (city names/streets).
4. **Functional Check**: Verify that "Dispatch Response" and "Verify Integrity" buttons remain functional within the moved modal.
