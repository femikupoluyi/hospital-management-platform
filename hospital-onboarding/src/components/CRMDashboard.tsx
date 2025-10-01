'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  TrendingUp,
  Award,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  User,
  CreditCard,
  Activity,
  Star,
} from 'lucide-react';

interface DashboardMetrics {
  owners: {
    total: number;
    active: number;
    totalRevenue: number;
    pendingPayouts: number;
  };
  patients: {
    total: number;
    newThisMonth: number;
    averageLoyaltyPoints: number;
    topTierCount: number;
  };
  appointments: {
    todayCount: number;
    weekCount: number;
    completionRate: number;
    noShowRate: number;
  };
  communications: {
    campaignsSent: number;
    messagesDelivered: number;
    openRate: number;
    responseRate: number;
  };
}

export default function CRMDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Simulate fetching metrics
      setMetrics({
        owners: {
          total: 1,
          active: 1,
          totalRevenue: 125000,
          pendingPayouts: 25000,
        },
        patients: {
          total: 156,
          newThisMonth: 23,
          averageLoyaltyPoints: 85,
          topTierCount: 12,
        },
        appointments: {
          todayCount: 18,
          weekCount: 92,
          completionRate: 88.5,
          noShowRate: 5.2,
        },
        communications: {
          campaignsSent: 8,
          messagesDelivered: 1250,
          openRate: 68.5,
          responseRate: 12.3,
        },
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'owners', 'patients', 'appointments', 'campaigns', 'loyalty'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Owners</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.owners.active}
                  </p>
                  <p className="text-sm text-gray-500">
                    Total: {metrics.owners.total}
                  </p>
                </div>
                <User className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.patients.total}
                  </p>
                  <p className="text-sm text-green-600">
                    +{metrics.patients.newThisMonth} this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.appointments.todayCount}
                  </p>
                  <p className="text-sm text-gray-500">
                    Week: {metrics.appointments.weekCount}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(metrics.owners.pendingPayouts)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Revenue: {formatCurrency(metrics.owners.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${metrics.appointments.completionRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{metrics.appointments.completionRate}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">No-Show Rate</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${metrics.appointments.noShowRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{metrics.appointments.noShowRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Open Rate</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${metrics.communications.openRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{metrics.communications.openRate}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${metrics.communications.responseRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{metrics.communications.responseRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owners Tab */}
      {activeTab === 'owners' && (
        <OwnerManagement />
      )}

      {/* Patients Tab */}
      {activeTab === 'patients' && (
        <PatientManagement />
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <AppointmentScheduler />
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <CampaignManager />
      )}

      {/* Loyalty Tab */}
      {activeTab === 'loyalty' && (
        <LoyaltyProgram />
      )}
    </div>
  );
}

// Owner Management Component
function OwnerManagement() {
  const [owners, setOwners] = useState<any[]>([]);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await fetch('/api/crm/owners');
      const data = await response.json();
      if (data.success) {
        setOwners(data.data);
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Owner Management</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Generate Payout Report
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hospitals
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending Payouts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satisfaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">HealthCare Partners Ltd</div>
                  <div className="text-sm text-gray-500">admin@healthcarepartners.gh</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">1</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GHS 25,000</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-900">4.5</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                <button className="text-green-600 hover:text-green-900">Process Payout</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Patient Management Component
function PatientManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Patient Management</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Register New Patient
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No patients yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by registering a new patient.</p>
        </div>
      </div>
    </div>
  );
}

// Appointment Scheduler Component
function AppointmentScheduler() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Appointment Scheduler</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Schedule Appointment
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments today</h3>
          <p className="mt-1 text-sm text-gray-500">Schedule appointments for patients.</p>
        </div>
      </div>
    </div>
  );
}

// Campaign Manager Component
function CampaignManager() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Campaign Manager</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Create Campaign
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          <Send className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No active campaigns</h3>
          <p className="mt-1 text-sm text-gray-500">Create targeted campaigns for patients and owners.</p>
        </div>
      </div>
    </div>
  );
}

// Loyalty Program Component
function LoyaltyProgram() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Loyalty Program</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Configure Rewards
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bronze Tier</p>
              <p className="text-2xl font-bold text-gray-900">132</p>
              <p className="text-sm text-gray-500">0-99 points</p>
            </div>
            <Award className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Silver Tier</p>
              <p className="text-2xl font-bold text-gray-900">18</p>
              <p className="text-sm text-gray-500">100-499 points</p>
            </div>
            <Award className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gold Tier</p>
              <p className="text-2xl font-bold text-gray-900">6</p>
              <p className="text-sm text-gray-500">500+ points</p>
            </div>
            <Award className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Active Rewards</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">10% Consultation Discount</p>
              <p className="text-sm text-gray-500">50 points required</p>
            </div>
            <span className="text-sm text-gray-500">12 redeemed</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Free Blood Test</p>
              <p className="text-sm text-gray-500">100 points required</p>
            </div>
            <span className="text-sm text-gray-500">5 redeemed</span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">20% Pharmacy Discount</p>
              <p className="text-sm text-gray-500">75 points required</p>
            </div>
            <span className="text-sm text-gray-500">8 redeemed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
