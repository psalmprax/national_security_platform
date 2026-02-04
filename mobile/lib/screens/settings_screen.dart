import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/settings_service.dart';
import '../services/auth_service.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsService>();
    final auth = context.watch<AuthService>();
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFF050505),
      appBar: AppBar(
        title: const Text(
          'COMMAND SETTINGS',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            letterSpacing: 2.0,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF00FF95)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader(context, 'ACOUSTIC DETECTION (ADS)', Icons.mic_none),
            _buildAcousticSection(context, settings),
            const SizedBox(height: 32),

            _buildSectionHeader(context, 'SOVEREIGN IDENTITY (NIMC)', Icons.badge_outlined),
            _buildIdentitySection(context, auth),
            const SizedBox(height: 32),

            _buildSectionHeader(context, 'ADVANCED DURESS', Icons.security),
            _buildDuressSection(context, settings),
            const SizedBox(height: 32),

            _buildSectionHeader(context, 'AD & PERSONALIZATION', Icons.ads_click),
            _buildAdsSection(context, settings),
            const SizedBox(height: 32),

            _buildSectionHeader(context, 'GENERAL OPTIONS', Icons.settings_outlined),
            _buildGeneralSection(context, settings),
            const SizedBox(height: 48),

            _buildFooter(context),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF00FF95).withOpacity(0.5)),
          const SizedBox(width: 12),
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF00FF95),
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAcousticSection(BuildContext context, SettingsService settings) {
    return Column(
      children: [
        _buildSettingTile(
          context,
          'Passive Threat Monitoring',
          'Detect gunshots and screams automatically.',
          Switch(
            value: settings.acousticDetectionEnabled,
            onChanged: (val) => settings.setAcousticDetection(val),
            activeColor: const Color(0xFF00FF95),
          ),
        ),
        if (settings.acousticDetectionEnabled) ...[
          const SizedBox(height: 16),
          _buildDetailRow(
            context,
            'Detection Sensitivity',
            Slider(
              value: settings.acousticSensitivity,
              onChanged: (val) => settings.setAcousticSensitivity(val),
              activeColor: const Color(0xFF00FF95),
              inactiveColor: Colors.white.withOpacity(0.1),
            ),
          ),
        ],
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF00FF95).withOpacity(0.05),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF00FF95).withOpacity(0.1)),
          ),
          child: const Row(
            children: [
              Icon(Icons.info_outline, size: 14, color: Color(0xFF00FF95)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Privacy: Audio is processed entirely on-device and never transmitted raw.',
                  style: TextStyle(fontSize: 9, color: Colors.white54, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDuressSection(BuildContext context, SettingsService settings) {
    return Column(
      children: [
        _buildSettingTile(
          context,
          'Secret Duress PIN',
          settings.hasDuressPin ? 'PIN ACTIVE' : 'NO PIN CONFIGURED',
          TextButton(
            onPressed: () => _showPinDialog(context, settings),
            child: Text(
              settings.hasDuressPin ? 'REPLACE' : 'CONFIGURE',
              style: const TextStyle(color: Color(0xFF00FF95), fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildIdentitySection(BuildContext context, AuthService auth) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: auth.ninVerified 
              ? const Color(0xFF00FF95).withOpacity(0.05)
              : Colors.redAccent.withOpacity(0.05),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: auth.ninVerified 
                ? const Color(0xFF00FF95).withOpacity(0.1)
                : Colors.redAccent.withOpacity(0.1),
            ),
          ),
          child: Row(
            children: [
              Icon(
                auth.ninVerified ? Icons.verified_user : Icons.gpp_maybe_outlined,
                color: auth.ninVerified ? const Color(0xFF00FF95) : Colors.redAccent,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      auth.ninVerified ? 'IDENTITY VERIFIED' : 'UNVERIFIED IDENTITY',
                      style: TextStyle(
                        color: auth.ninVerified ? const Color(0xFF00FF95) : Colors.redAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      auth.ninVerified 
                        ? 'Your NIMC trust level is elevated. Reports carry higher weight.'
                        : 'Verify your NIN to increase report trust and system permissions.',
                      style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10),
                    ),
                  ],
                ),
              ),
              if (!auth.ninVerified)
                TextButton(
                  onPressed: () => _showVerificationDialog(context, auth),
                  child: const Text(
                    'VERIFY NOW',
                    style: TextStyle(color: Color(0xFF00FF95), fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  void _showVerificationDialog(BuildContext context, AuthService auth) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        bool loading = false;
        return StatefulBuilder(
          builder: (context, setState) {
          return AlertDialog(
            backgroundColor: const Color(0xFF0A0A0A),
            title: const Text('NIMC VERIFICATION', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Enter your 11-digit National Identification Number (NIN). This creates a cryptographically signed link to your device.',
                  style: TextStyle(color: Colors.white30, fontSize: 11),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: controller,
                  keyboardType: TextInputType.number,
                  maxLength: 11,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'NATIONAL ID (NIN)',
                    hintStyle: TextStyle(color: Colors.white12),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white12)),
                    focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF00FF95))),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('CANCEL', style: TextStyle(color: Colors.white24)),
              ),
              ElevatedButton(
                onPressed: loading ? null : () async {
                  if (controller.text.length == 11) {
                    setState(() => loading = true);
                    final success = await auth.verifyNIN(controller.text);
                    if (context.mounted) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(success ? 'IDENTITY VERIFIED SUCCESSFULY' : 'VERIFICATION FAILED // INVALID NIN'),
                          backgroundColor: success ? Colors.green : Colors.red,
                        ),
                      );
                    }
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00FF95), foregroundColor: Colors.black),
                child: loading 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('VERIFY'),
              ),
            ],
          );
          },
        );
      },
    );
  }

  Widget _buildAdsSection(BuildContext context, SettingsService settings) {
    return Column(
      children: [
        _buildSettingTile(
          context,
          'Personalized Alerts',
          'Use usage patterns to prioritize relevant incidents.',
          Switch(
            value: settings.personalizedAlerts,
            onChanged: (val) => settings.setPersonalizedAlerts(val),
            activeColor: const Color(0xFF00FF95),
          ),
        ),
        _buildSettingTile(
          context,
          'Anonymous Usage Data',
          'Help improve national security metrics.',
          Switch(
            value: settings.shareUsageData,
            onChanged: (val) => settings.setShareUsageData(val),
            activeColor: const Color(0xFF00FF95),
          ),
        ),
      ],
    );
  }

  Widget _buildGeneralSection(BuildContext context, SettingsService settings) {
    return Column(
      children: [
        _buildSettingTile(
          context,
          'System Integrity Diagnostic',
          'Run a local check on encryption keys and signatures.',
          IconButton(
            icon: const Icon(Icons.bolt, color: Colors.white24),
            onPressed: () {},
          ),
        ),
        _buildSettingTile(
          context,
          'Clear Application Cache',
          'Release 42.4 MB of temporary data.',
          TextButton(
            onPressed: () => settings.clearCache(),
            child: const Text('CLEAR', style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  Widget _buildSettingTile(BuildContext context, String title, String subtitle, Widget trailing) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 10),
                ),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, Widget control) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11),
        ),
        control,
      ],
    );
  }

  Widget _buildFooter(BuildContext context) {
    return const Center(
      child: Column(
        children: [
          Text(
            'NATIONAL SECURITY PLATFORM // v1.0.0+1',
            style: TextStyle(color: Colors.white12, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 2.0),
          ),
          SizedBox(height: 4),
          Text(
            'SECURE COMMAND LINK ACTIVE',
            style: TextStyle(color: const Color(0x3300FF95), fontSize: 8, fontFamily: 'monospace'),
          ),
        ],
      ),
    );
  }

  void _showPinDialog(BuildContext context, SettingsService settings) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0A0A0A),
        title: const Text('CONFIGURE DURESS PIN', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Entering this PIN instead of your login password will trigger a silent alarm and mark your report as coerced.',
              style: TextStyle(color: Colors.white30, fontSize: 11),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              obscureText: true,
              maxLength: 4,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: '4-DIGIT PIN',
                hintStyle: TextStyle(color: Colors.white12),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white12)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF00FF95))),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL', style: TextStyle(color: Colors.white24)),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.length == 4) {
                settings.setDuressPin(controller.text);
                Navigator.pop(context);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00FF95), foregroundColor: Colors.black),
            child: const Text('SAVE PIN'),
          ),
        ],
      ),
    );
  }
}
