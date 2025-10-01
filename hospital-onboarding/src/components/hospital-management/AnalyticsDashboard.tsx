'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Activity, TrendingUp, Users, DollarSign, 
  Bed, AlertTriangle, Building, Heart
} from 'lucide-react';

interface DashboardData {
  hospital: any;
  metrics: {
    occupancy: any;
    revenue: any;
    staff: any;
  };
  charts: {
    patient_flow: any[];
    department_utilization: any[];
    top_diagnoses: any[];
  };
  alerts: {
    low_stock_items: any[];
    pending_revenue: number;
    staff_on_leave: number;
  };
}

export default function AnalyticsDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(
        `/api/analytics/dashboard?hospital_id=37f6c11b-5ded-4c17-930d-88b1fec06301&date_from=${dateRange.from}&date_to=${dateRange.to}`
      );
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return <div>Loading analytics dashboard...</div>;
  }

  if (!dashboardData) {
    return <div>No dashboard data available</div>;
  }

  const { hospital, metrics, charts, alerts } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-gray-600">{hospital?.name}</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bed Occupancy</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.occupancy.occupancy_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.occupancy.occupied_beds}/{metrics.occupancy.bed_capacity} beds occupied
            </p>
            <div className="mt-2 h-2 bg-gray-200 rounded">
              <div 
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${metrics.occupancy.occupancy_rate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.collected_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.revenue.collection_rate}% collected
            </p>
            <p className="text-xs text-red-600 mt-1">
              {formatCurrency(metrics.revenue.pending_revenue)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Visits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.occupancy.total_encounters}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Emergency: {metrics.occupancy.emergency_visits}</div>
              <div>Outpatient: {metrics.occupancy.outpatient_visits}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.staff.attendance_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.staff.present_today}/{metrics.staff.scheduled_today} present
            </p>
            {metrics.staff.on_leave > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                {metrics.staff.on_leave} on leave
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Flow (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.patient_flow.slice(0, 30).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="emergency" stroke="#ef4444" name="Emergency" />
                <Line type="monotone" dataKey="outpatient" stroke="#3b82f6" name="Outpatient" />
                <Line type="monotone" dataKey="inpatient" stroke="#10b981" name="Inpatient" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Method */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={metrics.revenue.revenue_by_method}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.billing_type}: ${formatCurrency(entry.amount)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {metrics.revenue.revenue_by_method.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Department Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.department_utilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="visits" fill="#8884d8" name="Total Visits" />
                <Bar dataKey="unique_patients" fill="#82ca9d" name="Unique Patients" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Diagnoses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {charts.top_diagnoses.map((diagnosis, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{diagnosis.diagnosis_description}</span>
                  </div>
                  <Badge variant="outline">{diagnosis.count} cases</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(alerts.low_stock_items.length > 0 || alerts.pending_revenue > 0 || alerts.staff_on_leave > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Low Stock Alert */}
              {alerts.low_stock_items.length > 0 && (
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-red-600 mb-2">Low Stock Items</h4>
                  <div className="space-y-1">
                    {alerts.low_stock_items.slice(0, 5).map((item, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.item_name}</span>
                        <span className="font-semibold">{item.current_stock} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Revenue Alert */}
              {alerts.pending_revenue > 0 && (
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-600 mb-2">Pending Revenue</h4>
                  <div className="text-2xl font-bold">{formatCurrency(alerts.pending_revenue)}</div>
                  <p className="text-sm text-gray-600">Requires follow-up</p>
                </div>
              )}

              {/* Staff on Leave Alert */}
              {alerts.staff_on_leave > 0 && (
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-600 mb-2">Staff on Leave</h4>
                  <div className="text-2xl font-bold">{alerts.staff_on_leave}</div>
                  <p className="text-sm text-gray-600">May affect operations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
