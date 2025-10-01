'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Building2, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';

// Dynamically import CRM Dashboard to avoid SSR issues
const CRMDashboard = dynamic(() => import('@/components/CRMDashboard'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading CRM...</div>
});

// Dynamically import Hospital Management Dashboard
const HospitalManagementDashboard = dynamic(() => import('@/components/hospital-management/HospitalManagementDashboard'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading Hospital Management...</div>
});

// Dynamically import Operations Command Centre
const OperationsCommandCentre = dynamic(() => import('@/components/operations/OperationsCommandCentre'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading Operations Command Centre...</div>
});

// Dynamically import System Settings
const SystemSettings = dynamic(() => import('@/components/settings/SystemSettings'), {
  ssr: false,
  loading: () => <div className="flex justify-center p-8">Loading Settings...</div>
});

interface DashboardData {
  metrics: {
    totalApplications: number;
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    completedApplications: number;
    averageProcessingDays: number;
    pendingDocuments: number;
    pendingContracts: number;
    completionRate: number;
    rejectionRate: number;
  };
  charts: {
    applicationsByStatus: { status: string; count: number }[];
    applicationsByMonth: { month: string; count: number }[];
    applicationsByPriority: { priority: string; count: number }[];
    topCities: { city: string; count: number }[];
    hospitalTypes: { type: string; count: number }[];
  };
  recentApplications: any[];
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      documents_pending: 'bg-orange-100 text-orange-800',
      scoring: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      contract_pending: 'bg-indigo-100 text-indigo-800',
      contract_signed: 'bg-teal-100 text-teal-800',
      completed: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500',
    };
    return colors[priority] || 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">GrandPro HMSO</h1>
                <p className="text-xs text-gray-500">Hospital Onboarding Portal</p>
              </div>
            </div>
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'applications'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Applications
              </button>
              <button
                onClick={() => setActiveTab('crm')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'crm'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                CRM
              </button>
              <button
                onClick={() => setActiveTab('hospital')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'hospital'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Hospital Ops
              </button>
              <button
                onClick={() => setActiveTab('occ')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'occ'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Command Centre
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'settings'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('apply')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'apply'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                New Application
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && dashboardData && (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Applications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.metrics.totalApplications}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {dashboardData.metrics.pendingApplications}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {dashboardData.metrics.approvedApplications}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Processing</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.metrics.averageProcessingDays.toFixed(1)} days
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Status Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status</h3>
                <div className="space-y-3">
                  {dashboardData.charts.applicationsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {item.status.replace('_', ' ')}
                      </span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(item.count / dashboardData.metrics.totalApplications) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hospital Types */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Hospital Types</h3>
                <div className="space-y-3">
                  {dashboardData.charts.hospitalTypes.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {item.type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${(item.count / dashboardData.metrics.totalApplications) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Applications Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Applications</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Application
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hospital
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.recentApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {app.application_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{app.hospital_name}</div>
                          <div className="text-sm text-gray-500">{app.hospital_city}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {app.owner_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              app.status
                            )}`}
                          >
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getPriorityColor(app.priority)}`}>
                            {app.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.submission_date
                            ? new Date(app.submission_date).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'applications' && (
          <ApplicationsList />
        )}

        {activeTab === 'crm' && (
          <CRMDashboard />
        )}

        {activeTab === 'hospital' && (
          <HospitalManagementDashboard />
        )}

        {activeTab === 'occ' && (
          <OperationsCommandCentre />
        )}

        {activeTab === 'settings' && (
          <SystemSettings />
        )}

        {activeTab === 'apply' && (
          <ApplicationForm onSuccess={() => {
            setActiveTab('applications');
            fetchDashboardData();
          }} />
        )}
      </main>
    </div>
  );
}

// Applications List Component
function ApplicationsList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading applications...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">All Applications</h3>
      </div>
      <div className="p-6">
        {applications.length === 0 ? (
          <p className="text-gray-500">No applications found.</p>
        ) : (
          <div>Applications list will be displayed here</div>
        )}
      </div>
    </div>
  );
}

// Application Form Component  
function ApplicationForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    owner: {
      owner_type: 'individual',
      name: '',
      email: '',
      phone: '',
      company_name: '',
      registration_number: '',
      tax_id: '',
      address: '',
      city: '',
      state: '',
      country: 'Ghana',
      postal_code: '',
    },
    hospital: {
      name: '',
      type: 'general',
      address: '',
      city: '',
      state: '',
      country: 'Ghana',
      phone: '',
      email: '',
      website: '',
      bed_capacity: 0,
      staff_count: 0,
      license_number: '',
      license_expiry: '',
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert('Application submitted successfully!');
        onSuccess();
      } else {
        alert('Error submitting application: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">New Hospital Application</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Owner Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner Type</label>
              <select
                value={formData.owner.owner_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    owner: { ...formData.owner, owner_type: e.target.value as any },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="government">Government</option>
                <option value="ngo">NGO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={formData.owner.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    owner: { ...formData.owner, name: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.owner.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    owner: { ...formData.owner, email: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                required
                value={formData.owner.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    owner: { ...formData.owner, phone: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address *</label>
              <input
                type="text"
                required
                value={formData.owner.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    owner: { ...formData.owner, address: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                required
                value={formData.owner.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    owner: { ...formData.owner, city: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State *</label>
              <input
                type="text"
                required
                value={formData.owner.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    owner: { ...formData.owner, state: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Hospital Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hospital Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Hospital Name *</label>
              <input
                type="text"
                required
                value={formData.hospital.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, name: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select
                value={formData.hospital.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, type: e.target.value as any },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="general">General Hospital</option>
                <option value="specialized">Specialized Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="diagnostic_center">Diagnostic Center</option>
                <option value="maternity">Maternity Hospital</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Number *</label>
              <input
                type="text"
                required
                value={formData.hospital.license_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, license_number: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">License Expiry</label>
              <input
                type="date"
                value={formData.hospital.license_expiry}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, license_expiry: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bed Capacity</label>
              <input
                type="number"
                value={formData.hospital.bed_capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, bed_capacity: parseInt(e.target.value) || 0 },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Staff Count</label>
              <input
                type="number"
                value={formData.hospital.staff_count}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, staff_count: parseInt(e.target.value) || 0 },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Hospital Address *</label>
              <input
                type="text"
                required
                value={formData.hospital.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, address: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input
                type="text"
                required
                value={formData.hospital.city}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, city: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">State *</label>
              <input
                type="text"
                required
                value={formData.hospital.state}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, state: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                required
                value={formData.hospital.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, phone: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input
                type="email"
                required
                value={formData.hospital.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hospital: { ...formData.hospital, email: e.target.value },
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
