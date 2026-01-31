# Security Sentinel SAST Integration Plan

## Goal
Enhance the `security-sentinel` service to perform **Static Application Security Testing (SAST)** alongside its existing DAST capabilities. This will allow it to detect insecure coding patterns, hardcoded secrets, and configuration flaws.

## User Review Required
> [!IMPORTANT]
> **Performance Impact**: Scanning source code is resource-intensive. The scanner will run periodically (e.g., every hour) rather than continuously to avoid CPU spikes.
> **Volume Mounts**: We will mount the entire `backend/` directory into the sentinel container as Read-Only (`:ro`) to allow scanning.

## Proposed Changes

### Infrastructure (`docker-compose.yml`)
#### [MODIFY] `security-sentinel` service
- Add volume mounts for source code:
    - `./backend/core-api:/usr/src/scan/core-api:ro`
    - `./backend/intelligence-service:/usr/src/scan/intelligence-service:ro`
    - `./backend/security-sentinel:/usr/src/scan/self:ro`

### Build (`backend/security-sentinel/Dockerfile`)
#### [MODIFY] Dockerfile
- Install `gosec` (Go Security Checker) via curl/sh script.
- Ensure `pip` installs `bandit` (Python Security Checker).

### Logic (`backend/security-sentinel/`)
#### [MODIFY] `requirements.txt`
- Add `bandit`

#### [MODIFY] `main.py`
- Import `subprocess` (securely).
- Implement `run_static_analysis()` function:
    - Run `bandit -r /usr/src/scan/intelligence-service -f json`
    - Run `gosec -fmt=json -r /usr/src/scan/core-api`
- Parse results and standardize them into the `findings` list.
- Persist combined SAST/DAST results to `security_scans` table.

## Verification Plan
### Automated Tests
- Run `docker-compose up --build security-sentinel`
- Verify logs show "Starting SAST Scan..."
- specific vulnerability triggers (like the one I will verify exists or mock) should appear in the logs.

### Manual Verification
- Check `docker logs` for `[SAST] Found potential hardcoded password` or similar.
