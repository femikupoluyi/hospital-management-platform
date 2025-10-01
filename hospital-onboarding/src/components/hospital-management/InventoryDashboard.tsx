'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TrendingDown, ShoppingCart, Pill, Activity } from 'lucide-react';

interface InventoryItem {
  item_id: string;
  item_code: string;
  item_name: string;
  item_type: string;
  category: string;
  unit_of_measure: string;
  total_stock: number;
  available_stock: number;
  reorder_level: number;
  needs_reorder: boolean;
}

interface StockLevel {
  item_name: string;
  hospital_name: string;
  quantity_on_hand: number;
  quantity_available: number;
  batch_number: string;
  expiry_date: string;
  unit_cost: number;
  selling_price: number;
}

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const hospitalId = '37f6c11b-5ded-4c17-930d-88b1fec06301';

  useEffect(() => {
    fetchInventoryItems();
    fetchStockLevels();
  }, [filter]);

  const fetchInventoryItems = async () => {
    try {
      let url = `/api/inventory/items?hospital_id=${hospitalId}`;
      if (filter === 'low_stock') {
        url += '&low_stock=true';
      } else if (filter !== 'all') {
        url += `&type=${filter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockLevels = async () => {
    try {
      const response = await fetch(`/api/inventory/stock?hospital_id=${hospitalId}`);
      const data = await response.json();
      setStockLevels(data.stock_levels || []);
    } catch (error) {
      console.error('Error fetching stock levels:', error);
    }
  };

  const updateStock = async (itemId: string, movementType: string, quantity: number) => {
    try {
      const response = await fetch('/api/inventory/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          hospital_id: hospitalId,
          movement_type: movementType,
          quantity: quantity,
          unit_cost: 0
        })
      });
      const data = await response.json();
      if (data.movement) {
        fetchInventoryItems();
        fetchStockLevels();
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'drug': return <Pill className="h-4 w-4" />;
      case 'consumable': return <Package className="h-4 w-4" />;
      case 'equipment': return <Activity className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.total_stock === 0) {
      return { color: 'bg-red-500', text: 'Out of Stock' };
    } else if (item.needs_reorder) {
      return { color: 'bg-yellow-500', text: 'Low Stock' };
    } else {
      return { color: 'bg-green-500', text: 'In Stock' };
    }
  };

  const lowStockItems = items.filter(item => item.needs_reorder);
  const outOfStockItems = items.filter(item => item.total_stock === 0);

  if (loading) {
    return <div>Loading inventory data...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Inventory Management</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items need reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Urgent attention needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS {stockLevels.reduce((sum, level) => sum + (level.quantity_on_hand * level.unit_cost), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Items
        </Button>
        <Button 
          variant={filter === 'drug' ? 'default' : 'outline'}
          onClick={() => setFilter('drug')}
        >
          <Pill className="mr-2 h-4 w-4" />
          Drugs
        </Button>
        <Button 
          variant={filter === 'consumable' ? 'default' : 'outline'}
          onClick={() => setFilter('consumable')}
        >
          Consumables
        </Button>
        <Button 
          variant={filter === 'equipment' ? 'default' : 'outline'}
          onClick={() => setFilter('equipment')}
        >
          Equipment
        </Button>
        <Button 
          variant={filter === 'low_stock' ? 'default' : 'outline'}
          onClick={() => setFilter('low_stock')}
          className="ml-auto"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Low Stock Only
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Code</th>
                  <th className="text-left p-2">Item Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Stock</th>
                  <th className="text-right p-2">Available</th>
                  <th className="text-right p-2">Reorder Level</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.item_id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{item.item_code}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {getItemTypeIcon(item.item_type)}
                          <span className="font-medium">{item.item_name}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">{item.item_type}</Badge>
                      </td>
                      <td className="p-2 text-sm">{item.category}</td>
                      <td className="p-2 text-right font-semibold">
                        {item.total_stock} {item.unit_of_measure}
                      </td>
                      <td className="p-2 text-right">{item.available_stock}</td>
                      <td className="p-2 text-right">{item.reorder_level}</td>
                      <td className="p-2">
                        <Badge className={status.color}>{status.text}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => updateStock(item.item_id, 'purchase', 100)}
                          >
                            +Stock
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => updateStock(item.item_id, 'sale', 10)}
                          >
                            -Use
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No inventory items found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.item_id} className="flex justify-between items-center p-2 bg-white rounded">
                  <div className="flex items-center gap-2">
                    {getItemTypeIcon(item.item_type)}
                    <span className="font-medium">{item.item_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-semibold">{item.total_stock}</span>
                    <span className="text-gray-500"> / {item.reorder_level} min</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
