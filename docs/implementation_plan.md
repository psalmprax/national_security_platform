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
