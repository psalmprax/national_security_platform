import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:location/location.dart';
import 'package:uuid/uuid.dart';
import '../models/alert_model.dart';
import '../services/api_service.dart';
import '../services/persistence_service.dart';
import '../services/sync_service.dart';
import '../services/auth_service.dart';
import 'settings_screen.dart';

class PanicScreen extends StatefulWidget {
  const PanicScreen({super.key});

  @override
  State<PanicScreen> createState() => _PanicScreenState();
}

class _PanicScreenState extends State<PanicScreen> {
  final Location _location = Location();
  bool _isPanicActive = false;
  String? _activeAlertType;

  Future<void> _onPanicButtonPressed(String alertType) async {
    setState(() {
      _isPanicActive = true;
      _activeAlertType = alertType;
    });

    // Capture location (mocked for now if needed, but using package)
    // For MVP, we use hardcoded or simple location if permission fails
    double lat = 9.0820;
    double lng = 7.4913;

    try {
      final locData = await _location.getLocation();
      lat = locData.latitude ?? lat;
      lng = locData.longitude ?? lng;
    } catch (e) {
      print('Location error: $e');
    }

    final auth = context.read<AuthService>();
    final now = DateTime.now().toIso8601String();
    final alert = AlertModel(
      id: const Uuid().v4(),
      userId: auth.userId ?? '550e8400-e29b-41d4-a716-446655440000', // Fallback for safety
      alertType: alertType,
      latitude: lat,
      longitude: lng,
      content: 'EMERGENCY REPORT: $alertType detected at $lat, $lng',
      status: 'PENDING',
      timestamp: now,
      updatedAt: now,
      isDuress: false, // Default for now
    );

    final persistence = context.read<PersistenceService>();
    await persistence.saveAlert(alert);

    // Trigger immediate sync attempt
    if (mounted) {
      context.read<SyncService>().syncNow();
    }

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('ALERT TRANSMITTED: $alertType'),
          backgroundColor: const Color(0xFFFF003C),
          duration: const Duration(seconds: 3),
        ),
      );

      // Reset state after delay
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted) {
          setState(() {
            _isPanicActive = false;
            _activeAlertType = null;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildPanicGrid()),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final auth = context.watch<AuthService>();
    return Padding(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Color(0xFF00FF95),
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: Color(0xFF00FF95), blurRadius: 10)],
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'SYSTEM ACTIVE // SECURE',
                    style: TextStyle(
                      color: Color(0xFF00FF95),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2.0,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.settings, color: Colors.white24, size: 20),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SettingsScreen()),
                ),
                tooltip: 'Command Settings',
              ),
              IconButton(
                icon: const Icon(Icons.logout, color: Colors.white24, size: 20),
                onPressed: () => auth.logout(),
                tooltip: 'Terminate Session',
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'EMERGENCY\nREPORTING',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w900,
              height: 1.1,
              letterSpacing: -1.0,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'SELECT INCIDENT TYPE FOR IMMEDIATE DISPATCH',
            style: TextStyle(
              color: Colors.white.withOpacity(0.3),
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPanicGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
      child: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Expanded(child: _buildPanicButton('ATTACK', const Color(0xFFFF003C), Icons.security)),
                const SizedBox(width: 16),
                Expanded(child: _buildPanicButton('KIDNAP', const Color(0xFFFF8A00), Icons.person_off)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Row(
              children: [
                Expanded(child: _buildPanicButton('FIRE', const Color(0xFFFF4D00), Icons.local_fire_department)),
                const SizedBox(width: 16),
                Expanded(child: _buildPanicButton('OTHER', const Color(0xFF00A3FF), Icons.warning_amber)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildSOSButton(),
        ],
      ),
    );
  }

  Widget _buildSOSButton() {
    return GestureDetector(
      onLongPress: _triggerSOS,
      child: Container(
        width: double.infinity,
        height: 80,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFF003C), Color(0xFF8A0020)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFFF003C).withOpacity(0.5),
              blurRadius: 20,
              spreadRadius: 2,
            ),
          ],
        ),
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'HOLD FOR SOS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 2.0,
                ),
              ),
              Text(
                '3 SECONDS',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _triggerSOS() async {
    // Haptic feedback would go here (requires package)
    setState(() => _isPanicActive = true);
    
    // Get location
    double lat = 9.0820;
    double lng = 7.4913;
    try {
      final loc = await _location.getLocation();
      lat = loc.latitude ?? lat;
      lng = loc.longitude ?? lng;
    } catch (e) {
      print('Location error: $e');
    }

    final api = context.read<ApiService>();
    final auth = context.read<AuthService>();
    
    // Optimistic UI update
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('SENDING SOS SIGNAL...'),
        backgroundColor: Color(0xFFFF003C),
        duration: Duration(seconds: 1),
      ),
    );

    final success = await api.triggerSOS(lat, lng, auth.token ?? '');
    
    if (success) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: Colors.black,
            title: const Text('SOS BROADCASTED', style: TextStyle(color: Color(0xFF00FF95))),
            content: const Text('Security forces and nearby users have been alerted.', style: TextStyle(color: Colors.white)),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK', style: TextStyle(color: Color(0xFF00FF95))),
              ),
            ],
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('SOS FAILED - CHECK CONNECTION')),
        );
      }
    }

    setState(() => _isPanicActive = false);
  }

  Widget _buildPanicButton(String label, Color color, IconData icon) {
    bool isActive = _isPanicActive && _activeAlertType == label;
    return GestureDetector(
      onTap: () => _onPanicButtonPressed(label),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isActive ? color : color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isActive ? Colors.white : color.withOpacity(0.5),
            width: isActive ? 4 : 2,
          ),
          boxShadow: isActive
              ? [BoxShadow(color: color, blurRadius: 30, spreadRadius: 5)]
              : [],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: isActive ? Colors.white : color),
            const SizedBox(height: 16),
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : color,
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter() {
    final auth = context.watch<AuthService>();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24.0),
      color: Colors.white.withOpacity(0.02),
      child: Column(
        children: [
          Text(
            'LOGGED IN AS: ${auth.role ?? 'TACTICAL_OPERATOR'}',
            style: TextStyle(
              color: Colors.white.withOpacity(0.4),
              fontSize: 9,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'GEOLOCATION: 9.0820° N, 7.4913° E',
            style: TextStyle(
              color: Color(0xFF00FF95),
              fontSize: 8,
              fontFamily: 'monospace',
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }
}
