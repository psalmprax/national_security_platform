# National Security Platform - API Documentation

This document provides a comprehensive overview of the REST and gRPC interfaces exposed by the National Security Platform's Core API and Intelligence Services.

## 1. Authentication & Identity

All protected routes require a `Bearer` token in the `Authorization` header.

### `POST /api/v1/auth/login`
**Audience**: Community Leaders (Mobile Application)
- **Description**: Authenticates a user and returns a JWT.
- **Payload**:
  ```json
  {
    "phone_number": "+2348000000000",
    "password": "your_secure_password"
  }
  ```
- **Response**: `200 OK` with `{ "success": true, "token": "JWT_HERE" }`

### `POST /api/v1/auth/dashboard-login`
**Audience**: Security Analysts, Commanders, Admins
- **Description**: Specialized login for the Situational Awareness Center dashboard. Enforces role-based checks (ADMIN, CYBER_ANALYST, etc.).
- **Payload**: Same as login.
- **Response**: `200 OK` or `403 Forbidden`.

### `POST /api/v1/auth/request-access`
- **Description**: Registers a new user request in `PENDING` status.
- **Payload**:
  ```json
  {
    "phone_number": "+234...",
    "full_name": "John Doe",
    "email": "john@gov.ng",
    "password": "...",
    "role": "AGENCY_OFFICER",
    "nin": "12345678901",
    "state_id": "UUID",
    "lga_id": "UUID",
    "agency_id": "UUID (Optional)",
    "rank": "Rank (Optional)",
    "badge_number": "Badge (Optional)",
    "monarch_grade": "Grade (Optional - Monarch)",
    "domain_territory": "Domain (Optional - Monarch)"
  }
  ```

### `POST /api/v1/auth/onboard`
- **Description**: Performs a cryptographic binding between a user identity and a physical device HWID using Ed25519 signatures.
- **Payload**: `userID`, `device_hwid`, `public_key`, `signature`.

### `GET /api/v1/auth/me`
- **Description**: Returns the identity profile and role of the authenticated user.

---

## 2. Alerts & Incidents

### `GET /api/v1/alerts`
- **Description**: Fetches the 50 most recent security alerts.
- **Security**: Authenticated.

### `POST /api/v1/alerts`
- **Description**: Ingests a new security alert from the field.
- **Payload**:
  ```json
  {
    "user_id": "UUID",
    "alert_type": "FIREARM_SIGHTING",
    "latitude": 9.07,
    "longitude": 7.39,
    "content": "Description of incident"
  }
  ```
- **Action**: Triggers NATS broadcast and background AI analysis.

### `GET /api/v1/alerts/{id}/triangulation`
- **Description**: Identifies the most suitable response teams (Assets) for a specific incident using PostGIS spatial functions and capability scoring.

---

## 3. Real-Time Awareness

### `GET /api/v1/events/stream` (SSE Hub)
- **Description**: A persistent Server-Sent Events (SSE) stream that broadcasts real-time system events (New Alerts, Asset Dispatches) to connected dashboards.
- **Format**: `data: { JSON_PAYLOAD }`

---

## 4. Tactical Command & Agency Management

### `GET /api/v1/assets`
- **Description**: Lists all physical resources (Stations, Checkpoints, Units) across all agencies.
- **Role Required**: `ADMIN`.

### `POST /api/v1/assets`
- **Description**: Registers a new tactical asset on the map.
- **Payload**: `agency_id`, `name`, `type`, `location`, `call_sign`.

### `POST /api/v1/assets/{id}/dispatch`
- **Description**: Deploys or marks a tactical unit as "DISPATCHED" for a specific mission.
- **Action**: Updates asset status and generates an immutable Audit Log entry.

### `POST /api/v1/agencies`
- **Description**: Onboards a new national security agency (e.g., Nigerian Army, NPF).

---

## 5. Intelligence & System Auditing

### `GET /api/v1/system/status`
- **Description**: Dashboard telemetry (Total verified users, active critical threats).

### `GET /api/v1/system/security-scans`
- **Description**: Paginated ledger of the "Sentinel Audit Ledger," recording data integrity and system health checks.
- **Query Params**: `page`, `limit`.

### `GET /api/v1/system/reports/sector`
- **Description**: Generates an intelligence summary report. If accessed by an `AGENCY_OFFICER`, the report is dynamically scoped to their command unit.
- **Role Required**: `Any Operational Role`.

---

## 6. Internal gRPC Services

The platform uses gRPC for high-performance service-to-service communication.

### `CoreService` (Port 50051)
- **Methods**:
    - `SubmitAlert`: Used for internal alert escalation.
    - `GetAlertInfo`: Detailed retrieval for analysis.

### `IntelligenceService` (Python)
- **Methods**:
    - `AnalyzeAlert`: Asynchronous NLP analysis, entity extraction, and severity scoring.
