import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// NDPR Compliance Consent Screen
/// This screen is shown before collecting PII data like NIN
class ConsentScreen extends StatefulWidget {
  final VoidCallback onConsentGiven;
  final VoidCallback? onDecline;

  const ConsentScreen({
    super.key,
    required this.onConsentGiven,
    this.onDecline,
  });

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _allowLocation = false;
  bool _allowNIN = false;
  bool _allowBiometric = false;
  bool _allowMarketing = false;
  bool _readTerms = false;

  Future<void> _saveConsent() async {
    final prefs = await SharedPreferences.getInstance();
    
    await prefs.setBool('consent_location', _allowLocation);
    await prefs.setBool('consent_nin', _allowNIN);
    await prefs.setBool('consent_biometric', _allowBiometric);
    await prefs.setBool('consent_marketing', _allowMarketing);
    await prefs.setBool('consent_given', true);
    await prefs.setString('consent_date', DateTime.now().toIso8601String());

    widget.onConsentGiven();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Icon(Icons.shield_outlined, 
                       color: Colors.blue.shade800, 
                       size: 32),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Data Privacy Consent',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade900,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Nigeria Data Protection Regulation (NDPR) Compliant',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),

              // Introduction
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.info_outline, color: Colors.blue.shade700),
                        const SizedBox(width: 8),
                        Text(
                          'Your Data, Your Rights',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade800,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Under NDPR, you have the right to know how your personal data is collected, used, and protected. '
                      'Please review each option carefully before providing your consent.',
                      style: TextStyle(
                        color: Colors.blue.shade900,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Consent Options
              _buildConsentTile(
                title: 'Location Data',
                description: 'Allow us to collect your location to provide emergency response services and safety alerts near you.',
                icon: Icons.location_on_outlined,
                value: _allowLocation,
                onChanged: (v) => setState(() => _allowLocation = v),
                required: false,
              ),
              const Divider(height: 1),

              _buildConsentTile(
                title: 'National Identification Number (NIN)',
                description: 'Verify your identity using NIN to increase your trust score and access classified alerts. '
                             'Your NIN is encrypted and securely stored.',
                icon: Icons.badge_outlined,
                value: _allowNIN,
                onChanged: (v) => setState(() => _allowNIN = v),
                required: false,
                warning: 'Optional - Without NIN, your reports will have lower trust scores.',
              ),
              const Divider(height: 1),

              _buildConsentTile(
                title: 'Biometric Authentication',
                description: 'Use fingerprint or face recognition for secure and quick app access.',
                icon: Icons.fingerprint,
                value: _allowBiometric,
                onChanged: (v) => setState(() => _allowBiometric = v),
                required: false,
              ),
              const Divider(height: 1),

              _buildConsentTile(
                title: 'Marketing Communications',
                description: 'Receive updates about new features, safety tips, and promotional offers.',
                icon: Icons.notifications_outlined,
                value: _allowMarketing,
                onChanged: (v) => setState(() => _allowMarketing = v),
                required: false,
              ),
              const SizedBox(height: 24),

              // Terms acknowledgment
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Checkbox(
                          value: _readTerms,
                          onChanged: (v) => setState(() => _readTerms = v ?? false),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => _showTermsDialog(),
                            child: Text(
                              'I have read and agree to the Terms of Service and Privacy Policy. '
                              'I understand my rights under NDPR.',
                              style: TextStyle(
                                height: 1.5,
                                decoration: TextDecoration.underline,
                                color: Colors.blue.shade700,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Data retention info
              ExpansionTile(
                leading: Icon(Icons.storage_outlined, color: Colors.grey.shade600),
                title: Text('Data Retention Policy'),
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildRetentionItem('Location Data', '24 hours (unless emergency)'),
                        _buildRetentionItem('NIN', 'Until account deletion'),
                        _buildRetentionItem('Alert History', '7 years'),
                        _buildRetentionItem('Activity Logs', '2 years'),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Action buttons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (_readTerms) ? _saveConsent : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue.shade800,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Accept & Continue',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: widget.onDecline,
                  child: Text(
                    'Decline & Exit',
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Footer
              Center(
                child: Text(
                  '© 2024 National Security Platform\nNDPR Registration No: NITDA/DIR/2024/001',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConsentTile({
    required String title,
    required String description,
    required IconData icon,
    required bool value,
    required Function(bool) onChanged,
    bool required = false,
    String? warning,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.green.shade700,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, size: 20, color: Colors.grey.shade700),
                    const SizedBox(width: 8),
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    if (required) ...[
                      const SizedBox(width: 4),
                      Text(
                        '*',
                        style: TextStyle(color: Colors.red.shade700),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
                if (warning != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    warning,
                    style: TextStyle(
                      color: Colors.orange.shade700,
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRetentionItem(String dataType, String retention) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(dataType, style: TextStyle(color: Colors.grey.shade700)),
          Text(retention, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  void _showTermsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Terms & Privacy Policy'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Data Collection',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade800,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'We collect only the minimum data necessary to provide emergency response services. '
                'Your data is protected using industry-standard encryption.',
              ),
              const SizedBox(height: 16),
              Text(
                'Your Rights (NDPR)',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade800,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                '• Right to access your data\n'
                '• Right to rectification\n'
                '• Right to erasure ("right to be forgotten")\n'
                '• Right to data portability\n'
                '• Right to withdraw consent',
              ),
              const SizedBox(height: 16),
              Text(
                'Contact',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade800,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'For data protection inquiries:\n'
                'dpo@nationalsecurity.gov.ng\n'
                'NITDA Hotline: +234 800 123 4567',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

/// Helper function to check if consent has been given
Future<bool> hasGivenConsent() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool('consent_given') ?? false;
}

/// Helper to check specific consent
Future<bool> hasConsent(String type) async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool('consent_$type') ?? false;
}

/// Helper to revoke consent
Future<void> revokeConsent() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool('consent_given', false);
  await prefs.setBool('consent_location', false);
  await prefs.setBool('consent_nin', false);
  await prefs.setBool('consent_biometric', false);
  await prefs.setBool('consent_marketing', false);
}
