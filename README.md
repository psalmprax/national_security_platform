# National Security Platform (Nigeria)

A sovereign, national-scale security architecture designed to bridge community leadership with national intelligence. This platform empowers trusted Traditional Rulers with secure reporting tools and provides intelligence agencies with AI-augmented situational awareness.

## 🏗 System Architecture

The system follows a resilient, distributed, and event-driven architecture:

- **Secured Ingestion (Go)**: High-throughput API handling encryption, RBAC, and auditing.
- **Intelligence Service (Python)**: gRPC-based AI service for threat classification and severity scoring.
- **Offline-First Mobile (Flutter)**: Icon-centric Panic UI with local SQLite persistence and PKI signing.
- **Command Dashboard (Next.js)**: Real-time geospatial triage center for intelligence analysts.
- **Infrastructure**: NATS JetStream (Message Bus), CockroachDB (Distributed SQL), Redis (Cache).

Detailed design specs: [Architecture Design Document](architecture_design.md)

---

## 🔐 Security & Accountability Stack

This platform meeting national security standards through multiple defensive layers:

- **Identity**: PKI-bound onboarding binds users to specific hardware (HWID).
- **Encryption**: 
    - **At Rest**: Application-layer AES-GCM (256-bit) for sensitive alert content.
    - **Transit**: Enforced TLS 1.3 (HTTPS) and Service-to-Service mTLS (gRPC).
- **Access Control**: JWT-based Role-Based Access Control (RBAC) enforced via Go middleware.
- **Integrity**: SHA-256 hashing of all evidence items stored in an immutable audit ledger.
- **Observability**: Structured JSON access logging for all Dashboard requests (audit trail).
- **Resilience**: Offline-first mobile persistence for "Network Dark Zones."

---

## 🚀 Getting Started (Docker Orchestration)

The entire platform is containerized and managed via Docker Compose.

### 1. Prerequisites
- Docker & Docker Compose
- *Optional*: Node.js (v18+) if you wish to run the Web Dashboard outside of Docker.

### 2. Launch the Platform
```bash
docker-compose up --build
```
*Note: This will build all platform services and pull them behind a Unified Security Gateway (Nginx).*

### 2a. Configure Mapbox (Optional but Recommended)
The 3D Situation Map requires a valid Mapbox Public Access Token.
1.  **Sign Up**: Go to [mapbox.com](https://www.mapbox.com/) and create a free account.
2.  **Get Token**: After logging in, navigate to your [Account Dashboard](https://account.mapbox.com/).
3.  **Copy Default Token**: Under "Access tokens", copy your **Default public token** (starts with `pk.`).
4.  **Configure Platform**:
    - **Option A (Persistent)**: Open `docker-compose.yml`, find the `web-dashboard` service, and replace the placeholder in `NEXT_PUBLIC_MAPBOX_TOKEN`.
    - **Option B (Temporary)**: Run `export NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here` in your terminal before starting Docker.

### 3. Seed Test Data
To populate the dashboard with realistic security scenarios (Kidnapping, Cyber Threat, etc.):
```bash
chmod +x seed_database.sh && ./seed_database.sh
```

### 4. Unified Service Access
The platform is unified under a single entry point (Gateway) for consistency:
- **Main Portal (Dashboard)**: [http://localhost:8085](http://localhost:8085)
- **Agency Command Portal**: [http://localhost:8085/agency/portal](http://localhost:8085/agency/portal)
- **Mobile Client (Simulation)**: [http://localhost:8085/mobile/](http://localhost:8085/mobile/)
- **Security API (Alerts)**: [http://localhost:8085/api/v1/alerts](http://localhost:8085/api/v1/alerts)
- **Security Compliance (Admin)**: [http://localhost:8085/api/v1/system/security-scans](http://localhost:8085/api/v1/system/security-scans)
- **System Pulse (Health)**: [http://localhost:8085/api/v1/system/status](http://localhost:8085/api/v1/system/status)
- **CockroachDB UI**: [http://localhost:8081](http://localhost:8081)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001)
- **Login Portal**: [http://localhost:8085/login](http://localhost:8085/login)

### 5. Test Credentials
All pre-seeded accounts use the default password: **`password`**

| Role | Phone Number | View Access |
| :--- | :--- | :--- |
| **System Admin** | `+2348000000100` | Full Access (All Views + Agency Portal) |
| **Cyber Analyst** | `+2348000000101` | **Cyber View Only** (Strict Isolation) |
| **Strategic Planner**| `+2348000000102` | **Strategic View Only** (Strict Isolation) |
| **Tactical Command** | `+2348000000103` | **Tactical View Only** (Strict Isolation) |
| **Agency Officer** | `+2348000000104` | **Agency Command Portal Only** |

> [!IMPORTANT]
> **Strict View Isolation**: Personnel are now restricted to their intended views based on their national security clearance. The dashboard will automatically lock views that fall outside of a user's specific operational mandate.

---

## 🛠 Operational Flow (Verification)

1. **Onboard**: Register a mock ruler via the Core API to receive your secure access token.
2. **Submit Alert**: Access the **Mobile Client**, bypass the biometric check, and trigger a "Panic" alert.
3. **Analyze**: The **Intelligence Service** automatically categories the threat and assigns a severity score.
4. **Triage**: Open the **Web Dashboard** to see the alert appear in real-time on the map and in the Triage Sidebar.
5. **Audit**: Verify the SHA-256 content hash in the `audit_logs` table.

---

## ⚠️ Troubleshooting (Web Errors)

If you see red lines/errors in the `web/` folder (e.g., `Module not found 'react'`):
These are **environmental linting errors** in your IDE because `node_modules` are not present locally. 

**To Fix**:
1. `cd web`
2. `npm install` (requires local Node.js)

### ⚠️ WebGL Support (Chrome/Linux)
If you see "WebGL is not supported" in Chrome, follow these steps to enable hardware acceleration:
1. **Enable Hardware Acceleration**: Go to `chrome://settings/system` and toggle **"Use hardware acceleration when available"** to **ON**.
2. **Override Rendering List**: Go to `chrome://flags`, search for **"Override software rendering list"**, and set it to **Enabled**.
3. **Verify Status**: Navigate to `chrome://gpu` and ensure "WebGL" says **Hardware accelerated**.

*Rest assured, the code is 100% valid and builds successfully inside the Docker container.*

---

## 📂 Key Documentation
- [Full Project Walkthrough](walkthrough.md)
- [Architecture Design Document](architecture_design.md)
- [API Documentation](api_documentation.md)
- [Scaling & Deployment Guide](scaling_guide.md)
- [Mobile Testing Guide](mobile_testing_guide.md)
- [Mobile App Store Publication Guide](mobile_publication_guide.md)
- [Feature Expansion Blueprint](expansion_blueprint.md)
- [Web Troubleshooting Guide](web/TROUBLESHOOTING.md)
- [Database Schema](platform/schema/001_initial_schema.sql)
