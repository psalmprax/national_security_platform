# Granular Access Control (ABAC) Implementation Plan

This plan details the implementation of Attribute-Based Access Control (ABAC) to introduce data-centric security layers beyond simple Role-Based Access Control (RBAC).

## Goal Description
The objective is to enforce "Need-to-Know" principles by restricting access to sensitive data based on a user's `ClearanceLevel`. This prevents authorized role-holders from seeing data they are not cleared for (e.g., a standard Cyber Analyst seeing Top Secret intelligence).

## User Review Required
> [!IMPORTANT]
> This change will affect all API endpoints protected by `AuthMiddleware`. Existing valid tokens will need to be re-issued (user re-login) to contain the new `ClearanceLevel` claim.

## Proposed Changes

### Backend (Go Core API)

#### [MODIFY] [internal/security/jwt.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/security/jwt.go)
- **Update Token Generation**: Include `ClearanceLevel` in the JWT payload.
- **Update Verification**: Extract `ClearanceLevel` during verification.

#### [MODIFY] [internal/middleware/rbac.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/middleware/rbac.go)
- **Update AuthMiddleware**: Extract `ClearanceLevel` from token claims and place it into the request context.
- **New Middleware**: `RequireClearance(level string)`.
    - Enforce hierarchy: `TOP_SECRET` > `SECRET` > `CONFIDENTIAL` > `RESTRICTED` > `UNCLASSIFIED`.

#### [MODIFY] [internal/db/repository.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/db/repository.go)
- **Update Queries**:
    - Modify sensitive data retrieval (e.g., `GetRecentAlerts`, `GetUserByID`) to respect the user's clearance level.
    - Example: Filter PII or specific alert types if user clearance is too low.

### Frontend (Next.js)

#### [MODIFY] [web/lib/auth.ts](file:///home/psalmprax/national_security_platform/web/lib/auth.ts)
- Update `Session` interface to include `clearance`.
- Update `verifySession` to parse the new claim.

## Verification Plan
1.  **Token Validation**: Log in as a high-clearance user and decode the JWT to verify the `ClearanceLevel` claim exists.
2.  **Middleware Test**: create a test endpoint requiring `TOP_SECRET` and try accessing it with a `CONFIDENTIAL` user.
3.  **Data Visibility**:
    - Verify a `CONFIDENTIAL` user sees standard data.
    - Verify a `TOP_SECRET` user sees sensitive PII or restricted alerts.
