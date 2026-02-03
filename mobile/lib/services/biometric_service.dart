import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'dart:convert';
import 'dart:async';

enum BiometricAuthResult {
  success,
  failure,
  duress,
  notAvailable,
  notEnrolled,
  cancelled,
}

class BiometricService {
  // Use getters to avoid early instantiation on web which can cause platform channel crashes
  LocalAuthentication get _localAuth => LocalAuthentication();
  FlutterSecureStorage get _storage => const FlutterSecureStorage();
  
  // Duress detection configuration
  static const int _maxFailuresForDuress = 3;
  static const int _duressTimeWindowSeconds = 10;
  
  final List<DateTime> _recentFailures = [];

  /// Check if the device supports biometric authentication
  Future<bool> canAuthenticateWithBiometrics() async {
    if (kIsWeb) return false;
    try {
      final bool canAuthenticate = await _localAuth.canCheckBiometrics;
      final bool isDeviceSupported = await _localAuth.isDeviceSupported();
      return canAuthenticate && isDeviceSupported;
    } on PlatformException {
      return false;
    }
  }

  /// Get list of available biometric types on this device
  Future<List<BiometricType>> getAvailableBiometrics() async {
    if (kIsWeb) return [];
    try {
      return await _localAuth.getAvailableBiometrics();
    } on PlatformException {
      return [];
    }
  }

  /// Check if biometric authentication is enabled for this user
  Future<bool> isBiometricEnabled() async {
    if (kIsWeb) return false;
    final enabled = await _storage.read(key: 'biometric_enabled');
    return enabled == 'true';
  }

  /// Enable biometric authentication for a user
  /// Stores encrypted credential hash for future validation
  Future<bool> enableBiometricAuth(String userId, String credentialHash) async {
    try {
      // Verify biometrics are available
      if (!await canAuthenticateWithBiometrics()) {
        return false;
      }

      // Verify user can authenticate right now
      final authenticated = await authenticate(checkDuress: false);
      if (authenticated != BiometricAuthResult.success) {
        return false;
      }

      // Store encrypted credential data
      await _storage.write(key: 'biometric_enabled', value: 'true');
      await _storage.write(key: 'biometric_user_id', value: userId);
      await _storage.write(key: 'biometric_credential_hash', value: credentialHash);
      
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Authenticate using biometrics
  Future<BiometricAuthResult> authenticate({bool checkDuress = true}) async {
    try {
      // Check if biometrics are available
      if (!await canAuthenticateWithBiometrics()) {
        return BiometricAuthResult.notAvailable;
      }

      // Check if any biometrics are enrolled
      final available = await getAvailableBiometrics();
      if (available.isEmpty) {
        return BiometricAuthResult.notEnrolled;
      }

      // Attempt authentication
      final bool authenticated = await _localAuth.authenticate(
        localizedReason: 'Authenticate to access your security alerts',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
          sensitiveTransaction: true,
        ),
      );

      if (authenticated) {
        // Clear failure history on success
        _recentFailures.clear();
        return BiometricAuthResult.success;
      } else {
        // Record failure for duress detection
        if (checkDuress) {
          final duressDetected = _recordFailureAndCheckDuress();
          if (duressDetected) {
            return BiometricAuthResult.duress;
          }
        }
        return BiometricAuthResult.failure;
      }
    } on PlatformException catch (e) {
      if (e.code == 'NotAvailable') {
        return BiometricAuthResult.notAvailable;
      } else if (e.code == 'NotEnrolled') {
        return BiometricAuthResult.notEnrolled;
      } else if (e.code == 'LockedOut' || e.code == 'PermanentlyLockedOut') {
        // Too many failed attempts - likely duress
        return checkDuress ? BiometricAuthResult.duress : BiometricAuthResult.failure;
      }
      return BiometricAuthResult.cancelled;
    }
  }

  /// Disable biometric authentication
  Future<void> disableBiometricAuth() async {
    if (kIsWeb) return;
    await _storage.delete(key: 'biometric_enabled');
    await _storage.delete(key: 'biometric_user_id');
    await _storage.delete(key: 'biometric_credential_hash');
    _recentFailures.clear();
  }

  /// Get stored credential hash (for validation after biometric auth)
  Future<String?> getStoredCredentialHash() async {
    if (kIsWeb) return null;
    return await _storage.read(key: 'biometric_credential_hash');
  }

  /// Get stored user ID
  Future<String?> getStoredUserId() async {
    if (kIsWeb) return null;
    return await _storage.read(key: 'biometric_user_id');
  }

  /// Record a failed authentication attempt and check for duress pattern
  bool _recordFailureAndCheckDuress() {
    final now = DateTime.now();
    _recentFailures.add(now);

    // Remove failures outside the time window
    _recentFailures.removeWhere((failure) {
      final difference = now.difference(failure).inSeconds;
      return difference > _duressTimeWindowSeconds;
    });

    // Check if we have enough failures to indicate duress
    if (_recentFailures.length >= _maxFailuresForDuress) {
      // Duress detected - clear history to avoid repeated triggers
      _recentFailures.clear();
      return true;
    }

    return false;
  }

  /// Get a user-friendly description of available biometric types
  Future<String> getBiometricTypeDescription() async {
    final types = await getAvailableBiometrics();
    
    if (types.isEmpty) {
      return 'No biometrics enrolled';
    }

    if (types.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (types.contains(BiometricType.fingerprint)) {
      return 'Fingerprint';
    } else if (types.contains(BiometricType.iris)) {
      return 'Iris scan';
    }else if (types.contains(BiometricType.strong)) {
      return 'Biometric authentication';
    } else {
      return 'Biometrics';
    }
  }

  /// Stop biometric authentication (for app backgrounding)
  Future<void> stopAuthentication() async {
    if (kIsWeb) return;
    try {
      await _localAuth.stopAuthentication();
    } catch (e) {
      // Ignore errors
    }
  }
}
