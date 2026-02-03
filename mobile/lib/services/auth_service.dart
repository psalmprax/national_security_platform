import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';
import 'biometric_service.dart';
import 'dart:math';
import 'dart:convert';
import 'package:crypto/crypto.dart';

class AuthService extends ChangeNotifier {
  final ApiService _apiService;
  final BiometricService _biometricService;
  final _storage = const FlutterSecureStorage();
  
  String? _token;
  String? _userId;
  String? _role;
  bool _isAuthenticated = false;
  bool _isOnboarded = false;
  bool _duressMode = false;

  String? get token => _token;
  String? get userId => _userId;
  String? get role => _role;
  bool get isAuthenticated => _isAuthenticated;
  bool get isOnboarded => _isOnboarded;
  bool get duressMode => _duressMode;

  AuthService(this._apiService, this._biometricService);

  Future<void> checkAuthStatus() async {
    _token = await _storage.read(key: 'jwt_token');
    _userId = await _storage.read(key: 'user_id');
    _role = await _storage.read(key: 'user_role');
    _isOnboarded = await _storage.read(key: 'is_onboarded') == 'true';
    _duressMode = await _storage.read(key: 'duress_mode') == 'true';
    
    _isAuthenticated = _token != null;
    notifyListeners();
  }

  Future<bool> login(String phoneNumber, String password) async {
    final response = await _apiService.login(phoneNumber, password);
    if (response != null && response['success'] == true) {
      _token = response['token'];
      // In a real app, we'd decode the JWT to get userId and role
      // or the API would return them. For now, we mock them.
      _userId = '550e8400-e29b-41d4-a716-446655440000'; 
      _role = 'TRADITIONAL_RULER';

      await _storage.write(key: 'jwt_token', value: _token);
      await _storage.write(key: 'user_id', value: _userId);
      await _storage.write(key: 'user_role', value: _role);
      
      // Store credential hash for biometric auth
      final credentialHash = _hashCredentials(phoneNumber, password);
      await _storage.write(key: 'credential_hash', value: credentialHash);
      
      _isAuthenticated = true;
      _duressMode = false;
      notifyListeners();
      return true;
    }
    return false;
  }

  /// Login using biometrics
  Future<BiometricAuthResult> loginWithBiometrics() async {
    // Check if biometric is enabled
    if (!await _biometricService.isBiometricEnabled()) {
      return BiometricAuthResult.notAvailable;
    }

    // Authenticate
    final result = await _biometricService.authenticate();

    if (result == BiometricAuthResult.success) {
      // Retrieve stored credentials
      _token = await _storage.read(key: 'jwt_token');
      _userId = await _storage.read(key: 'user_id');
      _role = await _storage.read(key: 'user_role');
      _isOnboarded = await _storage.read(key: 'is_onboarded') == 'true';
      
      _isAuthenticated = true;
      _duressMode = false;
      notifyListeners();
      return BiometricAuthResult.success;
    } else if (result == BiometricAuthResult.duress) {
      // Duress mode - authenticate but mark as duress
      _token = await _storage.read(key: 'jwt_token');
      _userId = await _storage.read(key: 'user_id');
      _role = await _storage.read(key: 'user_role');
      _isOnboarded = await _storage.read(key: 'is_onboarded') == 'true';
      
      _isAuthenticated = true;
      _duressMode = true;
      await _storage.write(key: 'duress_mode', value: 'true');
      
      // TODO: Send silent duress alert to backend
      _sendDuressAlert();
      
      notifyListeners();
      return BiometricAuthResult.duress;
    }

    return result;
  }

  /// Enable biometric authentication
  Future<bool> setupBiometricAuth() async {
    if (_userId == null) return false;

    final credentialHash = await _storage.read(key: 'credential_hash');
    if (credentialHash == null) return false;

    return await _biometricService.enableBiometricAuth(_userId!, credentialHash);
  }

  /// Check if biometric auth is enabled
  Future<bool> isBiometricEnabled() async {
    return await _biometricService.isBiometricEnabled();
  }

  /// Disable biometric authentication
  Future<void> disableBiometricAuth() async {
    await _biometricService.disableBiometricAuth();
    notifyListeners();
  }

  /// Get description of available biometric types
  Future<String> getBiometricDescription() async {
    return await _biometricService.getBiometricTypeDescription();
  }

  /// Hash credentials for secure storage
  String _hashCredentials(String phoneNumber, String password) {
    final bytes = utf8.encode(phoneNumber + password);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Send silent duress alert to backend
  Future<void> _sendDuressAlert() async {
    try {
      // TODO: Implement actual backend call
      // await _apiService.sendDuressAlert(_userId!);
      print('DURESS MODE ACTIVATED - Silent alert sent');
    } catch (e) {
      print('Failed to send duress alert: $e');
    }
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String password,
    required String role,
    required String nin,
    required String stateId,
    required String lgaId,
    String? agencyId,
    String? rank,
    String? badgeNumber,
    String? monarchGrade,
    String? domainTerritory,
  }) async {
    return await _apiService.requestAccess(
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber,
      password: password,
      role: role,
      nin: nin,
      stateId: stateId,
      lgaId: lgaId,
      agencyId: agencyId,
      rank: rank,
      badgeNumber: badgeNumber,
      monarchGrade: monarchGrade,
      domainTerritory: domainTerritory,
    );
  }

  Future<bool> performOnboarding() async {
    if (_userId == null) return false;

    // Simulate Hardware Identity Generation (PKI)
    final hwid = 'HWID-' + Random().nextInt(1000000).toString();
    final publicKey = 'PUB-' + Random().nextInt(1000000).toString();
    final signature = 'SIG-' + Random().nextInt(1000000).toString();

    final success = await _apiService.onboard(_userId!, hwid, publicKey, signature);
    if (success) {
      await _storage.write(key: 'is_onboarded', value: 'true');
      _isOnboarded = true;
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    await _biometricService.disableBiometricAuth();
    await _storage.deleteAll();
    _token = null;
    _userId = null;
    _role = null;
    _isAuthenticated = false;
    _isOnboarded = false;
    _duressMode = false;
    notifyListeners();
  }
}
