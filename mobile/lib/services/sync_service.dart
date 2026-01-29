import 'dart:async';
import 'persistence_service.dart';
import 'api_service.dart';
import 'auth_service.dart';

class SyncService {
  final PersistenceService _persistenceService;
  final ApiService _apiService;
  final AuthService _authService;
  Timer? _syncTimer;
  bool _isSyncing = false;

  SyncService(this._persistenceService, this._apiService, this._authService);

  void startAutoSync() {
    _syncTimer = Timer.periodic(const Duration(seconds: 30), (_) => syncNow());
    syncNow();
  }

  void stopAutoSync() {
    _syncTimer?.cancel();
  }

  Future<void> syncNow() async {
    if (_isSyncing || !_authService.isAuthenticated) return;
    _isSyncing = true;

    try {
      final token = _authService.token;
      if (token == null) {
        _isSyncing = false;
        return;
      }

      final unsynced = await _persistenceService.getUnsyncedAlerts();
      if (unsynced.isEmpty) {
        _isSyncing = false;
        return;
      }

      print('🔄 Syncing ${unsynced.length} alerts to backend...');

      for (final alert in unsynced) {
        final success = await _apiService.submitAlert(alert, token);
        if (success) {
          await _persistenceService.markAsSynced(alert.id);
        }
      }
    } catch (e) {
      print('❌ Sync loop error: $e');
    } finally {
      _isSyncing = false;
    }
  }
}
