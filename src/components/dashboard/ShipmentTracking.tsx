import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Truck, Ship, Plane, MapPin, Clock, AlertCircle, CheckCircle2, Package } from 'lucide-react';
import { aggregateByRegion, aggregateByTransport, getSpecialEvents, formatNumber } from '../../utils/dashboardUtils';
import type { DailyRecord } from '../../types';

interface ShipmentTrackingProps {
  records: DailyRecord[];
}

const TRANSPORT_CONFIG = {
  'Air': { 
    icon: Plane, 
    color: '#3B82F6', 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-600',
    avgDays: 1,
    label: 'Express Air'
  },
  'Truck': { 
    icon: Truck, 
    color: '#10B981', 
    bgColor: 'bg-green-50', 
    textColor: 'text-green-600',
    avgDays: 3,
    label: 'Ground Truck'
  },
  'Ship': { 
    icon: Ship, 
    color: '#F59E0B', 
    bgColor: 'bg-amber-50', 
    textColor: 'text-amber-600',
    avgDays: 7,
    label: 'Ocean Freight'
  }
};

const REGION_COORDS: Record<string, { x: number; y: number; label: string }> = {
  'North': { x: 50, y: 20, label: 'North Region' },
  'South': { x: 50, y: 80, label: 'South Region' },
  'East': { x: 80, y: 50, label: 'East Region' },
  'West': { x: 20, y: 50, label: 'West Region' }
};

export function ShipmentTracking({ records }: ShipmentTrackingProps) {
  const transportData = useMemo(() => aggregateByTransport(records), [records]);
  const regionData = useMemo(() => aggregateByRegion(records), [records]);
  const specialEvents = useMemo(() => getSpecialEvents(records), [records]);

  const totalShipments = records.length;
  
  const transportStats = useMemo(() => {
    const stats: Record<string, { count: number; percentage: number }> = {};
    transportData.forEach(t => {
      stats[t.transport_mode] = {
        count: t.shipments,
        percentage: totalShipments > 0 ? (t.shipments / totalShipments) * 100 : 0
      };
    });
    return stats;
  }, [transportData, totalShipments]);

  // Calculate average delivery metrics
  const avgDeliveryTime = useMemo(() => {
    if (transportData.length === 0) return 0;
    const totalDays = transportData.reduce((sum, t) => {
      const config = TRANSPORT_CONFIG[t.transport_mode as keyof typeof TRANSPORT_CONFIG];
      return sum + (config?.avgDays || 3) * t.shipments;
    }, 0);
    return totalShipments > 0 ? totalDays / totalShipments : 0;
  }, [transportData, totalShipments]);

  const delayedShipments = specialEvents.filter(e => e.type === 'error').length;
  const warningShipments = specialEvents.filter(e => e.type === 'warning').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <MapPin className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Shipment Tracking</h3>
          <p className="text-sm text-gray-500">Transport modes and regional distribution</p>
        </div>
      </div>

      {/* Transport Mode Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['Air', 'Truck', 'Ship'] as const).map(mode => {
          const config = TRANSPORT_CONFIG[mode];
          const Icon = config.icon;
          const stats = transportStats[mode] || { count: 0, percentage: 0 };
          
          return (
            <div 
              key={mode} 
              className={`p-3 rounded-lg border ${config.bgColor} border-opacity-50 hover:shadow-md transition-shadow`}
              style={{ borderColor: config.color }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${config.textColor}`} />
                <span className={`text-xs font-medium ${config.textColor}`}>
                  {config.avgDays} day{config.avgDays > 1 ? 's' : ''}
                </span>
              </div>
              <p className={`text-xl font-bold ${config.textColor}`}>{formatNumber(stats.count)}</p>
              <p className="text-xs text-gray-500">{config.label}</p>
              <div className="mt-2 w-full bg-white rounded-full h-1.5">
                <div 
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${stats.percentage}%`,
                    backgroundColor: config.color
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{stats.percentage.toFixed(1)}% of total</p>
            </div>
          );
        })}
      </div>

      {/* Region Map Visualization */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" />
          Regional Distribution
        </h4>
        <div className="relative h-48 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-100 overflow-hidden">
          {/* Map Background Grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(to right, #6366f1 1px, transparent 1px),
                linear-gradient(to bottom, #6366f1 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Region Nodes */}
          {regionData.map(region => {
            const coords = REGION_COORDS[region.region];
            const maxShipments = Math.max(...regionData.map(r => r.shipments));
            const scale = 0.5 + (region.shipments / maxShipments) * 0.5;
            
            return (
              <div
                key={region.region}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              >
                <div 
                  className="relative flex flex-col items-center cursor-pointer group"
                  style={{ transform: `scale(${scale})` }}
                >
                  {/* Pulse Effect */}
                  <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20" 
                    style={{ width: '48px', height: '48px', margin: '-8px' }} 
                  />
                  
                  {/* Main Node */}
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  
                  {/* Label */}
                  <div className="mt-2 text-center bg-white px-2 py-1 rounded shadow-sm">
                    <p className="text-xs font-semibold text-gray-900">{region.region}</p>
                    <p className="text-xs text-indigo-600">{formatNumber(region.shipments)}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#6366f1" fillOpacity="0.3" />
              </marker>
            </defs>
            {/* Draw connections between regions */}
            {regionData.length > 1 && (
              <>
                <line x1="50%" y1="20%" x2="50%" y2="80%" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" strokeOpacity="0.3" markerEnd="url(#arrowhead)" />
                <line x1="20%" y1="50%" x2="80%" y2="50%" stroke="#6366f1" strokeWidth="2" strokeDasharray="4" strokeOpacity="0.3" markerEnd="url(#arrowhead)" />
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Transport vs Region Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Shipments by Region</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => formatNumber(value as number)} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                formatter={(value) => [formatNumber(value as number), 'Shipments']}
              />
              <Bar dataKey="shipments" radius={[4, 4, 0, 0]}>
                {regionData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][index % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">On Schedule</span>
          </div>
          <p className="text-lg font-bold text-green-800 mt-1">
            {formatNumber(totalShipments - delayedShipments - warningShipments)}
          </p>
          <p className="text-xs text-green-600">Normal operations</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Issues</span>
          </div>
          <p className="text-lg font-bold text-amber-800 mt-1">
            {formatNumber(delayedShipments + warningShipments)}
          </p>
          <p className="text-xs text-amber-600">Requires attention</p>
        </div>
      </div>

      {/* Recent Events */}
      {specialEvents.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            Recent Events
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {specialEvents.slice(0, 5).map((event, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-3 p-2 rounded-lg border ${
                  event.type === 'error' ? 'bg-red-50 border-red-100' :
                  event.type === 'warning' ? 'bg-yellow-50 border-yellow-100' :
                  'bg-blue-50 border-blue-100'
                }`}
              >
                <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                  event.type === 'error' ? 'bg-red-500' :
                  event.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{event.event}</p>
                  <p className="text-xs text-gray-500">{event.product_name} • {event.region} • {event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Metrics */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{avgDeliveryTime.toFixed(1)}d</p>
          <p className="text-xs text-gray-500">Avg Delivery</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-indigo-600">{formatNumber(totalShipments)}</p>
          <p className="text-xs text-gray-500">Total Shipments</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{regionData.length}</p>
          <p className="text-xs text-gray-500">Regions Active</p>
        </div>
      </div>
    </div>
  );
}