import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Package, AlertTriangle, CheckCircle, Boxes } from 'lucide-react';
import { getInventoryStatus, getStockoutEvents, getInventoryTrend, formatNumber } from '../../utils/dashboardUtils';
import type { DailyRecord } from '../../types';

interface InventoryStatusProps {
  records: DailyRecord[];
}

export function InventoryStatus({ records }: InventoryStatusProps) {
  const inventoryStatus = useMemo(() => getInventoryStatus(records), [records]);
  const stockoutEvents = useMemo(() => getStockoutEvents(records), [records]);
  const inventoryTrend = useMemo(() => {
    const trend = getInventoryTrend(records);
    // Sample for performance
    if (trend.length > 100) {
      const step = Math.ceil(trend.length / 50);
      return trend.filter((_, i) => i % step === 0);
    }
    return trend;
  }, [records]);

  const lowStockItems = inventoryStatus.filter(i => i.inventory < 50);
  const optimalStockItems = inventoryStatus.filter(i => i.inventory >= 50 && i.inventory <= 200);
  const criticalStockItems = inventoryStatus.filter(i => i.inventory === 0);

  const totalInventory = inventoryStatus.reduce((sum, i) => sum + i.inventory, 0);
  const avgInventory = inventoryStatus.length > 0 ? totalInventory / inventoryStatus.length : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-50 rounded-lg">
          <Boxes className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Inventory Status</h3>
          <p className="text-sm text-gray-500">Stock levels, alerts, and trends</p>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`p-3 rounded-lg border ${criticalStockItems.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            {criticalStockItems.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <span className={`text-lg font-bold ${criticalStockItems.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
              {criticalStockItems.length}
            </span>
          </div>
          <p className={`text-xs mt-1 ${criticalStockItems.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {criticalStockItems.length > 0 ? 'Critical Stockouts' : 'No Stockouts'}
          </p>
        </div>

        <div className={`p-3 rounded-lg border ${lowStockItems.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            {lowStockItems.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            <span className={`text-lg font-bold ${lowStockItems.length > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
              {lowStockItems.length}
            </span>
          </div>
          <p className={`text-xs mt-1 ${lowStockItems.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {lowStockItems.length > 0 ? 'Low Stock Items' : 'All Stock OK'}
          </p>
        </div>
      </div>

      {/* Inventory Trend Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Inventory Trend</h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={inventoryTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => formatNumber(value as number)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                formatter={(value) => [formatNumber(value as number), 'Inventory']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Min', position: 'insideBottomRight', fontSize: 10 }} />
              <ReferenceLine y={200} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Optimal', position: 'insideTopRight', fontSize: 10 }} />
              <Line 
                type="monotone" 
                dataKey="inventory" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Current Stock Levels */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Current Stock by Product</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {inventoryStatus.map((item) => {
            return (
              <div 
                key={item.product_id} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Package className={`w-4 h-4 flex-shrink-0 ${
                    item.inventory === 0 ? 'text-red-500' :
                    item.inventory < 50 ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.inventory === 0 ? 'bg-red-500' :
                        item.inventory < 50 ? 'bg-yellow-500' :
                        item.inventory > 200 ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((item.inventory / 300) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-12 text-right ${
                    item.inventory === 0 ? 'text-red-600' :
                    item.inventory < 50 ? 'text-yellow-600' :
                    item.inventory > 200 ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {item.inventory}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stockout Events */}
      {stockoutEvents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Recent Stockout Events
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {stockoutEvents.slice(0, 5).map((event, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg border border-red-100">
                <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.product_name}</p>
                  <p className="text-xs text-gray-500">{event.region} • {event.date}</p>
                </div>
                {event.notes && (
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    {event.notes.includes(',') ? event.notes.split(',')[1]?.trim() : event.notes}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{formatNumber(totalInventory)}</p>
          <p className="text-xs text-gray-500">Total Units</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{formatNumber(avgInventory)}</p>
          <p className="text-xs text-gray-500">Avg per Product</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{optimalStockItems.length}</p>
          <p className="text-xs text-gray-500">Optimal Stock</p>
        </div>
      </div>
    </div>
  );
}