# Tactical Dashboard Null Safety

- [x] Implement null safety checks in `TacticalDashboard.tsx`
    - [x] Add defensive checks for `alerts` array
    - [x] Add defensive checks for `assets` array
    - [x] Fix missing `Lock` icon import
- [x] Implement "Request Access" registration for Dashboard access control
- [x] Integrate Mapbox GL into Cyber Dashboard for real-world map rendering
- [x] Implement authentication/authorization middleware for the Core API
- [x] Implement SSE (Server-Sent Events) for real-time alert streaming to dashboard
- [x] Integrate real-time alerts feed in web dashboard via SSE
- [x] Add React Toastify for notification feedback on the dashboard
- [x] Implement Mission Dispatch tracking (database schema, API, and UI)
- [x] Add Mobile Settings Screen with ADS, Duress, and Personalization options
- [x] Enhance Registration flow with NIN, State/LGA, Agency/Rank fields
- [x] Implement Classified Alerts with redaction based on clearance levels
- [x] Fix Classified Alerts display issue (user reference corrections)
- [x] Implement Geospatial Data Enrichment (LGA centroid coverage: 794/794)
- [x] Hybrid Spatial Resolution (boundary containment + nearest-neighbor fallback)
- [ ] Expand village/settlement coverage beyond 1,858 records
- [ ] Import authoritative LGA boundaries for high-priority regions
- [ ] Implement progressive boundary import workflow
- [x] Implement null safety checks in `CyberDashboard.tsx`
    - [x] Add defensive checks for `alerts`, `notifications`, and `securityScans`
- [x] Implement null safety checks in `TriageSidebar.tsx`
    - [x] Add defensive checks for `alerts` array and `location` string
- [x] Verify all changes and ensure no regressions
- [x] Resolve Database Schema Issues
    - [x] Identify missing `security_scans` table in CockroachDB
    - [x] Apply database migrations/seeding via `./seed_database.sh`
    - [x] Verify `security-sentinel` persistence success
- [x] Security Hardening: CSP Regulation
    - [x] Resolve WEAK_POLICY findings in Core API
    - [x] Remove `'unsafe-inline'` from CSP headers in `stack.go`
    - [x] Verify security scan pass in database
- [x] Mobile Service: ADS Settings Integration
    - [x] Design and implement `SettingsScreen.dart`
    - [x] Create `SettingsService` for preference management
    - [x] Implement Acoustic Detection Settings (ADS) UI & logic
    - [x] Implement Advanced Duress Settings UI (Panic PIN)
    - [x] Implement Ad Management & Personalization section
    - [x] Add navigation from `PanicScreen` to `SettingsScreen`
    - [x] Ensure persistence of all 4 settings categories
- [x] Identity Verification Hardening: Full Profile Registration (Phase 2)
    - [x] Add `Email` field to `users` table and models
    - [x] Add `Badge Number` for security roles
    - [x] Add `Monarch Grade` and `Domain` for traditional rulers
    - [x] Implement dynamic field visibility in `RegisterScreen.dart`
    - [x] Update `ApiService` and `AuthService` with full payloads
    - [x] Update test data and documentation

---

## Phase 1 Advanced Features (Feb 2026)

- [x] **Public Alert Broadcasting**
    - [x] Backend API (`POST/GET /api/v1/public-alerts`)
    - [x] NATS integration for real-time broadcasting
    - [x] Dashboard UI (`PublicAlertBroadcast` modal)
    - [x] Tactical Dashboard integration (sidebar + actions panel)

- [x] **Safety Leaderboard**
    - [x] Backend API (`GET /api/v1/analytics/safety-scores`)
    - [x] Dashboard UI (`SafetyLeaderboard` component)
    - [x] Strategic Dashboard integration (Analytics view)

- [x] **Anonymous Tips**
    - [x] Backend API (`POST /api/v1/tips/submit`, `GET /api/v1/tips`, `POST /api/v1/tips/{id}/verify`)
    - [x] Dashboard UI (`AnonymousTipFeed` component)
    - [x] Cyber Dashboard integration (Secret Tips view)

- [x] **Multi-Cloud Video Evidence Storage**
    - [x] `StorageProvider` interface abstraction
    - [x] `S3Provider` implementation (MinIO/AWS/GCS)
    - [x] SHA-256 integrity hashing
    - [x] Pre-signed URL generation

- [x] **Cyber Dashboard UI Fixes**
    - [x] Fixed Intelligence Triage layout (scrollbar/button visibility)
    - [x] Implemented strict redaction for classified alerts

- [x] **Separation of Duties (SoD)**
    - [x] Split `ADMIN` into `SYSTEM_ADMIN` and `SECURITY_OFFICER` roles
    - [x] Defined distinct route groups for system vs. security administration
    - [x] Implemented role-based write protections in `AccessManagement`

- [x] **Command & Control UI/UX Enhancement**
    - [x] Consolidated Global Command Bar (Fullscreen, View Switching, Secure Logout)
    - [x] Fixed React hook ordering for stable dashboard performance
    - [x] Resolved profile menu UI overlaps through central control placement
    - [x] Fixed Dashboard redirect loop in Next.js middleware for new admin roles

---

## Pending Tasks

- [ ] Test with Firebase Cloud Messaging (FCM tokens)
- [ ] NLP Entity Extraction UI in Dashboard
- [ ] Expand village/settlement coverage
- [ ] Import authoritative LGA boundaries for high-priority regions

