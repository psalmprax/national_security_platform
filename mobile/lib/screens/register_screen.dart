import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedRole = 'TACTICAL_COMMAND';
  
  bool _isLoading = false;
  bool _isSuccess = false;
  String? _error;

  final List<Map<String, String>> _roles = [
    {'value': 'TACTICAL_COMMAND', 'label': 'TACTICAL COMMANDER'},
    {'value': 'STRATEGIC_PLANNER', 'label': 'STRATEGIC PLANNER'},
    {'value': 'CYBER_ANALYST', 'label': 'CYBER ANALYST'},
    {'value': 'TRADITIONAL_RULER', 'label': 'TRADITIONAL RULER'},
  ];

  void _handleRegister() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final success = await context.read<AuthService>().register(
      _nameController.text,
      _phoneController.text,
      _passwordController.text,
      _selectedRole,
    );

    if (mounted) {
      if (success) {
        setState(() {
          _isLoading = false;
          _isSuccess = true;
        });
      } else {
        setState(() {
          _isLoading = false;
          _error = 'REQUEST FAILED // TRY AGAIN LATER';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF050505),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF00FF95)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              _buildHeader(),
              const SizedBox(height: 40),
              if (_isSuccess) _buildSuccessState() else _buildForm(),
              const SizedBox(height: 40),
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
        const Text(
          'ACCESS\nREQUEST',
          style: TextStyle(
            color: Colors.white,
            fontSize: 40,
            fontWeight: FontWeight.w900,
            height: 1.0,
            letterSpacing: -1.5,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'IDENTITY VERIFICATION REQUIRED FOR COMMAND ACCESS',
          style: TextStyle(
            color: Colors.white.withOpacity(0.3),
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Column(
      children: [
        _buildInputField(
          controller: _nameController,
          label: 'FULL NAME',
          hint: 'Gen. Ibrahim Dogara',
          icon: Icons.person_outline,
        ),
        const SizedBox(height: 24),
        _buildInputField(
          controller: _phoneController,
          label: 'PHONE NUMBER',
          hint: '+234...',
          icon: Icons.phone_android,
        ),
        const SizedBox(height: 24),
        _buildInputField(
          controller: _passwordController,
          label: 'DESIRED PASSWORD',
          hint: '••••••••',
          icon: Icons.lock_outline,
          isPassword: true,
        ),
        const SizedBox(height: 24),
        _buildRolePicker(),
        if (_error != null) _buildError(),
        const SizedBox(height: 40),
        _buildSubmitButton(),
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

  Widget _buildRolePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'FUNCTIONAL ROLE',
          style: TextStyle(
            color: Colors.white.withOpacity(0.4),
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedRole,
              isExpanded: true,
              dropdownColor: const Color(0xFF0A0A0A),
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              icon: const Icon(Icons.keyboard_arrow_down, color: Color(0xFF00FF95)),
              items: _roles.map((role) {
                return DropdownMenuItem<String>(
                  value: role['value'],
                  child: Text(role['label']!),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _selectedRole = val);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildError() {
    return Padding(
      padding: const EdgeInsets.only(top: 16.0),
      child: Text(
        _error!,
        style: const TextStyle(color: Color(0xFFFF003C), fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _handleRegister,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00FF95),
          foregroundColor: Colors.black,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: _isLoading
            ? const CircularProgressIndicator(color: Colors.black)
            : const Text('SUBMIT FOR APPROVAL', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5)),
      ),
    );
  }

  Widget _buildSuccessState() {
    return Center(
      child: Column(
        children: [
          const Icon(Icons.check_circle_outline, color: Color(0xFF00FF95), size: 80),
          const SizedBox(height: 24),
          const Text(
            'REQUEST FILED',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 16),
          Text(
            'YOUR IDENTITY IS BEING VERIFIED.\nACCESS WILL BE GRANTED UPON APPROVAL.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12, height: 1.5),
          ),
          const SizedBox(height: 48),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF00FF95)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('RETURN TO LOGIN', style: TextStyle(color: Color(0xFF00FF95), fontWeight: FontWeight.w900)),
            ),
          ),
        ],
      ),
    );
  }
}
