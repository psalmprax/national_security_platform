import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/panic_screen.dart';
import 'screens/login_screen.dart';
import 'services/persistence_service.dart';
import 'services/api_service.dart';
import 'services/sync_service.dart';
import 'services/auth_service.dart';
import 'services/biometric_service.dart';
import 'services/settings_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final persistenceService = PersistenceService();
  await persistenceService.init();

  final apiService = ApiService();
  final biometricService = BiometricService();
  final authService = AuthService(apiService, biometricService);
  await authService.checkAuthStatus();

  final settingsService = SettingsService();
  await settingsService.init();

  final syncService = SyncService(persistenceService, apiService, authService);
  syncService.startAutoSync();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthService>.value(value: authService),
        Provider<BiometricService>.value(value: biometricService),
        Provider<PersistenceService>.value(value: persistenceService),
        Provider<ApiService>.value(value: apiService),
        Provider<SyncService>.value(value: syncService),
        ChangeNotifierProvider<SettingsService>.value(value: settingsService),
      ],
      child: const CommunityAlertApp(),
    ),
  );
}

class CommunityAlertApp extends StatelessWidget {
  const CommunityAlertApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'National Security Platform',
      theme: _buildTheme(),
      home: Consumer<AuthService>(
        builder: (context, auth, _) {
          if (!auth.isAuthenticated) {
            return const LoginScreen();
          }
          return const PanicScreen();
        },
      ),
    );
  }

  ThemeData _buildTheme() {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: const Color(0xFF00FF95),
      scaffoldBackgroundColor: const Color(0xFF050505),
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF00FF95),
        background: Color(0xFF050505),
        surface: Color(0xFF0A0A0A),
        error: Color(0xFFFF003C),
      ),
      fontFamily: 'Inter',
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
          letterSpacing: 2.0,
        ),
      ),
    );
  }
}
