- [x] Search for "Sentinel Audit Ledger" in Cyber view <!-- id: 4 -->
- [x] Check backend support for paginated security scans <!-- id: 5 -->
- [x] Implement pagination in frontend `CyberDashboard.tsx` <!-- id: 6 -->
- [x] Verify pagination functionality <!-- id: 7 -->
- [x] Implement Response Team Triangulation <!-- id: 8 -->
    - [x] Design backend triangulation logic <!-- id: 9 -->
    - [x] Implement `GET /api/v1/alerts/:id/triangulation` endpoint <!-- id: 10 -->
    - [x] Update frontend to display triangulation results <!-- id: 11 -->
- [x] Verify triangulation accuracy <!-- id: 12 -->

- [x] Phase 4: Capability & Performance Scale-Up <!-- id: 13 -->
    - [x] [1.1] Redis Spatial Caching <!-- id: 14 -->
    - [x] [1.2] Server-Sent Events (SSE) Pipeline <!-- id: 15 -->
    - [x] [1.3] Spatial Index Tuning (Skipped due to disk space) <!-- id: 16 -->

- [x] Implement Asset Activation and Dispatch
    - [x] Update `assets` table schema with `status` and `last_active`
    - [x] Add `handleUpdateAssetStatus` and `handleDispatchAsset` to backend
    - [x] Implement "Activate/Deactivate" toggles in Tactical Radar
    - [x] Add "Dispatch To Incident" action button
    - [x] Verify real-time status updates via SSE

- [x] Unify Tactical Proximity Radar across dashboards
    - [x] Move triangulation logic to reusable `TacticalRadar` component
    - [x] Integrate radar into `AgencyPortal` (Operational View)
    - [x] Ensure consistent asset visualization (Markers, Distance, Suitability)

- [x] Make Sector Intelligence Reports dynamic by agency
    - [x] Implement `GetUserAgencyInfo` in `repository.go`
    - [x] Create `RequireAnyRole` middleware in `rbac.go`
    - [x] Update `handleGetSectorReport` and routes in `main.go`
    - [x] Update `TriageSidebar.tsx` and `api.ts` on frontend
    - [x] Seed test personnel data for verification
34: 
35: - [x] Implement Dynamic System Operational Modes (NOMINAL, SURGICAL, TACTICAL, DARK_OPS)
36: - [x] Restrict Role-Based View Switching to System Admins only
37: - [x] Implement automatic dashboard routing for non-admin roles
38: - [x] Add access enforcement and portal redirection for Agency Officers
- [x] Refine Dashboard Type Safety
    - [x] Export `User` interface from `AuthContext.tsx`
    - [x] Apply proper types to `user` prop in dashboard components
    - [x] Explicitly type `securityStatus` state in `page.tsx` using `SystemStatus` interface
    - [x] Resolve remaining 'any' lints in `StrategicDashboard.tsx` and `TacticalDashboard.tsx`
