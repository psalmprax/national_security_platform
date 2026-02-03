import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/biometric_service.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _isBiometricLoading = false;
  bool _canUseBiometrics = false;
  String? _biometricType;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkBiometricAvailability();
  }

  Future<void> _checkBiometricAvailability() async {
    final authService = context.read<AuthService>();
    final biometricService = context.read<BiometricService>();

    final isBiometricEnabled = await authService.isBiometricEnabled();
    final canAuthenticate = await biometricService.canAuthenticateWithBiometrics();

    if (isBiometricEnabled && canAuthenticate) {
      setState(() {
        _canUseBiometrics = true;
      });
      _biometricType = await biometricService.getBiometricTypeDescription();
      // Auto-prompt biometric on launch
      _handleBiometricLogin();
    }
  }

  Future<void> _handleBiometricLogin() async {
    if (!_canUseBiometrics) return;

    setState(() {
      _isBiometricLoading = true;
      _error = null;
    });

    final authService = context.read<AuthService>();
    final result = await authService.loginWithBiometrics();

    if (mounted) {
      setState(() {
        _isBiometricLoading = false;
      });

      if (result == BiometricAuthResult.success) {
        // Auth state listener in main.dart will handle navigation
      } else if (result == BiometricAuthResult.duress) {
        // Silent duress mode - app continues normally
        // No visible indication to user
      } else if (result == BiometricAuthResult.failure) {
        setState(() {
          _error = 'BIOMETRIC AUTHENTICATION FAILED // USE PASSWORD';
        });
      } else if (result == BiometricAuthResult.cancelled) {
        // User cancelled - show password option
      } else {
        setState(() {
          _error = 'BIOMETRIC NOT AVAILABLE // USE PASSWORD';
        });
      }
    }
  }

  void _handleLogin() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final authService = context.read<AuthService>();
    final success = await authService.login(
      _phoneController.text,
      _passwordController.text,
    );

    if (mounted) {
      if (!success) {
        setState(() {
          _isLoading = false;
          _error = 'INVALID CREDENTIALS // ACCESS DENIED';
        });
      } else {
        // Prompt to enable biometrics if not already enabled
        final isBiometricEnabled = await authService.isBiometricEnabled();
        final biometricService = context.read<BiometricService>();
        final canUseBiometrics = await biometricService.canAuthenticateWithBiometrics();

        if (!isBiometricEnabled && canUseBiometrics && mounted) {
          _showBiometricEnrollmentPrompt();
        }
      }
    }
  }

  void _showBiometricEnrollmentPrompt() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0A0A0A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text(
          'ENABLE BIOMETRIC LOGIN?',
          style: TextStyle(color: Color(0xFF00FF95), fontWeight: FontWeight.bold, fontSize: 14),
        ),
        content: const Text(
          'Enable fingerprint or Face ID for faster and more secure access?',
          style: TextStyle(color: Colors.white70, fontSize: 12),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('NOT NOW'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await context.read<AuthService>().setupBiometricAuth();
              if (mounted && success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('✓ Biometric authentication enabled'),
                    backgroundColor: Color(0xFF00FF95),
                  ),
                );
                setState(() {
                  _canUseBiometrics = true;
                });
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00FF95)),
            child: const Text('ENABLE', style: TextStyle(color: Colors.black)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050505),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              _buildHeader(),
              const SizedBox(height: 48),
              if (_canUseBiometrics) _buildBiometricButton(),
              if (_canUseBiometrics) const SizedBox(height: 24),
              if (_canUseBiometrics) _buildDivider(),
              if (_canUseBiometrics) const SizedBox(height: 24),
              _buildTextFields(),
              if (_error != null) _buildError(),
              const SizedBox(height: 32),
              _buildLoginButton(),
              const Spacer(),
              _buildFooter(),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF00FF95).withOpacity(0.1),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: const Color(0xFF00FF95).withOpacity(0.3)),
          ),
          child: const Text(
            'SECURE GATEWAY v1.0',
            style: TextStyle(
              color: Color(0xFF00FF95),
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0,
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'NATIONAL\nSECURITY\nPLATFORM',
          style: TextStyle(
            color: Colors.white,
            fontSize: 40,
            fontWeight: FontWeight.w900,
            height: 1.0,
            letterSpacing: -1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildTextFields() {
    return Column(
      children: [
        _buildInputField(
          controller: _phoneController,
          label: 'PHONE NUMBER',
          hint: '+2348000000100',
          icon: Icons.phone_android,
        ),
        const SizedBox(height: 24),
        _buildInputField(
          controller: _passwordController,
          label: 'ACCESS PASSWORD',
          hint: '••••••••',
          icon: Icons.lock_outline,
          isPassword: true,
        ),
      ],
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.4),
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: const Color(0xFF00FF95), size: 20),
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.1)),
            filled: true,
            fillColor: Colors.white.withOpacity(0.03),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF00FF95), width: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.only(top: 16.0),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFFF003C), size: 14),
          const SizedBox(width: 8),
          Text(
            _error!,
            style: const TextStyle(
              color: Color(0xFFFF003C),
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00FF95),
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2),
              )
            : const Text(
                'INITIALIZE SESSION',
                style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5),
              ),
      ),
    );
  }

  Widget _buildBiometricButton() {
    return Container(
      width: double.infinity,
      height: 72,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF00FF95).withOpacity(0.1),
            const Color(0xFF00FF95).withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF00FF95).withOpacity(0.3)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isBiometricLoading ? null : _handleBiometricLogin,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF00FF95).withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: _isBiometricLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: Center(
                            child: CircularProgressIndicator(
                              color: Color(0xFF00FF95),
                              strokeWidth: 2,
                            ),
                          ),
                        )
                      : const Icon(
                          Icons.fingerprint,
                          color: Color(0xFF00FF95),
                          size: 24,
                        ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'QUICK ACCESS',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.4),
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Use ${_biometricType ?? 'Biometrics'}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward,
                  color: Color(0xFF00FF95),
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Divider(color: Colors.white.withOpacity(0.1))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'OR USE PASSWORD',
            style: TextStyle(
              color: Colors.white.withOpacity(0.3),
              fontSize: 9,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Expanded(child: Divider(color: Colors.white.withOpacity(0.1))),
      ],
    );
  }

  Widget _buildFooter() {
    return Center(
      child: TextButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (c) => const RegisterScreen()));
        },
        child: RichText(
          text: TextSpan(
            text: 'NO AUTHORIZATION? ',
            style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 10, fontWeight: FontWeight.bold),
            children: const [
              TextSpan(
                text: 'REQUEST ACCESS',
                style: TextStyle(color: Color(0xFF00FF95)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
