import 'package:flutter/material.dart';
import '../services/agency_service.dart';

/// Agency Selection Screen
/// Allows users to browse agencies and request membership
class AgencySelectionScreen extends StatefulWidget {
  const AgencySelectionScreen({super.key});

  @override
  State<AgencySelectionScreen> createState() => _AgencySelectionScreenState();
}

class _AgencySelectionScreenState extends State<AgencySelectionScreen> {
  final AgencyService _agencyService = AgencyService();
  
  List<Agency> _agencies = [];
  List<Agency> _myAgencies = [];
  List<AgencyMembershipRequest> _pendingRequests = [];
  bool _isLoading = true;
  String? _selectedType;

  final List<String> _agencyTypes = [
    'ALL',
    'POLICE',
    'MILITARY',
    'FIRE',
    'MEDICAL',
    'DISASTER',
    'TRAFFIC',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    await _agencyService.initialize();
    
    final agencies = await _agencyService.getAgencies();
    final myAgencies = await _agencyService.getMyAgencies();
    final pendingRequests = await _agencyService.getPendingRequests();

    setState(() {
      _agencies = agencies;
      _myAgencies = myAgencies;
      _pendingRequests = pendingRequests;
      _isLoading = false;
    });
  }

  List<Agency> get _filteredAgencies {
    if (_selectedType == null || _selectedType == 'ALL') {
      return _agencies;
    }
    return _agencies.where((a) => a.type == _selectedType).toList();
  }

  Future<void> _requestMembership(Agency agency) async {
    // Show role selection dialog
    final selectedRole = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Join ${agency.name}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Select your role:'),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              children: [
                _buildRoleChip('CITIZEN', 'Citizen Reporter'),
                _buildRoleChip('VOLUNTEER', 'Volunteer'),
                _buildRoleChip('FIRST_RESPONDER', 'First Responder'),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
        ],
      ),
    );

    if (selectedRole != null) {
      final success = await _agencyService.requestMembership(
        agency.id,
        selectedRole,
      );

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Membership request sent to ${agency.name}'),
              backgroundColor: Colors.green,
            ),
          );
          _loadData();
        }
      }
    }
  }

  Widget _buildRoleChip(String role, String label) {
    return ActionChip(
      label: Text(label),
      onPressed: () => Navigator.pop(context, role),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Agencies'),
        backgroundColor: Colors.blue.shade800,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: CustomScrollView(
                slivers: [
                  // My Agencies Section
                  if (_myAgencies.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Text(
                          'My Agencies',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _myAgencies.length,
                          itemBuilder: (context, index) {
                            final agency = _myAgencies[index];
                            return _buildAgencyCard(agency, isMember: true);
                          },
                        ),
                      ),
                    ),
                  ],

                  // Pending Requests
                  if (_pendingRequests.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.pending_actions, color: Colors.orange),
                            const SizedBox(width: 8),
                            Text(
                              'Pending Requests (${_pendingRequests.length})',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 80,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _pendingRequests.length,
                          itemBuilder: (context, index) {
                            final request = _pendingRequests[index];
                            final agency = _agencies.firstWhere(
                              (a) => a.id == request.agencyId,
                              orElse: () => Agency(
                                id: '',
                                name: 'Unknown',
                                acronym: '???',
                                type: '',
                                jurisdictionScope: '',
                                alertTypes: [],
                              ),
                            );
                            return _buildPendingRequestCard(agency, request);
                          },
                        ),
                      ),
                    ),
                  ],

                  // Filter
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Browse Agencies',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 12),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: _agencyTypes.map((type) {
                                final isSelected = _selectedType == type;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: FilterChip(
                                    label: Text(
                                      type == 'ALL' ? 'All' : type.replaceAll('_', ' '),
                                    ),
                                    selected: isSelected,
                                    onSelected: (selected) {
                                      setState(() {
                                        _selectedType = selected ? type : null;
                                      });
                                    },
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Agency List
                  SliverPadding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final agency = _filteredAgencies[index];
                          final isMember = _myAgencies.any((a) => a.id == agency.id);
                          final isPending = _pendingRequests.any(
                            (r) => r.agencyId == agency.id,
                          );
                          return _buildAgencyListItem(
                            agency, 
                            isMember: isMember,
                            isPending: isPending,
                          );
                        },
                        childCount: _filteredAgencies.length,
                      ),
                    ),
                  ),

                  // Bottom padding
                  SliverToBoxAdapter(
                    child: SizedBox(height: 32),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildAgencyCard(Agency agency, {bool isMember = false}) {
    return Container(
      width: 160,
      margin: EdgeInsets.only(right: 12),
      child: Card(
        child: InkWell(
          onTap: () => _showAgencyDetails(agency),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  agency.acronym,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: Colors.blue.shade800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  agency.name,
                  style: TextStyle(fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (isMember) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Member',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.green.shade800,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPendingRequestCard(Agency agency, AgencyMembershipRequest request) {
    return Container(
      width: 200,
      margin: EdgeInsets.only(right: 12),
      child: Card(
        color: Colors.orange.shade50,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                children: [
                  Icon(Icons.pending, color: Colors.orange, size: 16),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      agency.acronym,
                      style: TextStyle(fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Request pending...',
                style: TextStyle(fontSize: 12, color: Colors.orange.shade700),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAgencyListItem(
    Agency agency, {
    bool isMember = false,
    bool isPending = false,
  }) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.shade100,
          child: Text(
            agency.acronym.substring(0, 2),
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.blue.shade800,
            ),
          ),
        ),
        title: Text(agency.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${agency.type} • ${agency.jurisdictionScope}'),
            Wrap(
              spacing: 4,
              children: (agency.alertTypes.take(3).map((type) => 
                Chip(
                  label: Text(type.replaceAll('_', ' '), style: TextStyle(fontSize: 10)),
                  padding: EdgeInsets.zero,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                )
              )).toList(),
            ),
          ],
        ),
        trailing: isMember
            ? Icon(Icons.check_circle, color: Colors.green)
            : isPending
                ? Icon(Icons.pending, color: Colors.orange)
                : ElevatedButton(
                    onPressed: () => _requestMembership(agency),
                    child: Text('Join'),
                  ),
        isThreeLine: true,
        onTap: () => _showAgencyDetails(agency),
      ),
    );
  }

  Future<void> _showAgencyDetails(Agency agency) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                agency.name,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                agency.acronym,
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 16),
              _buildDetailRow('Type', agency.type),
              _buildDetailRow('Jurisdiction', agency.jurisdictionScope),
              const SizedBox(height: 16),
              Text(
                'Alert Types Handled',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: agency.alertTypes.map((type) => 
                  Chip(
                    label: Text(type.replaceAll('_', ' ')),
                    backgroundColor: Colors.blue.shade50,
                  ),
                ).toList(),
              ),
              const SizedBox(height: 24),
              if (_myAgencies.any((a) => a.id == agency.id))
                Container(
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green),
                      const SizedBox(width: 8),
                      Text(
                        'You are a member',
                        style: TextStyle(
                          color: Colors.green.shade800,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                )
              else if (_pendingRequests.any((r) => r.agencyId == agency.id))
                Container(
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.pending, color: Colors.orange),
                      const SizedBox(width: 8),
                      Text(
                        'Request pending',
                        style: TextStyle(
                          color: Colors.orange.shade800,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _requestMembership(agency),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade800,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text('Request Membership'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade600,
              ),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
