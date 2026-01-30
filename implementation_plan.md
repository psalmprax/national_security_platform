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
    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
        {selectedAlert.type} // {selectedAlert.id.substring(0, 8).toUpperCase()}
    </h2>
    ```

## Verification Plan

### Manual Verification
1. **Launch Dashboard**: Run `docker compose up --build web-dashboard` and navigate to the Cyber View.
2. **Select Alert**: Click on any alert marker on the map to open the "Tactical Analysis Locked" modal.
3. **Verify Naming**: Confirm the modal title now displays both the type (e.g., "INFRASTRUCTURE") and a shortened ID (e.g., "7E56BDF3").
4. **Test Draggability**: Click and hold the modal, then move the mouse to verify it can be repositioned across the map area.
5. **Functional Check**: Verify that "Dispatch Response" and "Verify Integrity" buttons remain functional within the moved modal.
