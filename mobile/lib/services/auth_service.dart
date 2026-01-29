import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_service.dart';
import 'dart:math';

class AuthService extends ChangeNotifier {
  final ApiService _apiService;
  final _storage = const FlutterSecureStorage();
  
  String? _token;
  String? _userId;
  String? _role;
  bool _isAuthenticated = false;
  bool _isOnboarded = false;

  String? get token => _token;
  String? get userId => _userId;
  String? get role => _role;
  bool get isAuthenticated => _isAuthenticated;
  bool get isOnboarded => _isOnboarded;

  AuthService(this._apiService);

  Future<void> checkAuthStatus() async {
    _token = await _storage.read(key: 'jwt_token');
    _userId = await _storage.read(key: 'user_id');
    _role = await _storage.read(key: 'user_role');
    _isOnboarded = await _storage.read(key: 'is_onboarded') == 'true';
    
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
      
      _isAuthenticated = true;
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<bool> register(String fullName, String phoneNumber, String password, String role) async {
    return await _apiService.requestAccess(fullName, phoneNumber, password, role);
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
    await _storage.deleteAll();
    _token = null;
    _userId = null;
    _role = null;
    _isAuthenticated = false;
    _isOnboarded = false;
    notifyListeners();
  }
}
