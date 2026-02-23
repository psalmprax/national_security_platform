import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Agency model
class Agency {
  final String id;
  final String name;
  final String acronym;
  final String type;
  final String jurisdictionScope;
  final List<String> alertTypes;

  Agency({
    required this.id,
    required this.name,
    required this.acronym,
    required this.type,
    required this.jurisdictionScope,
    required this.alertTypes,
  });

  factory Agency.fromJson(Map<String, dynamic> json) {
    return Agency(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      acronym: json['acronym'] ?? '',
      type: json['type'] ?? '',
      jurisdictionScope: json['jurisdiction_scope'] ?? '',
      alertTypes: List<String>.from(json['alert_types'] ?? []),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'acronym': acronym,
    'type': type,
    'jurisdiction_scope': jurisdictionScope,
    'alert_types': alertTypes,
  };
}

/// Agency membership request
class AgencyMembershipRequest {
  final String agencyId;
  final String requestedRole;
  final String status;
  final DateTime? requestedAt;

  AgencyMembershipRequest({
    required this.agencyId,
    required this.requestedRole,
    required this.status,
    this.requestedAt,
  });

  factory AgencyMembershipRequest.fromJson(Map<String, dynamic> json) {
    return AgencyMembershipRequest(
      agencyId: json['agency_id'] ?? '',
      requestedRole: json['requested_role'] ?? '',
      status: json['status'] ?? 'pending',
      requestedAt: json['requested_at'] != null 
          ? DateTime.tryParse(json['requested_at']) 
          : null,
    );
  }
}

/// Agency service for mobile app
class AgencyService {
  static final AgencyService _instance = AgencyService._internal();
  factory AgencyService() => _instance;
  AgencyService._internal();

  String _apiBaseUrl = 'http://10.0.2.2:8084'; // Android emulator default

  /// Initialize agency service
  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _apiBaseUrl = prefs.getString('api_base_url') ?? _apiBaseUrl;
  }

  /// Get all available agencies
  Future<List<Agency>> getAgencies() async {
    try {
      final response = await http.get(
        Uri.parse('$_apiBaseUrl/api/v1/agencies'),
      );

      if (response.statusCode == 200) {
        List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Agency.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching agencies: $e');
    }
    return [];
  }

  /// Get agency by ID
  Future<Agency?> getAgency(String agencyId) async {
    try {
      final response = await http.get(
        Uri.parse('$_apiBaseUrl/api/v1/agencies/$agencyId'),
      );

      if (response.statusCode == 200) {
        return Agency.fromJson(jsonDecode(response.body));
      }
    } catch (e) {
      print('Error fetching agency: $e');
    }
    return null;
  }

  /// Get user's agencies (memberships)
  Future<List<Agency>> getMyAgencies() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('user_id');
      
      if (userId == null) return [];

      // In a real implementation, this would query the user's agency assignments
      // For now, we'll fetch all agencies and filter by user membership
      final allAgencies = await getAgencies();
      
      // Return all agencies - in production, filter by user's assignments
      return allAgencies;
    } catch (e) {
      print('Error fetching user agencies: $e');
    }
    return [];
  }

  /// Request membership to an agency
  Future<bool> requestMembership(String agencyId, String role) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('user_id');
      
      if (userId == null) return false;

      // Store request locally first
      final requests = await _getStoredRequests();
      requests.add({
        'agency_id': agencyId,
        'requested_role': role,
        'user_id': userId,
        'status': 'pending',
        'requested_at': DateTime.now().toIso8601String(),
      });
      await _saveStoredRequests(requests);

      // Try to notify backend (optional - can work offline)
      try {
        await http.post(
          Uri.parse('$_apiBaseUrl/api/v1/agencies/$agencyId/members'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'user_id': userId,
            'role': role,
          }),
        );
      } catch (e) {
        // Backend not available - request saved locally
        print('Backend unavailable, request saved locally');
      }

      return true;
    } catch (e) {
      print('Error requesting membership: $e');
    }
    return false;
  }

  /// Cancel membership request
  Future<bool> cancelMembershipRequest(String agencyId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('user_id');
      
      if (userId == null) return false;

      final requests = await _getStoredRequests();
      requests.removeWhere(
        (r) => r['agency_id'] == agencyId && r['user_id'] == userId
      );
      await _saveStoredRequests(requests);

      return true;
    } catch (e) {
      print('Error canceling membership: $e');
    }
    return false;
  }

  /// Get pending membership requests
  Future<List<AgencyMembershipRequest>> getPendingRequests() async {
    try {
      final requests = await _getStoredRequests();
      return requests
          .where((r) => r['status'] == 'pending')
          .map((r) => AgencyMembershipRequest(
            agencyId: r['agency_id'],
            requestedRole: r['requested_role'],
            status: r['status'],
            requestedAt: r['requested_at'] != null 
                ? DateTime.tryParse(r['requested_at']) 
                : null,
          ))
          .toList();
    } catch (e) {
      print('Error getting pending requests: $e');
    }
    return [];
  }

  /// Get user's role in an agency
  Future<String?> getUserAgencyRole(String agencyId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('agency_role_$agencyId');
    } catch (e) {
      print('Error getting user agency role: $e');
    }
    return null;
  }

  /// Check if user is a member of an agency
  Future<bool> isAgencyMember(String agencyId) async {
    final role = await getUserAgencyRole(agencyId);
    return role != null;
  }

  /// Get agency by alert type - useful for routing
  Future<List<Agency>> getAgenciesForAlertType(String alertType) async {
    final agencies = await getAgencies();
    return agencies
        .where((a) => a.alertTypes.contains(alertType))
        .toList();
  }

  // Helper methods for local storage
  Future<List<Map<String, dynamic>>> _getStoredRequests() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('agency_requests');
    if (data == null) return [];
    return List<Map<String, dynamic>>.from(jsonDecode(data));
  }

  Future<void> _saveStoredRequests(List<Map<String, dynamic>> requests) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('agency_requests', jsonEncode(requests));
  }
}
