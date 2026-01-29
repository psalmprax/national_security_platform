import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/alert_model.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class PersistenceService {
  Database? _db;
  final List<AlertModel> _webAndTestingMockDb = [];

  Future<void> init() async {
    if (kIsWeb) {
      print('Web detected: Using in-memory storage');
      return;
    }

    try {
      final databasesPath = await getDatabasesPath();
      final path = join(databasesPath, 'alerts.db');

      _db = await openDatabase(
        path,
        version: 1,
        onCreate: (Database db, int version) async {
          await db.execute('''
            CREATE TABLE alerts (
              id TEXT PRIMARY KEY,
              user_id TEXT,
              alert_type TEXT,
              latitude REAL,
              longitude REAL,
              content TEXT,
              status TEXT,
              timestamp TEXT,
              is_synced INTEGER
            )
          ''');
        },
      );
    } catch (e) {
      print('Database initialization failed: $e');
      // Fallback to in-memory if disk login fails (e.g. Linux without FFI)
    }
  }

  Future<int> saveAlert(AlertModel alert) async {
    if (_db == null) {
      _webAndTestingMockDb.add(alert);
      return 1;
    }
    return await _db!.insert('alerts', alert.toMap());
  }

  Future<List<AlertModel>> getUnsyncedAlerts() async {
     if (_db == null) {
       return _webAndTestingMockDb.where((a) => !a.isSynced).toList();
     }
    final List<Map<String, dynamic>> maps = await _db!.query(
      'alerts',
      where: 'is_synced = ?',
      whereArgs: [0],
    );

    return List.generate(maps.length, (i) {
      return AlertModel.fromMap(maps[i]);
    });
  }

  Future<void> markAsSynced(String id) async {
    if (_db == null) {
      final index = _webAndTestingMockDb.indexWhere((a) => a.id == id);
      if (index != -1) {
         final old = _webAndTestingMockDb[index];
         _webAndTestingMockDb[index] = AlertModel(
            id: old.id,
            userId: old.userId,
            alertType: old.alertType,
            latitude: old.latitude,
            longitude: old.longitude,
            content: old.content,
            status: old.status,
            timestamp: old.timestamp,
            isSynced: true,
            isDuress: old.isDuress
         );
      }
      return;
    }
    await _db!.update(
      'alerts',
      {'is_synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
