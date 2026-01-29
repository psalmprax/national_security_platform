class AlertModel {
  final String id;
  final String userId;
  final String alertType;
  final double latitude;
  final double longitude;
  final String content;
  final String status;
  final String timestamp;
  final bool isSynced;
  final bool isDuress;

  AlertModel({
    required this.id,
    required this.userId,
    required this.alertType,
    required this.latitude,
    required this.longitude,
    required this.content,
    required this.status,
    required this.timestamp,
    this.isSynced = false,
    this.isDuress = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'user_id': userId,
      'alert_type': alertType,
      'latitude': latitude,
      'longitude': longitude,
      'content': content,
      'status': status,
      'timestamp': timestamp,
      'is_synced': isSynced ? 1 : 0,
      'is_duress': isDuress ? 1 : 0,
    };
  }

  factory AlertModel.fromMap(Map<String, dynamic> map) {
    return AlertModel(
      id: map['id'],
      userId: map['user_id'],
      alertType: map['alert_type'],
      latitude: map['latitude'],
      longitude: map['longitude'],
      content: map['content'],
      status: map['status'],
      timestamp: map['timestamp'],
      isSynced: map['is_synced'] == 1,
      isDuress: map['is_duress'] == 1,
    );
  }
}
