# SMS Integration for Resilient Communications

Integrating a dedicated SMS service is critical for the National Security Platform's mission in environments where data connectivity (LTE/5G) is unreliable. SMS provides a ubiquitous, low-bandwidth failover for mission-critical alerts and secure identity verification.

## User Review Required

> [!IMPORTANT]
> **Provider Selection**: We recommend **AfricasTalking** as the primary provider for SMS integration due to their deep penetration in the Nigerian telecommunications market and superior delivery rates for domestic short-codes. **Twilio** is a viable secondary for international failover.

## Proposed Changes

### Core API (Backend)

#### [NEW] [sms_service.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/service/sms_service.go)
- Implement a generic `SMSService` interface.
- Add an AfricasTalking provider implementation.
- Support for:
    - `SendOTP(phone string, code string)`
    - `SendAlert(phone string, message string)`
    - `SendSOS(phones []string, location string)`

#### [MODIFY] [alert_service.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/service/alert_service.go)
- Update alert creation logic to trigger SMS notifications for `CRITICAL` alerts.
- Implement a 30-second wait-for-push acknowledgement; if no delivery receipt is received via NATS, trigger SMS fallback.

### Identity & Access

#### [MODIFY] [AuthService.go](file:///home/psalmprax/national_security_platform/backend/core-api/internal/service/AuthService.go)
- Integrate SMS OTP as part of the `NINC/NIN` verification flow.
- Ensure the phone number bound to the NIMC record is the one receiving the verification code.

## Verification Plan

### Automated Tests
- Mock SMS provider responses in Go unit tests.
- Audit logs should record `SMS_SENT` events with provider references.

### Manual Verification
1. Trigger a "Terrorism" or "Kidnapping" alert with CRITICAL severity.
2. Verify that an SMS is received on the registered test number within 10 seconds.
3. Attempt registration and verify the OTP flow.
