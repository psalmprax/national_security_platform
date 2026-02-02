import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsService with ChangeNotifier {
  final _secureStorage = const FlutterSecureStorage();
  late SharedPreferences _prefs;

  // Acoustic Detection Settings
  bool _acousticDetectionEnabled = false;
  double _acousticSensitivity = 0.5;

  // Duress Settings
  String? _duressPin;
  List<String> _emergencyContacts = [];

  // Ad & Personalization Settings
  bool _personalizedAlerts = true;
  bool _shareUsageData = false;

  // Getters
  bool get acousticDetectionEnabled => _acousticDetectionEnabled;
  double get acousticSensitivity => _acousticSensitivity;
  bool get hasDuressPin => _duressPin != null && _duressPin!.isNotEmpty;
  List<String> get emergencyContacts => _emergencyContacts;
  bool get personalizedAlerts => _personalizedAlerts;
  bool get shareUsageData => _shareUsageData;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    
    // Load general preferences
    _acousticDetectionEnabled = _prefs.getBool('acoustic_detection_enabled') ?? false;
    _acousticSensitivity = _prefs.getDouble('acoustic_sensitivity') ?? 0.5;
    _personalizedAlerts = _prefs.getBool('personalized_alerts') ?? true;
    _shareUsageData = _prefs.getBool('share_usage_data') ?? false;
    _emergencyContacts = _prefs.getStringList('emergency_contacts') ?? [];

    // Load sensitive data from secure storage
    _duressPin = await _secureStorage.read(key: 'duress_pin');
    
    notifyListeners();
  }

  // Setters
  Future<void> setAcousticDetection(bool enabled) async {
    _acousticDetectionEnabled = enabled;
    await _prefs.setBool('acoustic_detection_enabled', enabled);
    notifyListeners();
  }

  Future<void> setAcousticSensitivity(double value) async {
    _acousticSensitivity = value;
    await _prefs.setDouble('acoustic_sensitivity', value);
    notifyListeners();
  }

  Future<void> setDuressPin(String pin) async {
    _duressPin = pin;
    await _secureStorage.write(key: 'duress_pin', value: pin);
    notifyListeners();
  }

  Future<void> setPersonalizedAlerts(bool enabled) async {
    _personalizedAlerts = enabled;
    await _prefs.setBool('personalized_alerts', enabled);
    notifyListeners();
  }

  Future<void> setShareUsageData(bool enabled) async {
    _shareUsageData = enabled;
    await _prefs.setBool('share_usage_data', enabled);
    notifyListeners();
  }

  Future<void> addEmergencyContact(String contact) async {
    if (!_emergencyContacts.contains(contact)) {
      _emergencyContacts.add(contact);
      await _prefs.setStringList('emergency_contacts', _emergencyContacts);
      notifyListeners();
    }
  }

  Future<void> removeEmergencyContact(String contact) async {
    if (_emergencyContacts.remove(contact)) {
      await _prefs.setStringList('emergency_contacts', _emergencyContacts);
      notifyListeners();
    }
  }

  Future<void> clearCache() async {
    // Logic to clear local application cache (e.g. temp directory)
    // For now just simulation
    await Future.delayed(const Duration(seconds: 1));
  }
}
