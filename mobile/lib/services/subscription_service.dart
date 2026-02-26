import 'dart:async';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/foundation.dart';

/// Subscription tiers
enum SubscriptionTier {
  community,
  guardian,
  enterprise,
}

/// Tier pricing (monthly)
class TierPricing {
  static const double communityPrice = 0.0;
  static const double guardianPrice = 2.99;
  static const double enterprisePrice = 9.99;
}

/// Tier feature definitions
class TierFeatures {
  static const Map<SubscriptionTier, List<String>> features = {
    SubscriptionTier.community: [
      'Basic location tracking (every 10s)',
      'Community alerts feed',
      'Manual panic button',
      'Basic safety score lookup',
      'Ad-supported experience',
      'Max 5 saved locations',
    ],
    SubscriptionTier.guardian: [
      'Enhanced location tracking (every 5s)',
      'Real-time threat notifications',
      'Route safety calculation',
      'Historical location tracking (24h)',
      'Unlimited saved locations',
      'Priority support',
      'No advertisements',
      'Family safety alerts (up to 3 members)',
    ],
    SubscriptionTier.enterprise: [
      'Best-in-class tracking (every 1s)',
      'Custom geofencing zones',
      'Advanced analytics dashboard',
      'API access for third-party integration',
      'Dedicated account manager',
      'White-label options',
      'Team management (up to 50 users)',
      'Real-time dispatch coordination',
      'Incident reporting & export',
    ],
  };
}

/// Subscription status
class SubscriptionStatus {
  final SubscriptionTier tier;
  final DateTime? expirationDate;
  final bool isActive;
  final String? transactionId;

  SubscriptionStatus({
    required this.tier,
    this.expirationDate,
    required this.isActive,
    this.transactionId,
  });
}

/// Subscription service for managing tiers and monetization
class SubscriptionService {
  static final SubscriptionService _instance = SubscriptionService._internal();
  factory SubscriptionService() => _instance;
  SubscriptionService._internal();

  // State
  SubscriptionTier _currentTier = SubscriptionTier.community;
  SubscriptionStatus? _subscriptionStatus;
  bool _isInitialized = false;

  // Listeners
  final _tierController = StreamController<SubscriptionTier>.broadcast();
  Stream<SubscriptionTier> get tierStream => _tierController.stream;

  // API endpoint
  String _apiBaseUrl = 'http://10.0.2.2:8084'; // Android emulator default

  // Current tier
  SubscriptionTier get currentTier => _currentTier;
  
  // Subscription status
  SubscriptionStatus? get subscriptionStatus => _subscriptionStatus;
  
  // Check if premium
  bool get isPremium => 
      _currentTier == SubscriptionTier.guardian || 
      _currentTier == SubscriptionTier.enterprise;

  /// Initialize subscription service
  Future<void> initialize() async {
    if (_isInitialized) return;

    final prefs = await SharedPreferences.getInstance();
    _apiBaseUrl = prefs.getString('api_base_url') ?? _apiBaseUrl;

    // Try to restore subscription from local storage
    await _restoreSubscription();
    
    // Try to validate with backend
    await _validateSubscription();

    _isInitialized = true;
  }

  /// Restore subscription from local storage
  Future<void> _restoreSubscription() async {
    final prefs = await SharedPreferences.getInstance();
    
    String? tierString = prefs.getString('subscription_tier');
    if (tierString != null) {
      _currentTier = SubscriptionTier.values.firstWhere(
        (t) => t.name == tierString,
        orElse: () => SubscriptionTier.community,
      );
    }

    String? expiration = prefs.getString('subscription_expiration');
    String? transactionId = prefs.getString('subscription_transaction_id');
    
    if (tierString != null && expiration != null) {
      _subscriptionStatus = SubscriptionStatus(
        tier: _currentTier,
        expirationDate: DateTime.tryParse(expiration),
        isActive: DateTime.tryParse(expiration)?.isAfter(DateTime.now()) ?? false,
        transactionId: transactionId,
      );
    }
  }

  /// Validate subscription with backend
  Future<void> _validateSubscription() async {
    try {
      // Get stored user ID
      final prefs = await SharedPreferences.getInstance();
      String? userId = prefs.getString('user_id');
      
      if (userId == null) return;

      final response = await http.get(
        Uri.parse('$_apiBaseUrl/api/v1/subscriptions/status?user_id=$userId'),
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        
        // Update tier based on server response
        String tierName = data['tier'] ?? 'community';
        _currentTier = SubscriptionTier.values.firstWhere(
          (t) => t.name == tierName,
          orElse: () => SubscriptionTier.community,
        );

        _subscriptionStatus = SubscriptionStatus(
          tier: _currentTier,
          expirationDate: data['expiration'] != null 
              ? DateTime.tryParse(data['expiration']) 
              : null,
          isActive: data['is_active'] ?? false,
          transactionId: data['transaction_id'],
        );

        // Save to local storage
        await _saveSubscription();
      }
    } catch (e) {
      // Silent fail - use cached data
      debugPrint('Subscription validation error: $e');
    }
  }

  /// Save subscription to local storage
  Future<void> _saveSubscription() async {
    final prefs = await SharedPreferences.getInstance();
    
    await prefs.setString('subscription_tier', _currentTier.name);
    
    if (_subscriptionStatus?.expirationDate != null) {
      await prefs.setString(
        'subscription_expiration', 
        _subscriptionStatus!.expirationDate!.toIso8601String(),
      );
    }
    
    if (_subscriptionStatus?.transactionId != null) {
      await prefs.setString(
        'subscription_transaction_id',
        _subscriptionStatus!.transactionId!,
      );
    }
  }

  /// Upgrade to a higher tier
  Future<bool> upgradeTier(SubscriptionTier newTier) async {
    if (newTier.index <= _currentTier.index) {
      return false; // Can't downgrade via this method
    }

    try {
      // In production, this would initiate IAP flow
      // For now, we'll simulate the upgrade
      
      // Get user ID
      final prefs = await SharedPreferences.getInstance();
      String? userId = prefs.getString('user_id');
      
      if (userId == null) return false;

      // Call backend to initiate upgrade
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/api/v1/subscriptions/upgrade'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': userId,
          'tier': newTier.name,
          'platform': Platform.isIOS ? 'ios' : 'android',
        }),
      );

      if (response.statusCode == 200) {
        _currentTier = newTier;
        _subscriptionStatus = SubscriptionStatus(
          tier: newTier,
          expirationDate: DateTime.now().add(const Duration(days: 30)),
          isActive: true,
        );
        
        await _saveSubscription();
        _tierController.add(_currentTier);
        
        return true;
      }
    } catch (e) {
      debugPrint('Upgrade error: $e');
    }
    
    return false;
  }

  /// Downgrade to community tier
  Future<void> downgradeToCommunity() async {
    _currentTier = SubscriptionTier.community;
    _subscriptionStatus = SubscriptionStatus(
      tier: SubscriptionTier.community,
      isActive: true, // Community is always active
    );
    
    await _saveSubscription();
    _tierController.add(_currentTier);
  }

  /// Check if user can access a specific feature
  bool canAccessFeature(String feature) {
    List<String> features = TierFeatures.features[_currentTier] ?? [];
    return features.contains(feature);
  }

  /// Get features for current tier
  List<String> getCurrentFeatures() {
    return TierFeatures.features[_currentTier] ?? [];
  }

  /// Get features for a specific tier
  List<String> getFeaturesForTier(SubscriptionTier tier) {
    return TierFeatures.features[tier] ?? [];
  }

  /// Get pricing for tier
  double getPriceForTier(SubscriptionTier tier) {
    switch (tier) {
      case SubscriptionTier.community:
        return TierPricing.communityPrice;
      case SubscriptionTier.guardian:
        return TierPricing.guardianPrice;
      case SubscriptionTier.enterprise:
        return TierPricing.enterprisePrice;
    }
  }

  /// Get tier display name
  String getTierDisplayName(SubscriptionTier tier) {
    switch (tier) {
      case SubscriptionTier.community:
        return 'Community';
      case SubscriptionTier.guardian:
        return 'Guardian';
      case SubscriptionTier.enterprise:
        return 'Enterprise';
    }
  }

  /// Restore purchases (for IAP)
  Future<bool> restorePurchases() async {
    // In production, this would call FlutterIAP.restoreTransactions()
    // For demo, we'll just re-validate
    await _validateSubscription();
    return _subscriptionStatus?.isActive ?? false;
  }

  /// Process purchase result (called from IAP callback)
  Future<void> processPurchaseResult(bool success, String? transactionId) async {
    if (success) {
      await _validateSubscription();
    }
  }

  /// Cancel subscription
  Future<bool> cancelSubscription() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      String? userId = prefs.getString('user_id');
      
      if (userId == null) return false;

      final response = await http.post(
        Uri.parse('$_apiBaseUrl/api/v1/subscriptions/cancel'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': userId,
        }),
      );

      if (response.statusCode == 200) {
        // Keep premium until expiration
        return true;
      }
    } catch (e) {
      debugPrint('Cancel subscription error: $e');
    }
    return false;
  }

  /// Clean up
  void dispose() {
    _tierController.close();
  }
}
