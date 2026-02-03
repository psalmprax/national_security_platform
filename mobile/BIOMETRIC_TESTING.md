# Biometric Authentication Testing Guide

## Overview

This guide explains how to test the biometric authentication feature (fingerprint, Face ID, face unlock) on the National Security Platform mobile app. Biometric features require native Android/iOS environments and cannot be tested in web browsers.

---

## 🧪 Testing Options

### Option 1: Android Physical Device (⭐ Recommended)

**Requirements**:
- Physical Android phone with fingerprint sensor or face unlock
- USB cable
- USB debugging enabled on phone

**Setup Steps**:

1. **Enable Developer Options on Your Phone**:
   ```
   Settings → About Phone → Tap "Build Number" 7 times
   Developer options enabled!
   ```

2. **Enable USB Debugging**:
   ```
   Settings → Developer Options → Enable "USB Debugging"
   ```

3. **Connect Phone to Computer**:
   - Plug in USB cable
   - On phone, tap "Allow USB Debugging" when prompted
   - Select "Always allow from this computer"

4. **Verify Connection**:
   ```bash
   cd /home/psalmprax/national_security_platform/mobile
   flutter devices
   ```
   
   Expected output:
   ```
   Found 2 connected devices:
     SM G973F (mobile) • XXXXXX • android-arm64 • Android 11 (API 30)
     Chrome (web)      • chrome • web-javascript • Google Chrome 144.0
   ```

5. **Install Dependencies**:
   ```bash
   flutter pub get
   ```

6. **Run the App**:
   ```bash
   flutter run
   ```
   
   Flutter will:
   - Build the app
   - Install it on your phone
   - Launch automatically
   - Show hot reload ready

**Testing the Feature**:

1. **First Login (Enable Biometrics)**:
   - Enter phone: `+2348000000001`
   - Enter password: (your test password)
   - Tap "INITIALIZE SESSION"
   - Dialog appears: "ENABLE BIOMETRIC LOGIN?"
   - Tap "ENABLE"
   - OS biometric prompt appears
   - Place finger on sensor (or use face unlock)
   - ✓ Success message: "Biometric authentication enabled"

2. **Test Auto-Prompt**:
   - Press phone's back button or swipe to close app
   - Reopen app from launcher
   - **Biometric prompt appears automatically**
   - Scan fingerprint/face
   - Instant access to dashboard!

3. **Test Manual Biometric Button**:
   - If you cancel the auto-prompt
   - Login screen shows green fingerprint button
   - Tap the button
   - Biometric prompt appears
   - Scan to login

4. **Test Password Fallback**:
   - Cancel biometric prompt
   - Scroll down to see "OR USE PASSWORD"
   - Enter credentials manually
   - Tap "INITIALIZE SESSION"

---

### Option 2: Android Emulator

**Requirements**:
- Android Studio installed
- At least 8GB RAM
- 10GB free disk space

**Setup Steps**:

1. **Create Emulator with Fingerprint Support**:
   ```bash
   # List available system images
   sdkmanager --list | grep system-images
   
   # Download image with Google APIs (includes biometric support)
   sdkmanager "system-images;android-30;google_apis;x86_64"
   
   # Create AVD
   avdmanager create avd \
     -n BiometricTest \
     -k "system-images;android-30;google_apis;x86_64" \
     -d "pixel_4"
   ```

2. **Launch Emulator**:
   ```bash
   emulator -avd BiometricTest
   ```
   
   Or use Android Studio:
   ```
   Tools → Device Manager → Play button on BiometricTest
   ```

3. **Enroll Virtual Fingerprint**:
   - Wait for emulator to fully boot
   - Open Settings app in emulator
   - Navigate: Settings → Security → Fingerprint
   - Tap "Add fingerprint"
   - In emulator controls (sidebar), click "Touch the sensor"
   - Repeat until enrollment complete

4. **Run the App**:
   ```bash
   cd /home/psalmprax/national_security_platform/mobile
   flutter pub get
   flutter run
   ```

5. **Test Biometric**:
   - When biometric prompt appears in app
   - Click "Touch the sensor" in emulator controls (three dots on sidebar → Fingerprint)
   - Authentication succeeds!

**Emulator Biometric Controls**:
- **Enroll Fingerprint**: Settings → Security → Fingerprint → Add
- **Authenticate**: Click "Touch the sensor" in emulator sidebar when prompt appears
- **Fail Authentication**: Click "Touch the sensor" with finger not enrolled (won't work in emulator, use Cancel button instead)

---

### Option 3: iOS Simulator (macOS Only)

**Requirements**:
- macOS computer
- Xcode installed
- iOS Simulator

**Setup Steps**:

1. **Open iOS Simulator**:
   ```bash
   open -a Simulator
   ```
   
   Or via Xcode:
   ```
   Xcode → Open Developer Tool → Simulator
   ```

2. **Choose Device**:
   - Hardware → Device → iPhone 14 (or any modern iPhone)

3. **Enable Face ID**:
   ```
   Features → Face ID → Enrolled
   ```

4. **Run the App**:
   ```bash
   cd /home/psalmprax/national_security_platform/mobile
   flutter pub get
   flutter run -d "iPhone 14"
   ```

5. **Test Face ID**:
   - When biometric prompt appears
   - Menu: Features → Face ID → Matching Face
   - Authentication succeeds!

**Simulator Face ID Controls**:
- **Enrolled**: Features → Face ID → Enrolled (enable Face ID)
- **Matching Face**: Simulates successful authentication
- **Non-matching Face**: Simulates failed authentication

---

## 🚨 Testing Duress Detection

The duress detection feature activates when a user rapidly fails biometric authentication 3 times within 10 seconds.

**Scenario**: Attacker forces victim to unlock app, victim triggers duress mode.

**Test Steps**:

1. **Setup**: Ensure biometric login is enabled

2. **Close and Reopen App**:
   ```bash
   # On device: swipe app away
   # Reopen from launcher
   ```

3. **Trigger Duress Pattern**:
   - Biometric prompt appears
   - **Rapidly fail 3 times** (within 10 seconds):
     
     **Method 1 (Physical Device)**:
     - Use wrong finger 3 times quickly
     - Or tap "Cancel" → retry → "Cancel" → retry → "Cancel"
     
     **Method 2 (Emulator)**:
     - Don't click "Touch sensor"
     - Just tap "Cancel" 3 times rapidly
     - Restart biometric auth between each cancel

4. **Expected Behavior**:
   - ✅ App grants access (appears normal to attacker)
   - ✅ No visible warning or alert
   - ✅ Console log: `DURESS MODE ACTIVATED - Silent alert sent`
   - ✅ App functions normally
   - ✅ Duress state persists until logout

5. **Verify Duress Mode**:
   ```bash
   # Check Flutter console logs
   flutter logs
   ```
   
   Look for:
   ```
   DURESS MODE ACTIVATED - Silent alert sent
   ```

**Important Notes**:
- Duress mode is **silent** - no UI indication
- App appears completely normal to attacker
- Backend receives encrypted alert (when integrated)
- User can continue using app normally
- Duress clears on logout

---

## 📱 Expected User Experience

### First-Time User Flow

```
1. Open App
   ↓
2. See Login Screen (no biometric button yet)
   ↓
3. Enter Phone Number: +2348000000001
   ↓
4. Enter Password: [your password]
   ↓
5. Tap "INITIALIZE SESSION"
   ↓
6. Login Successful
   ↓
7. Dialog Appears: "ENABLE BIOMETRIC LOGIN?"
   ├─→ Tap "NOT NOW": Go to dashboard (biometrics not enabled)
   └─→ Tap "ENABLE": 
       ↓
       OS Biometric Prompt Appears
       ↓
       Scan Fingerprint/Face
       ↓
       Success: "✓ Biometric authentication enabled"
       ↓
       Go to Dashboard
```

### Returning User Flow (Biometric Enabled)

```
1. Open App
   ↓
2. Auto-Prompt: OS Biometric Dialog
   ├─→ SUCCESS: Instant Dashboard Access
   ├─→ CANCEL: Show Login Screen with password option
   └─→ FAILURE: Error message + show password fallback
```

### Login Screen with Biometrics Enabled

```
┌─────────────────────────────────┐
│   SECURE GATEWAY v1.0           │
│                                 │
│   NATIONAL                      │
│   SECURITY                      │
│   PLATFORM                      │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🔐 QUICK ACCESS         │   │
│  │  Use Fingerprint      ➡️ │   │
│  └─────────────────────────┘   │
│                                 │
│  ────── OR USE PASSWORD ──────  │
│                                 │
│  📱 PHONE NUMBER                │
│  [                          ]   │
│                                 │
│  🔒 ACCESS PASSWORD             │
│  [                          ]   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  INITIALIZE SESSION     │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Issue: "No devices found"

**Solution**:
```bash
# Check USB connection
flutter devices

# If still not showing, restart ADB
adb kill-server
adb start-server

# Check again
flutter devices
```

### Issue: "Permission denied" errors

**Cause**: Missing platform permissions

**Solution**: Add platform permissions (these are not yet added):

**Android**: Create/modify `mobile/android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

**iOS**: Create/modify `mobile/ios/Runner/Info.plist`:
```xml
<key>NSFaceIDUsageDescription</key>
<string>Authenticate using Face ID for quick and secure access</string>
```

### Issue: Biometric prompt doesn't appear

**Checks**:
1. Verify biometrics enrolled on device:
   - Android: Settings → Security → Fingerprint
   - iOS: Settings → Face ID & Passcode

2. Check app has permission:
   - Android: Settings → Apps → Community Alert → Permissions
   - iOS: Settings → Community Alert → Face ID

3. Verify `local_auth` package installed:
   ```bash
   flutter pub get
   ```

### Issue: "BiometricService not found"

**Solution**:
```bash
# Reinstall dependencies
cd mobile
flutter clean
flutter pub get
flutter run
```

### Issue: Emulator fingerprint sensor not working

**Solution**:
1. Ensure using system image with Google APIs (not Google Play)
2. Restart emulator
3. Re-enroll fingerprint in Settings
4. Use emulator controls (three dots) → Fingerprint → Touch sensor

---

## 📊 Test Checklist

Use this checklist to ensure comprehensive testing:

### Functional Tests

- [ ] **Enrollment Flow**
  - [ ] Prompt appears after password login
  - [ ] "NOT NOW" option works
  - [ ] "ENABLE" triggers biometric scan
  - [ ] Success message displays
  - [ ] Biometric enabled persists across app restarts

- [ ] **Authentication**
  - [ ] Auto-prompt on app launch
  - [ ] Manual biometric button works
  - [ ] Successful scan grants access
  - [ ] Failed scan shows error

- [ ] **Fallback Mechanisms**
  - [ ] "Cancel" shows password option
  - [ ] Password login still works
  - [ ] Fallbackafter biometric failure

- [ ] **Duress Detection**
  - [ ] 3 rapid failures triggers duress
  - [ ] Access granted in duress mode
  - [ ] No visible warning
  - [ ] Console log confirms duress
  - [ ] Duress persists until logout

- [ ] **State Management**
  - [ ] Biometric state persists across restarts
  - [ ] Logout clears biometric data
  - [ ] Duress mode clears on logout

### Platform Tests

- [ ] **Android**
  - [ ] Fingerprint sensor
  - [ ] Face unlock
  - [ ] Permission requests

- [ ] **iOS**
  - [ ] Touch ID
  - [ ] Face ID
  - [ ] Permission requests

### Error Handling

- [ ] No biometrics enrolled (graceful fallback)
- [ ] Biometrics disabled in device settings
- [ ] App permissions denied
- [ ] Network unavailable (offline mode)
- [ ] Multiple rapid authentication attempts

---

## 🎯 Success Criteria

Your biometric implementation is working correctly if:

✅ **Enrollment**:
- Prompt appears after first password login
- Biometric scan enrolls successfully
- Confirmation message displays

✅ **Auto-Login**:
- App auto-prompts biometric on launch
- Successful scan = instant access
- No password typing required

✅ **Duress Mode**:
- 3 rapid failures activate duress
- App grants access normally
- Console shows duress log
- No visible indication to user

✅ **Fallback**:
- Password login always available
- Clear "OR USE PASSWORD" option
- Works when biometric fails

---

## 📝 Test Results Template

Use this template to document your test results:

```markdown
## Biometric Test Results

**Date**: 2026-02-03
**Tester**: [Your Name]
**Device**: [e.g., Samsung Galaxy S21, Pixel 5, iPhone 13]
**OS Version**: [e.g., Android 12, iOS 15.5]
**Build**: [Git commit hash]

### Test Environment
- [ ] Physical Device
- [ ] Emulator
- [ ] Simulator

### Enrollment
- [ ] ✅ Prompt appeared after login
- [ ] ✅ Biometric scan worked
- [ ] ✅ Success message displayed

### Authentication
- [ ] ✅ Auto-prompt on launch
- [ ] ✅ Manual button works
- [ ] ✅ Successful authentication
- [ ] ✅ Failed authentication handled

### Duress Detection
- [ ] ✅ 3 failures triggered duress
- [ ] ✅ Access granted in duress
- [ ] ✅ No visible warning
- [ ] ✅ Console log confirmed

### Issues Found
1. [Issue description]
2. [Issue description]

### Screenshots
[Attach screenshots of key flows]

### Notes
[Any additional observations]
```

---

## 🚀 Next Steps

After testing biometric authentication:

1. **Add Platform Permissions** (if errors occur)
2. **Test on Multiple Devices** (different Android/iOS versions)
3. **Integrate Backend Duress Alerts**
4. **Add Settings Screen Toggle** (enable/disable biometrics)
5. **Production Testing** (real user scenarios)

---

## 📞 Support

If you encounter issues during testing:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review console logs: `flutter logs`
3. Verify dependencies: `flutter pub get`
4. Clean rebuild: `flutter clean && flutter pub get && flutter run`

For platform-specific issues:
- **Android**: Check `adb logcat` for native errors
- **iOS**: Check Xcode console for native errors

---

## 🔗 Related Documentation

- [Biometric Implementation Walkthrough](file:///home/psalmprax/.gemini/antigravity/brain/f4186320-88a0-4db1-991d-207c88c7de2a/biometric_walkthrough.md)
- [Biometric Implementation Plan](file:///home/psalmprax/.gemini/antigravity/brain/f4186320-88a0-4db1-991d-207c88c7de2a/biometric_implementation_plan.md)
- [BiometricService.dart](file:///home/psalmprax/national_security_platform/mobile/lib/services/biometric_service.dart)
- [LoginScreen.dart](file:///home/psalmprax/national_security_platform/mobile/lib/screens/login_screen.dart)

---

**Happy Testing! 🧪📱**
