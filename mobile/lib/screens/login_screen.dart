import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
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
  String? _error;

  void _handleLogin() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final success = await context.read<AuthService>().login(
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
        // Auth state listener in main.dart will handle navigation
      }
    }
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
