# Cyber View UI Polish & Scrollbar Alignment Walkthrough

The **Cyber View** has been refined to achieve high-fidelity visual consistency, specifically focusing on the alignment and aesthetics of scrollbars across all sub-views.

## Scrollbar Standardization

previously, scrollbars were attached to the centered content containers, causing them to "float" in the middle of the screen when the viewport was wide. This created a visual disconnect from the fixed Triage Sidebar.

We have refactored the layout structure for the **Alerts**, **Data**, **Analytics**, **Profile**, and **Compliance** views to:

1.  **Full-Width Scrolling**: The `overflow-y-auto` property now sits on the full-width parent container.
2.  **Anchored Position**: This forces the custom `.scrollbar-cyber` to always render at the far right edge of the dashboard panel, directly adjacent to the Intelligence Triage sidebar.
3.  **Centered Content**: The actual data and cards remain centered using `mx-auto` constraints, preserving readability without compromising the structural grid.

## Dynamic System Operational Modes

The **Cyber View** also features a centralized "Operational Mode" controller that dynamically re-themes the entire dashboard in real-time.

### Centralized Theme Propagation

Every component in the Cyber View now subscribes to a master theme state, purging all hardcoded colors in favor of a responsive design system.

- **`CyberDashboard.tsx`**: Serves as the orchestrator, managing the `operationMode` state and distributing theme tokens.
- **`MapboxMap.tsx`**: Receives dynamic primary colors to theme triangulation lines, alert markers, and the background situational grid.
- **`TriageSidebar.tsx`**: Adapts its entire UI—including report modals, progress bars, and icon glows—to match the active operational posture.

### Operational Modes Overview

| Mode | Theme | Primary Color | Focus |
| :--- | :--- | :--- | :--- |
| **NOMINAL** | Cyber Green | `#00FF95` | Default system monitoring and standard triage. |
| **SURGICAL** | High-Precision Blue | `#00D1FF` | Focused, high-trust verification and alert filtering. |
| **TACTICAL** | Warning Yellow | `#FFD600` | Rapid response and proximity triangulation. |
| **DARK_OPS** | Tactical Red | `#FF003C` | High-severity threat management and covert tracking. |

## Feature Highlights

### 1. Mode Selector HUD
A prominent Interactive HUD has been added to the main viewport, allowing analysts to switch postures with a single click. Each switch triggers a coordinated animation across all UI panels.

### 2. Themed Mapbox Visuals
The situational map now reflects the active mode's color palette. Triangulation lines between alerts and assets, as well as the tactical grid overlay, update instantly to maintain visual consistency.

### 3. Integrated Triage Sidebar
The sidebar's progress bars, telemetry streams, and the **Sector Intelligence Report** modal are now fully theme-aware, ensuring that high-level reporting matches the current operational state.

### 4. Professional Cyber Scrollbars
A custom, high-fidelity scrollbar (`.scrollbar-cyber`) has been implemented across the Alert Triage, System Analytics, and Profile views. This unifying design features a glassy track, a glowing gradient thumb, and hover effects that align perfectly with the platform's futuristic aesthetic.

### 5. Draggable Settings Panel
The **Settings** dialog box (Display Mode) has been enhanced with `framer-motion` to be fully **draggable**. It also now defaults to a **bottom-left** position to improve accessibility and keep the main viewport clear.

### 6. Draggable Notifications Panel
The **Notifications** panel is now fully draggable and behaves similarly to the Settings panel. It defaults to a position stacked just above the Settings panel in the bottom-left corner, ensuring important alerts are visible but unobtrusive.

## Role-Based Access Control & Strict Isolation

To ensure mission integrity, the dashboard now enforces strict isolation for non-admin users:

- **Admin Control**: Only users with the `ADMIN` role can see and interact with the Agency View Switcher and the Debug Role Switcher.
- **Auto-Routing**: Analysts and Commanders are automatically routed to their respective dashboards (Cyber, Tactical, or Strategic) upon login, with no way to bypass their assigned view.
- **Agency Officer Portal**: Users with the `AGENCY_OFFICER` role are blocked from the main dashboards and provided with a direct link to the Agency Command Portal.
- **Access Enforcement**: Integrated server-side and client-side checks prevent unauthorized access to restricted views, showing a dedicated "Access Restricted" interface if necessary.

## Verification Results

- [x] verified theme propagation to `MapboxMap` coordinates and lines.
- [x] verified `TriageSidebar` component adaptability to four distinct color palettes.
- [x] confirmed removal of all hardcoded `#00FF95` values in core dashboard files.
- [x] Validated Mode Selector HUD functionality and responsive state updates.
- [x] Applied and verified consistent `.scrollbar-cyber` styling across dashboard views.
- [x] verified scrollbars are anchored to the right edge of the content panel.
