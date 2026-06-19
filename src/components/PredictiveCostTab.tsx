import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Package, Info } from 'lucide-react';
import type { DailyRecord } from '../types';
import {
  analyzeCostTrends,
  analyzeSupplierCosts,
  analyzeTransportCosts,
  detectCostAnomalies,
  formatPercentage,
  getTrendColor
} from '../utils/forecastingUtils';
import { formatCurrency } from '../utils/dashboardUtils';
import { loadData } from '../utils/dataLoader';

// Recharts imports
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function PredictiveCostTab() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'product' | 'supplier' | 'transport'>('product');
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadData();
        setRecords(data || []);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate cost analysis with error handling
  const costTrends = useMemo(() => {
    try {
      if (records.length === 0) return [];
      return analyzeCostTrends(records);
    } catch (err) {
      console.error('Error analyzing cost trends:', err);
      return [];
    }
  }, [records]);

  const supplierCosts = useMemo(() => {
    try {
      if (records.length === 0) return [];
      return analyzeSupplierCosts(records);
    } catch (err) {
      console.error('Error analyzing supplier costs:', err);
      return [];
    }
  }, [records]);

  const transportCosts = useMemo(() => {
    try {
      if (records.length === 0) return [];
      return analyzeTransportCosts(records);
    } catch (err) {
      console.error('Error analyzing transport costs:', err);
      return [];
    }
  }, [records]);

  const anomalies = useMemo(() => {
    try {
      if (records.length === 0) return [];
      return detectCostAnomalies(records);
    } catch (err) {
      console.error('Error detecting anomalies:', err);
      return [];
    }
  }, [records]);

  // Stats calculations with error handling
  const stats = useMemo(() => {
    try {
      if (costTrends.length === 0) return null;
      
      const totalAvgCost = costTrends.reduce((sum, c) => sum + c.avgCost, 0) / costTrends.length;
      const risingCosts = costTrends.filter(c => c.costTrend > 5).length;
      const volatileCosts = costTrends.filter(c => c.costVolatility > 20).length;
      const totalPredicted = costTrends.reduce((sum, c) => sum + c.predictedNextMonth, 0);
      
      return {
        totalAvgCost,
        risingCosts,
        volatileCosts,
        totalPredicted,
        avgTrend: costTrends.reduce((sum, c) => sum + c.costTrend, 0) / costTrends.length
      };
    } catch (err) {
      console.error('Error calculating stats:', err);
      return null;
    }
  }, [costTrends]);

  // Chart data with error handling
  const productCostData = useMemo(() => {
    try {
      return costTrends.slice(0, 10).map(c => ({
        name: String(c.product_name || 'Unknown').split(' ').slice(0, 2).join(' '),
        current: c.avgCost || 0,
        predicted: c.predictedNextMonth || 0,
        trend: c.costTrend || 0
      }));
    } catch (err) {
      console.error('Error preparing product cost data:', err);
      return [];
    }
  }, [costTrends]);

  const supplierChartData = useMemo(() => {
    try {
      return supplierCosts.map(s => ({
        name: String(s.supplier || 'Unknown'),
        spend: s.totalSpend || 0,
        avgCost: s.avgCost || 0,
        trend: s.costTrend || 0
      }));
    } catch (err) {
      console.error('Error preparing supplier chart data:', err);
      return [];
    }
  }, [supplierCosts]);

  const transportChartData = useMemo(() => {
    try {
      return transportCosts.map(t => ({
        name: String(t.transport_mode || 'Unknown'),
        cost: t.avgCost || 0,
        shipments: t.totalShipments || 0
      }));
    } catch (err) {
      console.error('Error preparing transport chart data:', err);
      return [];
    }
  }, [transportCosts]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-red-900">Error Loading Data</h3>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Data Available</h3>
          <p className="mt-2 text-sm text-gray-500">
            Please generate data in the Database tab to view cost analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* TODO: Online AI integration placeholder */}
      {/* Future enhancement: Integrate with ML models for advanced cost prediction */}
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Predictive Cost Analysis</h2>
        <p className="mt-1 text-sm text-gray-500">
          Cost trend analysis and predictive insights for optimization
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Cost Per Unit</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalAvgCost)}
                </p>
                <p className="text-xs text-gray-500">Across all products</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cost Trend</p>
                <p className={`text-2xl font-semibold ${getTrendColor(stats.avgTrend).color}`}>
                  {formatPercentage(stats.avgTrend)}
                </p>
                <p className="text-xs text-gray-500">Average monthly change</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rising Costs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.risingCosts}
                </p>
                <p className="text-xs text-gray-500">Products with greater than 5% increase</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Package className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Next Month Prediction</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalPredicted)}
                </p>
                <p className="text-xs text-gray-500">Avg cost per unit</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-gray-700">View By:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('product')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'product'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Product
            </button>
            <button
              onClick={() => setViewMode('supplier')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'supplier'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Supplier
            </button>
            <button
              onClick={() => setViewMode('transport')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'transport'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Transport
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Main Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {viewMode === 'product' && 'Cost Trends by Product'}
            {viewMode === 'supplier' && 'Supplier Cost Analysis'}
            {viewMode === 'transport' && 'Transport Mode Costs'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'product' ? (
                <BarChart data={productCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => value !== undefined ? formatCurrency(value as number) : ''} />
                  <Legend />
                  <Bar dataKey="current" name="Current Avg" fill="#3B82F6" />
                  <Bar dataKey="predicted" name="Predicted" fill="#10B981" />
                </BarChart>
              ) : viewMode === 'supplier' ? (
                <BarChart data={supplierChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => value !== undefined ? formatCurrency(value as number) : ''} />
                  <Legend />
                  <Bar dataKey="spend" name="Total Spend" fill="#3B82F6" />
                </BarChart>
              ) : (
                <BarChart data={transportChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => value !== undefined ? formatCurrency(value as number) : ''} />
                  <Legend />
                  <Bar dataKey="cost" name="Avg Cost" fill="#F59E0B" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Distribution by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costTrends.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${String(name || '').split(' ')[0]} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="avgCost"
                >
                  {costTrends.slice(0, 6).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value !== undefined ? formatCurrency(value as number) : ''} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cost Anomalies */}
      {anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="text-lg font-medium text-red-900">Cost Anomalies Detected</h3>
            </div>
            <p className="text-sm text-red-700 mt-1">
              {anomalies.length} unusual cost variations detected (deviation exceeding 1.5σ from mean)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anomalies.slice(0, 5).map((anomaly, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(anomaly.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {anomaly.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {anomaly.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                      {formatCurrency(anomaly.cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatCurrency(anomaly.avgCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                        anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Cost Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Product Cost Analysis</h3>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volatility
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costTrends.map((product) => {
                  const trendStyle = getTrendColor(product.costTrend);
                  return (
                    <tr key={product.product_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {product.product_name}
                        </div>
                        <div className="text-xs text-gray-500">{product.category}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(product.avgCost)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${trendStyle.color}`}>
                          {trendStyle.icon} {formatPercentage(product.costTrend)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={`text-sm ${product.costVolatility > 20 ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.costVolatility.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Analysis */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Supplier Performance</h3>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spend
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplierCosts.map((supplier) => {
                  const trendStyle = getTrendColor(supplier.costTrend);
                  return (
                    <tr key={supplier.supplier} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {supplier.supplier}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(supplier.totalSpend)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(supplier.avgCost)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${trendStyle.color}`}>
                          {trendStyle.icon} {formatPercentage(supplier.costTrend)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Cost Analysis Methodology</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Cost predictions use linear trend analysis on historical unit costs. Volatility is measured
                as coefficient of variation (CV). Anomalies are detected using statistical process control
                (costs deviating more than 1.5 standard deviations from product mean).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
