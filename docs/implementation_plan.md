# Implementation Plan: Comprehensive Security Hardening (Post-Audit)

Address remaining cyber security loopholes across frontend, backend, networking, and database layers to ensure production readiness and a Zero Trust posture.

## User Review Required

> [!IMPORTANT]
> This plan introduces breaking changes to the API communication flow by requiring CSRF tokens for all state-changing requests (POST, PUT, DELETE).

## Proposed Changes

### [Component: Backend (Core API)]

#### [MODIFY] [stack.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/middleware/stack.go)
- **Implement CSRF Protection**: Integrate `github.com/go-chi/chi/v5/middleware`'s `CSRF` or a custom double-submit cookie pattern.
- **Dynamic CORS**: Replace hardcoded `AllowedOrigins` with an environment variable lookup.
- **Secure Secret Handling**: Remove default fallback for `JWT_SECRET`; force application crash if not set.

#### [MODIFY] [main.go](file:///home/psalmprax/national_security_platform/backend/core-api/cmd/server/main.go)
- **IDOR Prevention (AuthZ)**: Update handlers (e.g., `handleGetAlertTriangulation`) to verify that the requesting user's role and agency affiliation permit access to the specific data requested. Currently, any authenticated user can view any alert detail.

### [Component: Networking (Gateway)]

#### [MODIFY] [nginx.conf](file:///home/psalmprax/national_security_platform/gateway/nginx.conf)
- **Internal Encryption**: Transition traffic between Nginx and Core API to HTTPS (using internal self-signed certs within the Docker network) to align with Zero Trust principles.

### [Component: Frontend (Web Dashboard)]

#### [MODIFY] [AuthContext.tsx](file:///home/psalmprax/national_security_platform/web/lib/AuthContext.tsx)
- **CSRF Token Handling**: Update the API client to extract the CSRF token from the cookie or a custom header and include it in all mutating requests.
    
### [Component: Manual Alert Verification (New)]

#### [MODIFY] [repository.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/db/repository.go)
- **Implement `VerifyAlert`**: Add a function to atomically increment the `verification_count` of an alert. `UPDATE alerts SET verification_count = verification_count + 1 WHERE id = $1`.

#### [MODIFY] [main.go](file:///home/psalmprax/national_security_platform/backend/core-api/cmd/server/main.go)
- **Implement `handleVerifyAlert`**: Add a POST handler for `/api/v1/alerts/{id}/verify`.
- **Register Route**: Add the route to the secured API group.

#### [MODIFY] [api.ts](file:///home/psalmprax/national_security_platform/web/lib/api.ts)
- **Update Client**: Add `verifyAlert(alertId: string)` function.

#### [MODIFY] [CyberDashboard.tsx](file:///home/psalmprax/national_security_platform/web/components/dashboards/CyberDashboard.tsx)
- **UI Interaction**: Wire the "VERIFY INTEGRITY" button to call `verifyAlert`.
- **State Update**: Optimistically update the UI to show "VERIFIED" without needing a reload.

## Verification Plan

### Automated Tests
- **CSRF Test**: Attempt a POST request without a valid CSRF token; expect `403 Forbidden`.
- **IDOR Test**: Attempt to access alert details using a user ID from a different agency; expect `403 Forbidden`.
- **Secret Test**: Unset `JWT_SECRET` and verify the Core API refuses to start.

### Manual Verification
- [x] Verify the Cyber Dashboard continues to function correctly with CSRF tokens enabled.
- [x] Check Nginx logs to confirm successful internal HTTPS handshakes.

## Implementation Status
> [!NOTE]
> All tasks in this plan have been successfully implemented and verified as of 2026-01-31. The platform now operates with full internal TLS, CSRF protection, IDOR prevention, and resolved Alert Geolocation display.
