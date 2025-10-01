'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, UserCheck, UserX, DollarSign } from 'lucide-react';

interface Staff {
  staff_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  department: string;
  designation: string;
  staff_type: string;
  employment_status: string;
  email: string;
  phone: string;
  basic_salary: number;
}

interface Schedule {
  schedule_id: string;
  staff_name: string;
  department: string;
  shift_name: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  status: string;
  check_in_time: string;
  check_out_time: string;
}

export default function HRDashboard() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('staff');
  const hospitalId = '37f6c11b-5ded-4c17-930d-88b1fec06301';

  useEffect(() => {
    fetchStaff();
    fetchTodaySchedules();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/hr/staff?hospital_id=${hospitalId}`);
      const data = await response.json();
      setStaff(data.staff || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedules = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/hr/schedules?hospital_id=${hospitalId}&date=${today}`);
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const checkIn = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/hr/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: scheduleId,
          action: 'check_in'
        })
      });
      if (response.ok) {
        fetchTodaySchedules();
      }
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const checkOut = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/hr/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: scheduleId,
          action: 'check_out'
        })
      });
      if (response.ok) {
        fetchTodaySchedules();
      }
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'on_leave': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      case 'terminated': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStaffTypeColor = (type: string) => {
    switch (type) {
      case 'doctor': return 'bg-blue-500';
      case 'nurse': return 'bg-purple-500';
      case 'technician': return 'bg-orange-500';
      case 'admin': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const staffByType = staff.reduce((acc, s) => {
    acc[s.staff_type] = (acc[s.staff_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeStaff = staff.filter(s => s.employment_status === 'active').length;
  const presentToday = schedules.filter(s => s.status === 'present').length;
  const scheduledToday = schedules.length;
  const totalSalary = staff.reduce((sum, s) => sum + (s.basic_salary || 0), 0);

  if (loading) {
    return <div>Loading HR data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">HR & Staff Management</h2>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <div className="text-xs text-muted-foreground">
              {activeStaff} active, {staff.length - activeStaff} inactive
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {presentToday}/{scheduledToday}
            </div>
            <div className="text-xs text-muted-foreground">
              {scheduledToday > 0 
                ? `${((presentToday / scheduledToday) * 100).toFixed(0)}% attendance`
                : 'No schedules today'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Distribution</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Doctors:</span>
                <span className="font-semibold">{staffByType.doctor || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Nurses:</span>
                <span className="font-semibold">{staffByType.nurse || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Others:</span>
                <span className="font-semibold">
                  {staff.length - (staffByType.doctor || 0) - (staffByType.nurse || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {totalSalary.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {staff.length} employees
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button 
          variant={activeTab === 'staff' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('staff')}
        >
          Staff Directory
        </Button>
        <Button 
          variant={activeTab === 'schedule' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('schedule')}
        >
          Today's Schedule
        </Button>
      </div>

      {/* Staff Directory */}
      {activeTab === 'staff' && (
        <Card>
          <CardHeader>
            <CardTitle>Staff Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Employee ID</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Designation</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Contact</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-right p-2">Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.staff_id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{member.employee_id}</td>
                      <td className="p-2 font-medium">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="p-2">{member.department}</td>
                      <td className="p-2 text-sm">{member.designation}</td>
                      <td className="p-2">
                        <Badge className={getStaffTypeColor(member.staff_type)}>
                          {member.staff_type}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div>{member.email}</div>
                          <div className="text-gray-500">{member.phone}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge className={getStatusColor(member.employment_status)}>
                          {member.employment_status}
                        </Badge>
                      </td>
                      <td className="p-2 text-right font-semibold">
                        GHS {member.basic_salary?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      {activeTab === 'schedule' && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule - {new Date().toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Staff</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Shift</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Check In</th>
                    <th className="text-left p-2">Check Out</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.schedule_id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{schedule.staff_name}</td>
                      <td className="p-2">{schedule.department}</td>
                      <td className="p-2">
                        <Badge variant="outline">{schedule.shift_name}</Badge>
                      </td>
                      <td className="p-2 text-sm">
                        {schedule.start_time} - {schedule.end_time}
                      </td>
                      <td className="p-2">
                        <Badge className={
                          schedule.status === 'present' ? 'bg-green-500' :
                          schedule.status === 'absent' ? 'bg-red-500' :
                          schedule.status === 'late' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }>
                          {schedule.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm">
                        {schedule.check_in_time 
                          ? new Date(schedule.check_in_time).toLocaleTimeString()
                          : '-'
                        }
                      </td>
                      <td className="p-2 text-sm">
                        {schedule.check_out_time
                          ? new Date(schedule.check_out_time).toLocaleTimeString()
                          : '-'
                        }
                      </td>
                      <td className="p-2">
                        {!schedule.check_in_time ? (
                          <Button 
                            size="sm"
                            onClick={() => checkIn(schedule.schedule_id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Check In
                          </Button>
                        ) : !schedule.check_out_time ? (
                          <Button 
                            size="sm"
                            onClick={() => checkOut(schedule.schedule_id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Check Out
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {schedules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No schedules for today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
