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
