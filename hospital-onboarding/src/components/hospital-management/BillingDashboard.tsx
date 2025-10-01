'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DollarSign, FileText, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  patient_name: string;
  patient_number: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: string;
  billing_type: string;
  items?: any[];
}

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    invoice_id: '',
    amount: 0,
    payment_method: 'cash'
  });
  const [metrics, setMetrics] = useState({
    total_revenue: 0,
    collected_revenue: 0,
    pending_revenue: 0,
    total_invoices: 0
  });

  useEffect(() => {
    fetchInvoices();
    fetchMetrics();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices?hospital_id=37f6c11b-5ded-4c17-930d-88b1fec06301');
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    // In a real app, this would be a separate endpoint
    const response = await fetch('/api/billing/invoices?hospital_id=37f6c11b-5ded-4c17-930d-88b1fec06301');
    const data = await response.json();
    const invoices = data.invoices || [];
    
    const total = invoices.reduce((sum: number, inv: Invoice) => sum + (inv.total_amount || 0), 0);
    const paid = invoices.reduce((sum: number, inv: Invoice) => sum + (inv.paid_amount || 0), 0);
    const pending = invoices.reduce((sum: number, inv: Invoice) => sum + (inv.balance_amount || 0), 0);
    
    setMetrics({
      total_revenue: total,
      collected_revenue: paid,
      pending_revenue: pending,
      total_invoices: invoices.length
    });
  };

  const processPayment = async () => {
    try {
      const response = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      const data = await response.json();
      if (data.payment) {
        fetchInvoices();
        fetchMetrics();
        setShowPaymentForm(false);
        setPaymentData({ invoice_id: '', amount: 0, payment_method: 'cash' });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'pending': return 'bg-red-500';
      case 'overdue': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  // Currency formatting is now imported from @/lib/currency

  if (loading) {
    return <div>Loading billing data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Billing & Revenue Management</h2>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_invoices} invoices generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.collected_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_revenue > 0 
                ? `${((metrics.collected_revenue / metrics.total_revenue) * 100).toFixed(1)}% collected`
                : '0% collected'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.pending_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.total_invoices > 0 ? metrics.total_revenue / metrics.total_invoices : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per patient visit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <Card>
          <CardHeader>
            <CardTitle>Process Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <Input
                placeholder="Invoice ID"
                value={paymentData.invoice_id}
                onChange={(e) => setPaymentData({ ...paymentData, invoice_id: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Amount"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
              />
              <select
                className="px-3 py-2 border rounded-md"
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="insurance">Insurance</option>
                <option value="nhis">NHIS</option>
                <option value="hmo">HMO</option>
              </select>
              <Button 
                onClick={processPayment}
                className="col-span-3 bg-green-600 hover:bg-green-700"
              >
                Process Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Recent Invoices
            </CardTitle>
            <Button 
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Invoice #</th>
                  <th className="text-left p-2">Patient</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-right p-2">Paid</th>
                  <th className="text-right p-2">Balance</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{invoice.invoice_number}</td>
                    <td className="p-2">
                      <div>
                        <div>{invoice.patient_name}</div>
                        <div className="text-xs text-gray-500">{invoice.patient_number}</div>
                      </div>
                    </td>
                    <td className="p-2 text-sm">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{invoice.billing_type}</Badge>
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="p-2 text-right text-green-600">
                      {formatCurrency(invoice.paid_amount)}
                    </td>
                    <td className="p-2 text-right text-red-600">
                      {formatCurrency(invoice.balance_amount)}
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(invoice.payment_status)}>
                        {invoice.payment_status}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentData({
                            invoice_id: invoice.invoice_id,
                            amount: invoice.balance_amount,
                            payment_method: 'cash'
                          });
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {invoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No invoices found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
