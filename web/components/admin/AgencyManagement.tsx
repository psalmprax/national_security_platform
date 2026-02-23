import React, { useState, useEffect } from 'react';
import {
    fetchAgencies,
    fetchAgency,
    createAgency,
    updateAgency,
    deleteAgency,
    fetchAgencyMembers,
    addAgencyMember,
    removeAgencyMember,
    fetchAgencyAlerts,
    Agency,
    AgencyMember
} from '../../lib/api';

interface AgencyManagementProps {
    onClose?: () => void;
}

export default function AgencyManagement({ onClose }: AgencyManagementProps) {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
    const [members, setMembers] = useState<AgencyMember[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'members' | 'alerts'>('details');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        acronym: '',
        type: 'POLICE',
        jurisdiction_scope: '',
        alert_types: [] as string[]
    });

    const alertTypeOptions = [
        'KIDNAPPING', 'ARMED_ROBBERY', 'ASSAULT', 'TERRORISM',
        'ROAD_ACCIDENT', 'TRAFFIC_VIOLATION', 'FIRE', 'FLOOD',
        'BUILDING_COLLAPSE', 'GAS_LEAK', 'INSURGENCY', 'MEDICAL_EMERGENCY'
    ];

    useEffect(() => {
        loadAgencies();
    }, []);

    useEffect(() => {
        if (selectedAgency) {
            loadAgencyDetails(selectedAgency.id);
        }
    }, [selectedAgency]);

    const loadAgencies = async () => {
        setLoading(true);
        try {
            const data = await fetchAgencies();
            setAgencies(data);
        } catch (err) {
            setError('Failed to load agencies');
        }
        setLoading(false);
    };

    const loadAgencyDetails = async (agencyId: string) => {
        const [membersData, alertsData] = await Promise.all([
            fetchAgencyMembers(agencyId),
            fetchAgencyAlerts(agencyId)
        ]);
        setMembers(membersData);
        setAlerts(alertsData);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAgency(formData);
            setShowCreateForm(false);
            setFormData({ name: '', acronym: '', type: 'POLICE', jurisdiction_scope: '', alert_types: [] });
            loadAgencies();
        } catch (err) {
            setError('Failed to create agency');
        }
    };

    const handleUpdate = async () => {
        if (!selectedAgency) return;
        try {
            await updateAgency(selectedAgency.id, formData);
            loadAgencies();
            const updated = await fetchAgency(selectedAgency.id);
            setSelectedAgency(updated);
        } catch (err) {
            setError('Failed to update agency');
        }
    };

    const handleDelete = async (agencyId: string) => {
        if (!confirm('Are you sure you want to delete this agency?')) return;
        try {
            await deleteAgency(agencyId);
            setSelectedAgency(null);
            loadAgencies();
        } catch (err) {
            setError('Failed to delete agency');
        }
    };

    const toggleAlertType = (type: string) => {
        setFormData(prev => ({
            ...prev,
            alert_types: prev.alert_types.includes(type)
                ? prev.alert_types.filter(t => t !== type)
                : [...prev.alert_types, type]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Agency Management</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add Agency
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Agency List */}
                <div className="md:col-span-1 border-r pr-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Agencies</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {agencies.map(agency => (
                            <div
                                key={agency.id}
                                onClick={() => setSelectedAgency(agency)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedAgency?.id === agency.id
                                        ? 'bg-blue-100 border-blue-300'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                <div className="font-medium">{agency.name}</div>
                                <div className="text-sm text-gray-500">{agency.acronym} • {agency.type}</div>
                            </div>
                        ))}
                        {agencies.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No agencies found</p>
                        )}
                    </div>
                </div>

                {/* Agency Details */}
                <div className="md:col-span-2">
                    {selectedAgency ? (
                        <div>
                            <div className="flex gap-2 mb-4 border-b">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`px-4 py-2 ${activeTab === 'details'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500'
                                        }`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`px-4 py-2 ${activeTab === 'members'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500'
                                        }`}
                                >
                                    Members ({members.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('alerts')}
                                    className={`px-4 py-2 ${activeTab === 'alerts'
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-500'
                                        }`}
                                >
                                    Alerts ({alerts.length})
                                </button>
                            </div>

                            {activeTab === 'details' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={formData.name || selectedAgency.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Acronym</label>
                                        <input
                                            type="text"
                                            value={formData.acronym || selectedAgency.acronym}
                                            onChange={e => setFormData({ ...formData, acronym: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            value={formData.type || selectedAgency.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                        >
                                            <option value="POLICE">Police</option>
                                            <option value="MILITARY">Military</option>
                                            <option value="FIRE">Fire Service</option>
                                            <option value="MEDICAL">Medical</option>
                                            <option value="DISASTER">Disaster Management</option>
                                            <option value="TRAFFIC">Traffic</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                                        <input
                                            type="text"
                                            value={formData.jurisdiction_scope || selectedAgency.jurisdiction_scope}
                                            onChange={e => setFormData({ ...formData, jurisdiction_scope: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Alert Types</label>
                                        <div className="flex flex-wrap gap-2">
                                            {alertTypeOptions.map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => toggleAlertType(type)}
                                                    className={`px-3 py-1 rounded-full text-sm ${(formData.alert_types.length > 0
                                                            ? formData.alert_types
                                                            : selectedAgency.alert_types || []
                                                        ).includes(type)
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-200 text-gray-700'
                                                        }`}
                                                >
                                                    {type.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <button
                                            onClick={handleUpdate}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedAgency.id)}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'members' && (
                                <div>
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="User ID to add..."
                                            className="p-2 border rounded-lg mr-2"
                                            id="newMemberId"
                                        />
                                        <select id="newMemberRole" className="p-2 border rounded-lg mr-2">
                                            <option value="OFFICER">Officer</option>
                                            <option value="COMMANDER">Commander</option>
                                            <option value="ANALYST">Analyst</option>
                                            <option value="DISPATCHER">Dispatcher</option>
                                        </select>
                                        <button
                                            onClick={async () => {
                                                const userId = (document.getElementById('newMemberId') as HTMLInputElement).value;
                                                const role = (document.getElementById('newMemberRole') as HTMLSelectElement).value;
                                                if (userId && selectedAgency) {
                                                    await addAgencyMember(selectedAgency.id, userId, role);
                                                    loadAgencyDetails(selectedAgency.id);
                                                }
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            Add Member
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {members.map(member => (
                                            <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                <div>
                                                    <div className="font-medium">{member.first_name} {member.last_name}</div>
                                                    <div className="text-sm text-gray-500">{member.email}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                                                        {member.role}
                                                    </span>
                                                    <button
                                                        onClick={async () => {
                                                            if (selectedAgency) {
                                                                await removeAgencyMember(selectedAgency.id, member.id);
                                                                loadAgencyDetails(selectedAgency.id);
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {members.length === 0 && (
                                            <p className="text-gray-500 text-center py-4">No members assigned</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'alerts' && (
                                <div className="space-y-2">
                                    {alerts.map(alert => (
                                        <div key={alert.id} className="p-3 bg-gray-50 rounded">
                                            <div className="flex justify-between">
                                                <span className="font-medium">{alert.title}</span>
                                                <span className={`px-2 py-1 text-xs rounded ${alert.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                        alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {alert.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {alert.alert_type} • Severity: {alert.severity_score}
                                            </div>
                                        </div>
                                    ))}
                                    {alerts.length === 0 && (
                                        <p className="text-gray-500 text-center py-4">No alerts assigned to this agency</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            Select an agency to view details
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Create New Agency</h3>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Acronym</label>
                                    <input
                                        type="text"
                                        value={formData.acronym}
                                        onChange={e => setFormData({ ...formData, acronym: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="POLICE">Police</option>
                                        <option value="MILITARY">Military</option>
                                        <option value="FIRE">Fire Service</option>
                                        <option value="MEDICAL">Medical</option>
                                        <option value="DISASTER">Disaster Management</option>
                                        <option value="TRAFFIC">Traffic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                                    <input
                                        type="text"
                                        value={formData.jurisdiction_scope}
                                        onChange={e => setFormData({ ...formData, jurisdiction_scope: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Alert Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {alertTypeOptions.map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => toggleAlertType(type)}
                                                className={`px-3 py-1 rounded-full text-sm ${formData.alert_types.includes(type)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-200 text-gray-700'
                                                    }`}
                                            >
                                                {type.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
