'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, DollarSign, Package, Users, 
  BarChart, Stethoscope, Building
} from 'lucide-react';
import EMRDashboard from './EMRDashboard';
import BillingDashboard from './BillingDashboard';
import InventoryDashboard from './InventoryDashboard';
import HRDashboard from './HRDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function HospitalManagementDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hospital Management System</h1>
                <p className="text-sm text-gray-600">Accra Medical Center</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Time</p>
              <p className="text-lg font-semibold">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="emr" className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              EMR
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="hr" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              HR/Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="emr" className="space-y-4">
            <EMRDashboard />
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <BillingDashboard />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventoryDashboard />
          </TabsContent>

          <TabsContent value="hr" className="space-y-4">
            <HRDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
