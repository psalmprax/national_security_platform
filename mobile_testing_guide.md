# Mobile Services Testing Guide

Since this is a Flutter-based application, you have multiple ways to test it depending on your local tools.

## 1. Web Simulation (Recommended / No Install)
The platform is pre-configured to build the Flutter app as a web application inside Docker. This is the fastest way to verify the UI and logic.

1.  **Start the Platform**:
    ```bash
    docker-compose up --build
    # Note: The mobile build now includes '--source-maps' for easier debugging in browser devtools.
    ```
2.  **Access the App**:
    Open `http://localhost:8082` in your browser.
3.  **Testing Flow**:
    - **Step 1: Biometric Verification**: You will see a 1-second delay (simulating a biometric check).
    - **Step 2: Panic Button**: Tap one of the emergency icons (e.g., "Insurgency").
    - **Step 3: Persistence Check**: The app will show "Alert Saved Locally." This verifies the `sqflite` offline-first logic is working.

---

## 2. Local Flutter Development (requires Flutter SDK)
If you want to test on a real Android/iOS device or emulator:

1.  **Navigate to folder**: `cd mobile`
2.  **Get Packages**: `flutter pub get`
3.  **Run on Device**: `flutter run -d <your-device-id>`

---

## 3. End-to-End service Verification
To verify that the "Mobile Service" is actually talking correctly to the Backend:

1.  **Monitor Logs**:
    In a separate terminal, watch the backend logs:
    ```bash
    docker-compose logs -f core-api
    ```
2.  **Trigger Alert**:
    Submit an alert from the mobile web UI (`localhost:8082`).
3.  **Verify Backend Reception**:
    You should see:
    - An onboarding event in the logs.
    - A POST request to `/api/v1/alerts`.
    - A gRPC call to the Intelligence service for analysis.

---

## 4. Security & Hardening Tests (Phase 8)

| Technical Feature | How to Test |
| :--- | :--- |
| **JWT Verification** | Attempt to submit an alert via `curl` without the token received during onboarding. The API should return `401 Unauthorized`. |
| **Evidence Hashing** | Check the database (`alerts` table). The `content` column will be AES-encrypted, but the `audit_logs` will contain the matching SHA-256 hash. |
| **Duress Mode** | (Mock) In `panic_screen.dart`, you can toggle the `isDuress` flag to `true`. When submitted, the Web Dashboard will display a purple **COERCED** badge next to the alert. |

---

## 5. Offline Simulation
1.  **Disconnect**: Stop the `core-api` container: `docker-compose stop core-api`.
2.  **Submit Alert**: Use the mobile app on `localhost:8082`.
3.  **Verify**: The app should still function perfectly, saving the alert to the internal SQLite database.
4.  **Reconnect**: Start the API again: `docker-compose start core-api`.
5.  **Sync**: The app's `SyncService` will automatically detect the connection and push the pending alerts to the cloud.
