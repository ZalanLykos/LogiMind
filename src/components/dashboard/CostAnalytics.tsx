import { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { DollarSign, PieChart as PieChartIcon, BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import { aggregateByCategory, aggregateBySupplier, formatCurrency } from '../../utils/dashboardUtils';
import type { DailyRecord } from '../../types';

interface CostAnalyticsProps {
  records: DailyRecord[];
}

type CostViewType = 'category' | 'supplier' | 'trend';

const COLORS = {
  'high-demand': '#3B82F6',
  'laptop': '#10B981',
  'accessory': '#F59E0B',
  'unknown': '#6B7280'
};

const SUPPLIER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];

export function CostAnalytics({ records }: CostAnalyticsProps) {
  const [viewType, setViewType] = useState<CostViewType>('category');

  const categoryData = useMemo(() => {
    const data = aggregateByCategory(records);
    return data.map(d => ({
      ...d,
      profit: d.revenue - d.cost,
      margin: d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0
    }));
  }, [records]);

  const supplierData = useMemo(() => {
    return aggregateBySupplier(records).sort((a, b) => b.cost - a.cost);
  }, [records]);

  const costTrendData = useMemo(() => {
    const grouped = new Map<string, { date: string; cost: number; revenue: number }>();
    
    records.forEach(record => {
      const existing = grouped.get(record.date);
      if (existing) {
        existing.cost += record.total_cost;
        existing.revenue += record.total_revenue;
      } else {
        grouped.set(record.date, {
          date: record.date,
          cost: record.total_cost,
          revenue: record.total_revenue
        });
      }
    });

    const sorted = Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
    // Sample for performance
    if (sorted.length > 100) {
      const step = Math.ceil(sorted.length / 50);
      return sorted.filter((_, i) => i % step === 0);
    }
    return sorted;
  }, [records]);

  const totalCost = records.reduce((sum, r) => sum + r.total_cost, 0);
  const totalRevenue = records.reduce((sum, r) => sum + r.total_revenue, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgCostPerUnit = records.length > 0 
    ? totalCost / records.reduce((sum, r) => sum + r.production_units, 0)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cost Analytics</h3>
            <p className="text-sm text-gray-500">Breakdown by category, supplier, and trends</p>
          </div>
        </div>

        {/* View Type Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { type: 'category' as CostViewType, icon: PieChartIcon, label: 'By Category' },
            { type: 'supplier' as CostViewType, icon: BarChart3, label: 'By Supplier' },
            { type: 'trend' as CostViewType, icon: TrendingUp, label: 'Trends' },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewType === type
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cost Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm font-medium text-red-600">Total Cost</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm font-medium text-green-600">Total Revenue</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className={`rounded-lg p-4 ${totalProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <p className={`text-sm font-medium ${totalProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net Profit</p>
          <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(totalProfit)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">Avg Cost/Unit</p>
          <p className="text-xl font-bold text-gray-700">{formatCurrency(avgCostPerUnit)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'category' ? (
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="cost"
                nameKey="category"
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.category as keyof typeof COLORS] || COLORS.unknown}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value) => formatCurrency(value as number)}
              />
              <Legend />
            </PieChart>
          ) : viewType === 'supplier' ? (
            <BarChart data={supplierData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="supplier" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value) => formatCurrency(value as number)}
              />
              <Bar dataKey="cost" name="Total Cost" radius={[4, 4, 0, 0]}>
                {supplierData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={SUPPLIER_COLORS[index % SUPPLIER_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={costTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value) => formatCurrency(value as number)}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="cost" 
                name="Cost" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown Table */}
      {viewType === 'category' && (
        <div className="mt-6 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.map((item) => (
                <tr key={item.category} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[item.category as keyof typeof COLORS] || COLORS.unknown }}
                      />
                      <span className="text-sm font-medium text-gray-900 capitalize">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-red-600">
                    {formatCurrency(item.cost)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-green-600">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <span className={item.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                      {formatCurrency(item.profit)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.margin >= 20 ? 'bg-green-100 text-green-800' :
                      item.margin >= 10 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.margin >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {item.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}