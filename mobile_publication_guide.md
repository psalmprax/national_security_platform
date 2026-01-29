# Mobile App Store Publication Guide

This document outlines the steps to take the **National Security Platform (Mobile)** from this development repository to the **Google Play Store** and **Apple App Store**.

## 1. Browser Testing (Current State)
You can currently test the mobile app as a web application via Docker.
- **URL**: `http://localhost:8082`
- **Purpose**: Verify UI, logic, and integration without needing an emulator or real device.

---

## 2. Preparing for App Stores

Before building, you must customize the following in the `mobile/` folder:
- **App Name**: Update `display_name` in `pubspec.yaml`.
- **Package ID**: Change `com.example.national_security_platform` to a sovereign ID (e.g., `ng.gov.security.alerts`) in `android/app/build.gradle` and `ios/Runner/Info.plist`.
- **Assets**: Replace the placeholder icons in `assets/images/` with official government logos.

---

## 3. Google Play Store (Android)

### Build Steps:
1.  **Generate a Keystore**: Used to sign the app.
2.  **Build Bundle**:
    ```bash
    cd mobile
    flutter build appbundle
    ```
    *This generates an `.aab` file in `build/app/outputs/bundle/release/`.*

### Publication:
- Create a **Google Play Console** account ($25 one-time fee).
- Upload the `.aab` file.
- Complete the "Data Safety" and "Government App" declarations.

---

## 4. Apple App Store (iOS)

### Prerequisites:
- A **Mac** with Xcode installed.
- An **Apple Developer Program** membership ($99/year).

### Build Steps:
1.  **Configure Signing**: Open `mobile/ios/Runner.xcworkspace` in Xcode and select your development team.
2.  **Build Archive**:
    ```bash
    flutter build ipa
    ```

### Publication:
- Use **App Store Connect** to create a new app record.
- Use Xcode to "Distribute App" to the store.
- **Review**: Apple will manually review the app. Be prepared to provide a "Demo User" account for their inspectors.

---

## 5. Security & Review Tips
- **Encryption Declaration**: Since the app uses AES-GCM (Phase 5), you must declare "Export Compliance" in both stores.
- **Privacy Policy**: You must host a public Privacy Policy URL detailing how citizen data is protected.
- **Background Location**: If you enable background tracking, you must provide a justification video to Google/Apple.
