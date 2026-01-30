# Draggable Modal & Dynamic Naming for Cyber Dashboard

Enhance the Cyber Dashboard's "Tactical Analysis Locked" modal with draggable functionality and more descriptive naming to improve usability and clarity.

## Proposed Changes

### Web Dashboard

#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- Import `motion` from `framer-motion`.
- Wrap the "Selection Detail Overlay Modal" content in a `motion.div`.
- Add `drag` and `dragMomentum={false}` props to the `motion.div`.
- Add `cursor-grab active:cursor-grabbing` classes to the modal header area (or entire modal) to indicate draggability.
- Update the modal's `h2` title to dynamically include the alert ID: 
    ```tsx
### Dashboard Layout & Layering

#### [MODIFY] [page.tsx](file:///home/psalmprax/national_security_platform/web/app/page.tsx)
- Increase `z-index` of the `Agency View Switcher` and `View Switcher UI` from `z-[100]` to `z-[110]` to ensure they appear above all dashboard-level overlays (like the Tactical Warning Banner).

#### [MODIFY] [MapboxMap.tsx](file:///home/psalmprax/national_security_platform/web/components/MapboxMap.tsx)
- Update `addLayer` for `triangulation-lines-layer` to use a `beforeId` corresponding to the first map label layer (e.g., `road-label`). This moves tactical vector lines "behind" city names and roads for a more integrated appearance.

## Verification Plan

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
