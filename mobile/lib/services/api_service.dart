import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart' show kIsWeb;
import '../models/alert_model.dart';

class ApiService {
  final String _baseUrl;

  ApiService({String? baseUrl}) : _baseUrl = baseUrl ?? _getDefaultBaseUrl();

  static String _getDefaultBaseUrl() {
    if (kIsWeb) {
      // In web mode, we often use relative paths if served via gateway
      // or point to the gateway port.
      return ''; 
    }
    // Default for Android emulator to host machine
    return 'http://10.0.2.2:8085';
  }

  Future<Map<String, dynamic>?> login(String phoneNumber, String password) async {
    try {
      final url = Uri.parse('$_baseUrl/api/v1/auth/login');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phone_number': phoneNumber,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('❌ Login error: $e');
      return null;
    }
  }

  Future<bool> requestAccess(String fullName, String phoneNumber, String password, String role) async {
    try {
      final url = Uri.parse('$_baseUrl/api/v1/auth/request-access');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': fullName,
          'phone_number': phoneNumber,
          'password': password,
          'role': role,
        }),
      );

      return response.statusCode == 201;
    } catch (e) {
      print('❌ Request access error: $e');
      return false;
    }
  }

  Future<bool> onboard(String userId, String hwid, String publicKey, String signature) async {
    try {
      final url = Uri.parse('$_baseUrl/api/v1/auth/onboard');
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': userId,
          'device_hwid': hwid,
          'public_key': publicKey,
          'signature': signature,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Onboarding error: $e');
      return false;
    }
  }

  Future<bool> submitAlert(AlertModel alert, String token) async {
    try {
      final url = Uri.parse('$_baseUrl/api/v1/alerts');
      
      final payload = {
        'user_id': alert.userId,
        'alert_type': alert.alertType,
        'latitude': alert.latitude,
        'longitude': alert.longitude,
        'content': alert.content,
      };

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        print('✅ Alert synchronized: ${alert.id}');
        return true;
      } else {
        print('❌ Sync failed: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Network error during sync: $e');
      return false;
    }
  }
}
