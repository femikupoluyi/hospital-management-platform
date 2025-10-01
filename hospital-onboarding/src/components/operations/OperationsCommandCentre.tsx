'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, Activity, Users, DollarSign, AlertTriangle,
  TrendingUp, Package, Bed, Heart, Clock, MapPin, Shield
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Area, AreaChart
} from 'recharts';

interface HospitalMetrics {
  hospital_id: string;
  hospital_name: string;
  city: string;
  status: string;
  occupancy_rate: number;
  patient_inflow: number;
  emergency_cases: number;
  staff_present: number;
  revenue_today: number;
  pending_amount: number;
  critical_alerts: number;
  performance_score: number;
}

interface SystemAlert {
  id: string;
  hospital: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface ProjectUpdate {
  id: string;
  hospital: string;
  project_name: string;
  type: 'expansion' | 'renovation' | 'it_upgrade' | 'equipment';
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  budget: number;
  spent: number;
  deadline: string;
}

export default function OperationsCommandCentre() {
  const [hospitals, setHospitals] = useState<HospitalMetrics[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [projects, setProjects] = useState<ProjectUpdate[]>([]);
  const [selectedView, setSelectedView] = useState<'overview' | 'hospitals' | 'alerts' | 'projects'>('overview');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Simulate real-time data
  useEffect(() => {
    fetchOperationalData();
    const interval = setInterval(fetchOperationalData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchOperationalData = async () => {
    try {
      // Simulate fetching data from multiple hospitals
      const mockHospitals: HospitalMetrics[] = [
        {
          hospital_id: '37f6c11b-5ded-4c17-930d-88b1fec06301',
          hospital_name: 'Accra Medical Center',
          city: 'Accra',
          status: 'operational',
          occupancy_rate: 72,
          patient_inflow: 45,
          emergency_cases: 8,
          staff_present: 87,
          revenue_today: 45250,
          pending_amount: 125000,
          critical_alerts: 2,
          performance_score: 85
        },
        {
          hospital_id: 'h2',
          hospital_name: 'Kumasi General Hospital',
          city: 'Kumasi',
          status: 'operational',
          occupancy_rate: 85,
          patient_inflow: 62,
          emergency_cases: 12,
          staff_present: 92,
          revenue_today: 58900,
          pending_amount: 89000,
          critical_alerts: 1,
          performance_score: 78
        },
        {
          hospital_id: 'h3',
          hospital_name: 'Tamale Regional Medical',
          city: 'Tamale',
          status: 'warning',
          occupancy_rate: 95,
          patient_inflow: 78,
          emergency_cases: 18,
          staff_present: 68,
          revenue_today: 32100,
          pending_amount: 156000,
          critical_alerts: 4,
          performance_score: 65
        },
        {
          hospital_id: 'h4',
          hospital_name: 'Cape Coast Health Center',
          city: 'Cape Coast',
          status: 'operational',
          occupancy_rate: 58,
          patient_inflow: 32,
          emergency_cases: 5,
          staff_present: 95,
          revenue_today: 28500,
          pending_amount: 45000,
          critical_alerts: 0,
          performance_score: 92
        }
      ];

      const mockAlerts: SystemAlert[] = [
        {
          id: 'a1',
          hospital: 'Tamale Regional Medical',
          type: 'critical',
          category: 'Capacity',
          message: 'ICU beds at 95% capacity - immediate attention required',
          timestamp: new Date().toISOString(),
          resolved: false
        },
        {
          id: 'a2',
          hospital: 'Accra Medical Center',
          type: 'warning',
          category: 'Inventory',
          message: 'Blood supply Type O- below critical level',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false
        },
        {
          id: 'a3',
          hospital: 'Tamale Regional Medical',
          type: 'critical',
          category: 'Staffing',
          message: 'Emergency department understaffed - 68% attendance',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          resolved: false
        },
        {
          id: 'a4',
          hospital: 'Kumasi General Hospital',
          type: 'warning',
          category: 'Equipment',
          message: 'MRI machine scheduled maintenance overdue',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          resolved: false
        },
        {
          id: 'a5',
          hospital: 'Accra Medical Center',
          type: 'info',
          category: 'Revenue',
          message: 'Daily revenue target achieved - GHS 45,250',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          resolved: true
        }
      ];

      const mockProjects: ProjectUpdate[] = [
        {
          id: 'p1',
          hospital: 'Accra Medical Center',
          project_name: 'New Pediatric Wing',
          type: 'expansion',
          status: 'in_progress',
          progress: 65,
          budget: 2500000,
          spent: 1625000,
          deadline: '2025-12-31'
        },
        {
          id: 'p2',
          hospital: 'Kumasi General Hospital',
          project_name: 'Digital Records Migration',
          type: 'it_upgrade',
          status: 'in_progress',
          progress: 82,
          budget: 450000,
          spent: 369000,
          deadline: '2025-10-15'
        },
        {
          id: 'p3',
          hospital: 'Tamale Regional Medical',
          project_name: 'Emergency Department Renovation',
          type: 'renovation',
          status: 'planning',
          progress: 15,
          budget: 850000,
          spent: 85000,
          deadline: '2026-03-31'
        },
        {
          id: 'p4',
          hospital: 'Cape Coast Health Center',
          project_name: 'CT Scanner Installation',
          type: 'equipment',
          status: 'completed',
          progress: 100,
          budget: 1200000,
          spent: 1150000,
          deadline: '2025-09-01'
        }
      ];

      setHospitals(mockHospitals);
      setAlerts(mockAlerts.filter(a => !a.resolved));
      setProjects(mockProjects);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching operational data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const totalMetrics = {
    totalPatients: hospitals.reduce((sum, h) => sum + h.patient_inflow, 0),
    totalEmergencies: hospitals.reduce((sum, h) => sum + h.emergency_cases, 0),
    averageOccupancy: hospitals.reduce((sum, h) => sum + h.occupancy_rate, 0) / hospitals.length,
    totalRevenue: hospitals.reduce((sum, h) => sum + h.revenue_today, 0),
    totalAlerts: alerts.length,
    averagePerformance: hospitals.reduce((sum, h) => sum + h.performance_score, 0) / hospitals.length
  };

  const performanceData = hospitals.map(h => ({
    hospital: h.hospital_name.split(' ')[0],
    occupancy: h.occupancy_rate,
    staffing: h.staff_present,
    revenue: (h.revenue_today / 1000).toFixed(1),
    performance: h.performance_score
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading Operations Command Centre...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-400" />
              Operations Command Centre
            </h1>
            <p className="text-gray-400">Real-time monitoring across all facilities</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Last Updated</p>
            <p className="text-lg font-mono">{lastUpdate.toLocaleTimeString()}</p>
            <select 
              className="mt-2 bg-gray-800 text-white px-3 py-1 rounded border border-gray-700"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value="10000">10 seconds</option>
              <option value="30000">30 seconds</option>
              <option value="60000">1 minute</option>
              <option value="300000">5 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={() => setSelectedView('overview')}
          className={selectedView === 'overview' ? 'bg-blue-600' : 'bg-gray-700'}
        >
          Overview
        </Button>
        <Button
          onClick={() => setSelectedView('hospitals')}
          className={selectedView === 'hospitals' ? 'bg-blue-600' : 'bg-gray-700'}
        >
          Hospitals
        </Button>
        <Button
          onClick={() => setSelectedView('alerts')}
          className={`${selectedView === 'alerts' ? 'bg-blue-600' : 'bg-gray-700'} relative`}
        >
          Alerts
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </Button>
        <Button
          onClick={() => setSelectedView('projects')}
          className={selectedView === 'projects' ? 'bg-blue-600' : 'bg-gray-700'}
        >
          Projects
        </Button>
      </div>

      {/* Main Content */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Patients</p>
                    <p className="text-2xl font-bold text-white">{totalMetrics.totalPatients}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Emergency Cases</p>
                    <p className="text-2xl font-bold text-orange-400">{totalMetrics.totalEmergencies}</p>
                  </div>
                  <Heart className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Occupancy</p>
                    <p className="text-2xl font-bold text-white">{totalMetrics.averageOccupancy.toFixed(1)}%</p>
                  </div>
                  <Bed className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Today's Revenue</p>
                    <p className="text-2xl font-bold text-green-400">
                      ₵{(totalMetrics.totalRevenue / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Alerts</p>
                    <p className="text-2xl font-bold text-red-400">{totalMetrics.totalAlerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Performance</p>
                    <p className="text-2xl font-bold text-white">{totalMetrics.averagePerformance.toFixed(0)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart and Hospital Status Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Comparison */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Hospital Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hospital" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="occupancy" fill="#3b82f6" name="Occupancy %" />
                    <Bar dataKey="performance" fill="#10b981" name="Performance Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hospital Status Grid */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Hospital Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {hospitals.map((hospital) => (
                    <div key={hospital.hospital_id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-white">{hospital.hospital_name.split(' ')[0]}</h3>
                          <p className="text-xs text-gray-400">{hospital.city}</p>
                        </div>
                        <Badge className={getStatusColor(hospital.status)}>
                          {hospital.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Occupancy:</span>
                          <span className={hospital.occupancy_rate > 85 ? 'text-orange-400' : 'text-white'}>
                            {hospital.occupancy_rate}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Patients:</span>
                          <span className="text-white">{hospital.patient_inflow}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Alerts:</span>
                          <span className={hospital.critical_alerts > 0 ? 'text-red-400' : 'text-green-400'}>
                            {hospital.critical_alerts}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Critical Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="bg-gray-700 rounded-lg p-3 flex items-start gap-3">
                    <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white">{alert.hospital}</p>
                          <p className="text-sm text-gray-300">{alert.message}</p>
                        </div>
                        <Badge className="ml-2" variant={alert.type === 'critical' ? 'destructive' : 'outline'}>
                          {alert.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === 'hospitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hospitals.map((hospital) => (
            <Card key={hospital.hospital_id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {hospital.hospital_name}
                  </CardTitle>
                  <Badge className={getStatusColor(hospital.status)}>
                    {hospital.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {hospital.city}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Occupancy</p>
                    <p className="text-xl font-bold text-white">{hospital.occupancy_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Patients Today</p>
                    <p className="text-xl font-bold text-white">{hospital.patient_inflow}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Emergency</p>
                    <p className="text-xl font-bold text-orange-400">{hospital.emergency_cases}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Staff Present</p>
                    <p className="text-xl font-bold text-white">{hospital.staff_present}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Revenue</p>
                    <p className="text-xl font-bold text-green-400">₵{(hospital.revenue_today / 1000).toFixed(1)}K</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Performance</p>
                    <p className="text-xl font-bold text-cyan-400">{hospital.performance_score}%</p>
                  </div>
                </div>
                {hospital.critical_alerts > 0 && (
                  <div className="bg-red-900/20 border border-red-800 rounded p-2 mt-3">
                    <p className="text-sm text-red-400">
                      ⚠️ {hospital.critical_alerts} critical alert{hospital.critical_alerts > 1 ? 's' : ''} require attention
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedView === 'alerts' && (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{getAlertIcon(alert.type)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{alert.hospital}</h3>
                        <p className="text-gray-300 mt-1">{alert.message}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="mb-2" variant={alert.type === 'critical' ? 'destructive' : 'outline'}>
                          {alert.category}
                        </Badge>
                        <p className="text-xs text-gray-400">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Investigate
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                        Assign Team
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                        Mark Resolved
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedView === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">{project.project_name}</CardTitle>
                  <Badge className={
                    project.status === 'completed' ? 'bg-green-600' :
                    project.status === 'in_progress' ? 'bg-blue-600' :
                    project.status === 'on_hold' ? 'bg-yellow-600' : 'bg-gray-600'
                  }>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">{project.hospital}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Budget</p>
                      <p className="text-white font-semibold">₵{(project.budget / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Spent</p>
                      <p className="text-white font-semibold">₵{(project.spent / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Deadline</span>
                    <span className={
                      new Date(project.deadline) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                        ? 'text-orange-400' : 'text-white'
                    }>
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
