import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// Location accuracy levels
enum LocationAccuracy { low, medium, high, best }

/// Subscription tier for feature gating
enum SubscriptionTier { community, guardian, enterprise }

/// Location service for comprehensive location tracking
class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  StreamSubscription<Position>? _positionStream;
  final _locationController = StreamController<Position>.broadcast();
  
  // Configuration
  LocationAccuracy _accuracy = LocationAccuracy.high;
  int _updateIntervalMs = 5000; // 5 seconds default
  int _distanceFilter = 10; // 10 meters
  
  // Location history (last 24 hours stored locally)
  final List<Position> _locationHistory = [];
  static const int MAX_HISTORY_SIZE = 17280; // 24 hours * 60 min * 60 sec / 5 sec intervals
  
  // Subscription tier (would be managed by subscription service)
  SubscriptionTier _currentTier = SubscriptionTier.community;
  
  // API endpoint for location updates
  String _apiBaseUrl = 'http://10.0.2.2:8084'; // Android emulator default

  /// Stream of location updates
  Stream<Position> get locationStream => _locationController.stream;

  /// Current subscription tier
  SubscriptionTier get currentTier => _currentTier;

  /// Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Check and request location permission
  Future<LocationPermission> checkPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();
    return permission;
  }

  /// Request location permission
  Future<LocationPermission> requestPermission() async {
    LocationPermission permission = await Geolocator.requestPermission();
    return permission;
  }

  /// Initialize location service with user's subscription tier
  Future<void> initialize({SubscriptionTier tier = SubscriptionTier.community}) async {
    _currentTier = tier;
    
    // Load saved preferences
    final prefs = await SharedPreferences.getInstance();
    _apiBaseUrl = prefs.getString('api_base_url') ?? _apiBaseUrl;
    
    // Apply tier-based settings
    _applyTierSettings();
  }

  /// Apply subscription tier settings
  void _applyTierSettings() {
    switch (_currentTier) {
      case SubscriptionTier.community:
        // Limited tracking for free tier
        _accuracy = LocationAccuracy.medium;
        _updateIntervalMs = 10000; // 10 seconds
        _distanceFilter = 50; // 50 meters
        break;
      case SubscriptionTier.guardian:
        // Better tracking for paid tier
        _accuracy = LocationAccuracy.high;
        _updateIntervalMs = 5000; // 5 seconds
        _distanceFilter = 20; // 20 meters
        break;
      case SubscriptionTier.enterprise:
        // Best tracking for enterprise
        _accuracy = LocationAccuracy.best;
        _updateIntervalMs = 1000; // 1 second
        _distanceFilter = 5; // 5 meters
        break;
    }
  }

  /// Update subscription tier
  void setTier(SubscriptionTier tier) {
    _currentTier = tier;
    _applyTierSettings();
    
    // Restart tracking if active
    if (_positionStream != null) {
      stopTracking();
      startTracking();
    }
  }

  /// Start continuous location tracking
  Future<bool> startTracking() async {
    // Check if location services are enabled
    bool serviceEnabled = await isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    // Check permission
    LocationPermission permission = await checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    // Configure location settings
    LocationSettings locationSettings = LocationSettings(
      accuracy: _getAccuracy(),
      distanceFilter: _distanceFilter,
    );

    // Start listening to location updates
    _positionStream = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      (Position position) {
        // Add to history
        _addToHistory(position);
        
        // Broadcast to listeners
        _locationController.add(position);
        
        // Upload to backend (if tier allows)
        _uploadLocation(position);
      },
      onError: (error) {
        print('Location tracking error: $error');
      },
    );

    return true;
  }

  /// Stop location tracking
  void stopTracking() {
    _positionStream?.cancel();
    _positionStream = null;
  }

  /// Get current position
  Future<Position?> getCurrentPosition() async {
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(accuracy: _getAccuracy()),
      );
    } catch (e) {
      print('Error getting current position: $e');
      return null;
    }
  }

  /// Get location accuracy based on enum
  LocationAccuracy _getAccuracy() {
    switch (_accuracy) {
      case LocationAccuracy.low:
        return LocationAccuracy.low;
      case LocationAccuracy.medium:
        return LocationAccuracy.medium;
      case LocationAccuracy.high:
        return LocationAccuracy.high;
      case LocationAccuracy.best:
        return LocationAccuracy.best;
    }
  }

  /// Add position to history
  void _addToHistory(Position position) {
    _locationHistory.add(position);
    
    // Trim history if too long
    while (_locationHistory.length > MAX_HISTORY_SIZE) {
      _locationHistory.removeAt(0);
    }
  }

  /// Get location history
  List<Position> getLocationHistory() {
    return List.unmodifiable(_locationHistory);
  }

  /// Get location history for a time range (in hours)
  List<Position> getLocationHistoryForPeriod(int hours) {
    final cutoff = DateTime.now().subtract(Duration(hours: hours));
    return _locationHistory.where((p) => p.timestamp.isAfter(cutoff)).toList();
  }

  /// Upload location to backend
  Future<void> _uploadLocation(Position position) async {
    // Only upload for premium tiers
    if (_currentTier == SubscriptionTier.community) {
      return; // Don't upload for free tier to save resources
    }

    try {
      await http.post(
        Uri.parse('$_apiBaseUrl/api/v1/users/location'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'altitude': position.altitude,
          'speed': position.speed,
          'timestamp': position.timestamp.toIso8601String(),
        }),
      );
    } catch (e) {
      // Silent fail - don't disrupt tracking
    }
  }

  /// Calculate distance between two points
  double calculateDistance(double startLat, double startLng, double endLat, double endLng) {
    return Geolocator.distanceBetween(startLat, startLng, endLat, endLng);
  }

  /// Check if within radius of a point
  bool isWithinRadius(double currentLat, double currentLng, double targetLat, double targetLng, double radiusMeters) {
    double distance = calculateDistance(currentLat, currentLng, targetLat, targetLng);
    return distance <= radiusMeters;
  }

  /// Get nearby alerts within radius
  Future<List<Map<String, dynamic>>> getNearbyAlerts(double lat, double lng, double radiusMeters) async {
    try {
      final response = await http.get(
        Uri.parse('$_apiBaseUrl/api/v1/alerts/nearby?lat=$lat&lng=$lng&radius=$radiusMeters'),
      );
      
      if (response.statusCode == 200) {
        List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      }
    } catch (e) {
      print('Error fetching nearby alerts: $e');
    }
    return [];
  }

  /// Calculate route safety score (simplified)
  Future<double> calculateRouteSafety(List<Map<String, double>> routePoints) async {
    if (routePoints.isEmpty) return 100.0;
    
    double totalRisk = 0;
    int pointsChecked = 0;
    
    for (var point in routePoints) {
      double lat = point['lat']!;
      double lng = point['lng']!;
      
      // Get nearby alerts within 500m
      var alerts = await getNearbyAlerts(lat, lng, 500);
      
      if (alerts.isNotEmpty) {
        // Calculate risk based on alert severity
        for (var alert in alerts) {
          double severity = (alert['severity_score'] ?? 0.0).toDouble();
          totalRisk += severity;
        }
        pointsChecked++;
      }
    }
    
    if (pointsChecked == 0) return 100.0;
    
    // Convert risk to safety score (0-100)
    double avgRisk = totalRisk / pointsChecked;
    return (100 - (avgRisk * 100)).clamp(0.0, 100.0);
  }

  /// Clean up resources
  void dispose() {
    stopTracking();
    _locationController.close();
  }
}
