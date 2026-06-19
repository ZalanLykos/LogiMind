import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Calendar, Target, BarChart3, AlertCircle } from 'lucide-react';
import type { DailyRecord } from '../types';
import {
  generateDemandForecast,
  aggregateByProductForForecast,
  formatPercentage,
  getTrendColor
} from '../utils/forecastingUtils';
import { formatNumber } from '../utils/dashboardUtils';
import { loadData } from '../utils/dataLoader';

// Recharts imports
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export function DemandForecastingTab() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastDays, setForecastDays] = useState(30);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadData();
        setRecords(data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate forecasts
  const forecastData = useMemo(() => {
    if (records.length === 0) return null;
    return generateDemandForecast(records, forecastDays);
  }, [records, forecastDays]);

  const productForecasts = useMemo(() => {
    if (records.length === 0) return [];
    return aggregateByProductForForecast(records);
  }, [records]);

  // All products (filtering can be added later)
  const filteredProducts = productForecasts;

  // Chart data combining historical and forecast
  const chartData = useMemo(() => {
    if (!forecastData) return [];
    
    const historical = forecastData.historical.slice(-60).map(h => ({
      date: h.date,
      historical: h.demand,
      forecast: null,
      lower: null,
      upper: null
    }));
    
    const forecast = forecastData.forecast.map(f => ({
      date: f.date,
      historical: null,
      forecast: f.predicted,
      lower: f.lower,
      upper: f.upper
    }));
    
    return [...historical, ...forecast];
  }, [forecastData]);

  // Stats calculations
  const stats = useMemo(() => {
    if (!forecastData || !productForecasts.length) return null;
    
    const totalHistorical = forecastData.historical.reduce((sum, h) => sum + h.demand, 0);
    const totalForecast = forecastData.forecast.reduce((sum, f) => sum + f.predicted, 0);
    const avgDailyForecast = Math.round(totalForecast / forecastDays);
    
    const growingProducts = productForecasts.filter(p => p.growthRate > 5).length;
    const volatileProducts = productForecasts.filter(p => p.volatility > 30).length;
    
    return {
      totalHistorical,
      totalForecast,
      avgDailyForecast,
      growingProducts,
      volatileProducts,
      confidence: forecastData.confidence,
      trendSlope: forecastData.trendSlope
    };
  }, [forecastData, productForecasts, forecastDays]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Data Available</h3>
          <p className="mt-2 text-sm text-gray-500">
            Please generate data in the Database tab to view demand forecasts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* TODO: Online AI integration placeholder */}
      {/* Future enhancement: Integrate with ML models for advanced forecasting */}
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Demand Forecasting</h2>
        <p className="mt-1 text-sm text-gray-500">
          Statistical demand predictions based on historical data and trend analysis
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Predicted Demand</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.totalForecast)}
                </p>
                <p className="text-xs text-gray-500">Next {forecastDays} days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Daily Average</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(stats.avgDailyForecast)}
                </p>
                <p className="text-xs text-gray-500">Units per day</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Target className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confidence</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(stats.confidence)}%
                </p>
                <p className="text-xs text-gray-500">Forecast accuracy</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Trend Direction</p>
                <p className={`text-2xl font-semibold ${getTrendColor(stats.trendSlope).color}`}>
                  {formatPercentage(stats.trendSlope)}
                </p>
                <p className="text-xs text-gray-500">Daily change rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Forecast Period:</label>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Demand Forecast</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number | undefined) => value !== undefined ? formatNumber(value) : '-'}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="historical"
                name="Historical Demand"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorHistorical)"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="Predicted Demand"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#colorForecast)"
                connectNulls={false}
              />
              <ReferenceLine x={forecastData?.historical[forecastData.historical.length - 1]?.date} stroke="#6B7280" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Vertical line indicates forecast start date. Shaded area shows confidence interval.
        </p>
      </div>

      {/* Product Forecast Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Product-Level Forecasts</h3>
          <p className="text-sm text-gray-500 mt-1">
            Growth rates and volatility metrics by product
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Daily Demand
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volatility
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seasonal Strength
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const trendStyle = getTrendColor(product.growthRate);
                return (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.product_name}
                      </div>
                      <div className="text-xs text-gray-500">{product.product_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatNumber(product.avgDemand)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-medium ${trendStyle.color}`}>
                        {trendStyle.icon} {formatPercentage(product.growthRate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm ${product.volatility > 30 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.volatility.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {product.seasonalStrength.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Forecasting Methodology</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Predictions are calculated using linear trend analysis combined with seasonal factors.
                Confidence intervals represent ±1.96 standard deviations. Growth rate indicates the
                daily trend slope relative to average demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
