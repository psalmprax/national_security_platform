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
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _ninController = TextEditingController();
  final _rankController = TextEditingController();
  final _badgeController = TextEditingController();
  final _domainController = TextEditingController();
  
  String _selectedRole = 'TACTICAL_COMMAND';
  String _selectedState = '40670977-950e-4358-b026-1c3fb8f270b0'; // Default: Akwa Ibom
  String _selectedLGA = '63baaf12-d55c-429b-9529-897e0c28a30f'; // Default: Abak
  String _selectedMonarchGrade = 'UNGRADED';
  String? _selectedAgency;
  
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
      fullName: _nameController.text,
      email: _emailController.text,
      phoneNumber: _phoneController.text,
      password: _passwordController.text,
      role: _selectedRole,
      nin: _ninController.text,
      stateId: _selectedState,
      lgaId: _selectedLGA,
      agencyId: _selectedAgency,
      rank: _rankController.text.isNotEmpty ? _rankController.text : null,
      badgeNumber: _badgeController.text.isNotEmpty ? _badgeController.text : null,
      monarchGrade: _selectedRole == 'TRADITIONAL_RULER' ? _selectedMonarchGrade : null,
      domainTerritory: _selectedRole == 'TRADITIONAL_RULER' ? _domainController.text : null,
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
          controller: _emailController,
          label: 'EMAIL ADDRESS',
          hint: 'dogara@hq.gov.ng',
          icon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 24),
        _buildInputField(
          controller: _phoneController,
          label: 'PHONE NUMBER',
          hint: '+234...',
          icon: Icons.phone_android,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 24),
        _buildInputField(
          controller: _ninController,
          label: 'NIN (IDENTIFICATION)',
          hint: '11223344556',
          icon: Icons.badge_outlined,
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 24),
        _buildLocationPickers(),
        const SizedBox(height: 24),
        _buildRolePicker(),
        if (_selectedRole == 'TACTICAL_COMMAND' || _selectedRole == 'CYBER_ANALYST') ...[
          const SizedBox(height: 24),
          _buildAgencyPicker(),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _buildInputField(
                  controller: _rankController,
                  label: 'OFFICIAL RANK',
                  hint: 'Captain / Sergeant',
                  icon: Icons.military_tech_outlined,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildInputField(
                  controller: _badgeController,
                  label: 'BADGE NUMBER',
                  hint: 'NPF-9921',
                  icon: Icons.verified_user_outlined,
                ),
              ),
            ],
          ),
        ],
        if (_selectedRole == 'TRADITIONAL_RULER') ...[
          const SizedBox(height: 24),
          _buildPicker(
            label: 'MONARCH GRADE',
            value: _selectedMonarchGrade,
            items: [
              {'value': '1ST_CLASS', 'label': '1ST CLASS (EMIR/OBA)'},
              {'value': '2ND_CLASS', 'label': '2ND CLASS'},
              {'value': '3RD_CLASS', 'label': '3RD CLASS'},
              {'value': 'UNGRADED', 'label': 'UNGRADED'},
            ],
            onChanged: (val) => setState(() => _selectedMonarchGrade = val!),
          ),
          const SizedBox(height: 24),
          _buildInputField(
            controller: _domainController,
            label: 'DOMAIN / TERRITORY',
            hint: 'Kano Emirate',
            icon: Icons.map_outlined,
          ),
        ],
        _buildInputField(
          controller: _passwordController,
          label: 'DESIRED PASSWORD',
          hint: '••••••••',
          icon: Icons.lock_outline,
          isPassword: true,
        ),
        if (_error != null) _buildError(),
        const SizedBox(height: 48),
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
    TextInputType keyboardType = TextInputType.text,
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
          keyboardType: keyboardType,
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

  Widget _buildLocationPickers() {
    return Row(
      children: [
        Expanded(
          child: _buildPicker(
            label: 'STATE',
            value: _selectedState,
            items: [
              {'value': '40670977-950e-4358-b026-1c3fb8f270b0', 'label': 'AKWA IBOM'},
              {'value': '3481d9f8-810e-4057-94fe-5a560b528855', 'label': 'ADAMAWA'},
            ],
            onChanged: (val) => setState(() => _selectedState = val!),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildPicker(
            label: 'LGA',
            value: _selectedLGA,
            items: [
              {'value': '63baaf12-d55c-429b-9529-897e0c28a30f', 'label': 'ABAK'},
              {'value': 'e5995e3e-670c-4da0-940f-12a2c5c2da69', 'label': 'EKET'},
            ],
            onChanged: (val) => setState(() => _selectedLGA = val!),
          ),
        ),
      ],
    );
  }

  Widget _buildAgencyPicker() {
    return _buildPicker(
      label: 'ATTACHED AGENCY',
      value: _selectedAgency,
      items: [
        {'value': 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'label': 'POLICE (BORNO)'},
        {'value': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'label': 'ARMY (7TH DIV)'},
        {'value': 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'label': 'DSS HQ'},
      ],
      hint: 'SELECT AGENCY',
      onChanged: (val) => setState(() => _selectedAgency = val),
    );
  }

  Widget _buildPicker({
    required String label,
    required String? value,
    required List<Map<String, String>> items,
    required void Function(String?) onChanged,
    String? hint,
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
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              hint: hint != null ? Text(hint, style: TextStyle(color: Colors.white.withOpacity(0.1), fontSize: 13)) : null,
              isExpanded: true,
              dropdownColor: const Color(0xFF0A0A0A),
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              icon: const Icon(Icons.keyboard_arrow_down, color: Color(0xFF00FF95)),
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item['value'],
                  child: Text(item['label']!),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRolePicker() {
    return _buildPicker(
      label: 'FUNCTIONAL ROLE',
      value: _selectedRole,
      items: _roles,
      onChanged: (val) {
        if (val != null) setState(() => _selectedRole = val);
      },
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
