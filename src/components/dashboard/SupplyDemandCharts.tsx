import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, Package, MapPin, Calendar, Filter } from 'lucide-react';
import { aggregateByDate, aggregateByProduct, aggregateByRegion, formatNumber } from '../../utils/dashboardUtils';
import { PRODUCTS } from '../../data/products';
import type { DailyRecord } from '../../types';

interface SupplyDemandChartsProps {
  records: DailyRecord[];
}

type TimeRange = '7d' | '30d' | '90d' | '365d' | 'all';
type ViewType = 'trend' | 'product' | 'region';

export function SupplyDemandCharts({ records }: SupplyDemandChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [viewType, setViewType] = useState<ViewType>('trend');
  const [selectedProducts, setSelectedProducts] = useState<string[]>(PRODUCTS.map(p => p.product_id));

  // Filter records by time range
  const filteredRecords = useMemo(() => {
    if (timeRange === 'all' || records.length === 0) return records;
    
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const days = parseInt(timeRange);
    const cutoffDate = new Date(sorted[sorted.length - 1]?.date || new Date());
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return records.filter(r => new Date(r.date) >= cutoffDate);
  }, [records, timeRange]);

  // Filter by selected products
  const productFilteredRecords = useMemo(() => {
    return filteredRecords.filter(r => selectedProducts.includes(r.product_id));
  }, [filteredRecords, selectedProducts]);

  const timeSeriesData = useMemo(() => {
    const data = aggregateByDate(productFilteredRecords);
    // Sample data for performance if too many points
    if (data.length > 100) {
      const step = Math.ceil(data.length / 50);
      return data.filter((_, i) => i % step === 0);
    }
    return data;
  }, [productFilteredRecords]);

  const productData = useMemo(() => {
    return aggregateByProduct(productFilteredRecords)
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 10);
  }, [productFilteredRecords]);

  const regionData = useMemo(() => {
    return aggregateByRegion(productFilteredRecords);
  }, [productFilteredRecords]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(p => p !== productId)
        : [...prev, productId]
    );
  };

  const timeRangeButtons: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '365d', label: '1 Year' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Supply & Demand Analysis</h3>
            <p className="text-sm text-gray-500">Track demand patterns and supply performance</p>
          </div>
        </div>

        {/* View Type Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { type: 'trend' as ViewType, icon: Calendar, label: 'Trend' },
            { type: 'product' as ViewType, icon: Package, label: 'By Product' },
            { type: 'region' as ViewType, icon: MapPin, label: 'By Region' },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setViewType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewType === type
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
        </div>
        <div className="flex items-center gap-1">
          {timeRangeButtons.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeRange === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {viewType === 'trend' && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <span className="text-sm font-medium text-gray-700">Products:</span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setSelectedProducts(selectedProducts.length === PRODUCTS.length ? [] : PRODUCTS.map(p => p.product_id))}
                className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                {selectedProducts.length === PRODUCTS.length ? 'None' : 'All'}
              </button>
              {PRODUCTS.map(product => (
                <button
                  key={product.product_id}
                  onClick={() => toggleProduct(product.product_id)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    selectedProducts.includes(product.product_id)
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                  title={product.product_name}
                >
                  {product.product_id}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'trend' ? (
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
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
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatNumber(value as number)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value) => formatNumber(value as number)}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="demand" 
                name="Demand" 
                stroke="#3B82F6" 
                fillOpacity={1} 
                fill="url(#colorDemand)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="production" 
                name="Production (Supply)" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorProduction)" 
                strokeWidth={2}
              />
            </AreaChart>
          ) : viewType === 'product' ? (
            <BarChart data={productData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="product_name" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatNumber(value as number)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value) => formatNumber(value as number)}
              />
              <Legend />
              <Bar dataKey="demand" name="Demand" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="production" name="Production" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <BarChart data={regionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="region" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatNumber(value as number)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                formatter={(value) => formatNumber(value as number)}
              />
              <Legend />
              <Bar dataKey="demand" name="Demand" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="production" name="Production" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(productFilteredRecords.reduce((sum, r) => sum + r.demand_units, 0))}
          </p>
          <p className="text-sm text-gray-500">Total Demand</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(productFilteredRecords.reduce((sum, r) => sum + r.production_units, 0))}
          </p>
          <p className="text-sm text-gray-500">Total Production</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">
            {productFilteredRecords.length > 0 
              ? ((productFilteredRecords.reduce((sum, r) => sum + r.production_units, 0) / 
                  productFilteredRecords.reduce((sum, r) => sum + r.demand_units, 0)) * 100).toFixed(1)
              : 0}%
          </p>
          <p className="text-sm text-gray-500">Fulfillment Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {formatNumber(productFilteredRecords.filter(r => r.demand_units > r.production_units).length)}
          </p>
          <p className="text-sm text-gray-500">Under-supply Days</p>
        </div>
      </div>
    </div>
  );
}