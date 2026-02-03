import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Service for handling public safety notifications (reverse alerts)
/// Citizens receive alerts FROM agencies about threats in their area
class PublicAlertService extends ChangeNotifier {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  List<PublicAlert> _receivedAlerts = [];
  
  List<PublicAlert> get receivedAlerts => _receivedAlerts;

  Future<void> initialize() async {
    // Request notification permissions
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      announcement: true,
      badge: true,
      carPlay: false,
      criticalAlert: true,
      provisional: false,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted notification permission');
    }

    // Initialize local notifications
    const AndroidInitializationSettings androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const InitializationSettings initSettings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Get FCM token and send to backend
    String? token = await _fcm.getToken();
    if (token != null) {
      await _sendTokenToBackend(token);
    }

    // Listen for token refresh
    _fcm.onTokenRefresh.listen(_sendTokenToBackend);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);
  }

  /// Handle notification when app is in foreground
  void _handleForegroundMessage(RemoteMessage message) {
    print('Received foreground message: ${message.notification?.title}');

    final alert = PublicAlert.fromRemoteMessage(message);
    _receivedAlerts.insert(0, alert);
    notifyListeners();

    // Show local notification
    _showLocalNotification(alert);
  }

  /// Handle notification when app is in background and user taps it
  void _handleBackgroundMessage(RemoteMessage message) {
    print('User tapped background notification: ${message.notification?.title}');

    final alert = PublicAlert.fromRemoteMessage(message);
    _receivedAlerts.insert(0, alert);
    notifyListeners();

    // Navigate to alert detail (handled by app)
  }

  /// Show local notification with custom sound/priority
  Future<void> _showLocalNotification(PublicAlert alert) async {
    // Choose notification channel based on alert level
    AndroidNotificationDetails androidDetails;
    
    switch (alert.alertLevel) {
      case 'emergency':
        androidDetails = const AndroidNotificationDetails(
          'emergency_alerts',
          'Emergency Alerts',
          channelDescription: 'Life-threatening emergency alerts',
          importance: Importance.max,
          priority: Priority.max,
          sound: RawResourceAndroidNotificationSound('alarm'),
          playSound: true,
          enableVibration: true,
          vibrationPattern: Int64List.fromList([0, 1000, 500, 1000]),
          color: Color(0xFFFF003C),
        );
        break;
      
      case 'critical':
        androidDetails = const AndroidNotificationDetails(
          'critical_alerts',
          'Critical Alerts',
          channelDescription: 'Urgent security alerts requiring immediate attention',
          importance: Importance.high,
          priority: Priority.high,
          sound: RawResourceAndroidNotificationSound('urgent'),
          playSound: true,
          color: Color(0xFFFF8800),
        );
        break;
      
      case 'warning':
        androidDetails = const AndroidNotificationDetails(
          'warning_alerts',
          'Warning Alerts',
          channelDescription: 'Security warnings and advisories',
          importance: Importance.defaultImportance,
          priority: Priority.defaultPriority,
          color: Color(0xFFFFDD00),
        );
        break;
      
      default: // info
        androidDetails = const AndroidNotificationDetails(
          'info_alerts',
          'Information Alerts',
          channelDescription: 'General security information',
          importance: Importance.low,
          priority: Priority.low,
          color: Color(0xFF00FF95),
        );
    }

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
      interruptionLevel: InterruptionLevel.timeSensitive,
    );

    NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      alert.hashCode,
      alert.title,
      alert.message,
      details,
      payload: alert.id,
    );
  }

  /// Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    final alertId = response.payload;
    print('User tapped notification for alert: $alertId');
    
    // Find alert and mark as read
    final index = _receivedAlerts.indexWhere((a) => a.id == alertId);
    if (index != -1) {
      _receivedAlerts[index].isRead = true;
      notifyListeners();
    }
  }

  /// Send FCM token to backend
  Future<void> _sendTokenToBackend(String token) async {
    try {
      // TODO: Send to backend API
      // await apiService.updateDeviceToken(token);
      print('FCM Token: $token');
    } catch (e) {
      print('Failed to send token to backend: $e');
    }
  }

  /// Mark alert as read
  void markAsRead(String alertId) {
    final index = _receivedAlerts.indexWhere((a) => a.id == alertId);
    if (index != -1) {
      _receivedAlerts[index].isRead = true;
      notifyListeners();
    }
  }

  /// Get unread alert count
  int get unreadCount => _receivedAlerts.where((a) => !a.isRead).length;

  /// Clear all alerts
  void clearAll() {
    _receivedAlerts.clear();
    notifyListeners();
  }
}

/// Model for public safety alerts
class PublicAlert {
  final String id;
  final String title;
  final String message;
  final String alertLevel; // info, warning, critical, emergency
  final String? alertType;
  final DateTime receivedAt;
  final DateTime updatedAt;
  bool isRead;

  PublicAlert({
    required this.id,
    required this.title,
    required this.message,
    required this.alertLevel,
    this.alertType,
    required this.receivedAt,
    required this.updatedAt,
    this.isRead = false,
  });

  factory PublicAlert.fromRemoteMessage(RemoteMessage message) {
    return PublicAlert(
      id: message.data['alert_id'] ?? '',
      title: message.notification?.title ?? 'Security Alert',
      message: message.notification?.body ?? '',
      alertLevel: message.data['alert_level'] ?? 'info',
      alertType: message.data['alert_type'],
      receivedAt: DateTime.now(),
      updatedAt: message.data['updated_at'] != null 
          ? DateTime.parse(message.data['updated_at']) 
          : DateTime.now(),
    );
  }

  /// Get icon based on alert level
  IconData get icon {
    switch (alertLevel) {
      case 'emergency':
        return Icons.emergency;
      case 'critical':
        return Icons.warning_amber;
      case 'warning':
        return Icons.info_outline;
      default:
        return Icons.notifications;
    }
  }

  /// Get color based on alert level
  Color get color {
    switch (alertLevel) {
      case 'emergency':
        return const Color(0xFFFF003C);
      case 'critical':
        return const Color(0xFFFF8800);
      case 'warning':
        return const Color(0xFFFFDD00);
      default:
        return const Color(0xFF00FF95);
    }
  }
}
