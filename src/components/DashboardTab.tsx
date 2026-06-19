import { useState, useEffect } from 'react';
import { LayoutDashboard, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { KPIStats } from './dashboard/KPIStats';
import { SupplyDemandCharts } from './dashboard/SupplyDemandCharts';
import { CostAnalytics } from './dashboard/CostAnalytics';
import { InventoryStatus } from './dashboard/InventoryStatus';
import { ShipmentTracking } from './dashboard/ShipmentTracking';
import { loadData } from '../utils/dataLoader';
import type { DailyRecord } from '../types';

export function DashboardTab() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await loadData();
        setRecords(data || []);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data from Database.json');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await loadData();
      setRecords(data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Empty state
  if (!isLoading && records.length === 0) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="mx-auto h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Database className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            The dashboard requires logistics data to display analytics. Please generate data in the Database tab first.
          </p>
          <a 
            href="#database"
            onClick={(e) => {
              e.preventDefault();
              // This will be handled by the parent component's tab switching
              window.dispatchEvent(new CustomEvent('switchTab', { detail: 'database' }));
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Database Tab
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-sm text-gray-500">
              Real-time logistics intelligence and analytics
              {lastUpdated && (
                <span className="ml-2 text-gray-400">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="inline-flex items-center text-sm text-gray-500">
              <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
              Refreshing...
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats - Full Width */}
      <div className="mb-6">
        <KPIStats records={records} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Supply & Demand - Takes up 2 columns on large screens */}
        <div className="xl:col-span-2">
          <SupplyDemandCharts records={records} />
        </div>

        {/* Inventory Status - Takes up 1 column */}
        <div>
          <InventoryStatus records={records} />
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Analytics */}
        <div>
          <CostAnalytics records={records} />
        </div>

        {/* Shipment Tracking */}
        <div>
          <ShipmentTracking records={records} />
        </div>
      </div>

      {/* Data Summary Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-6">
            <span>
              <strong className="text-gray-700">{records.length.toLocaleString()}</strong> records analyzed
            </span>
            <span>
              <strong className="text-gray-700">{new Set(records.map(r => r.product_id)).size}</strong> products
            </span>
            <span>
              <strong className="text-gray-700">{new Set(records.map(r => r.date)).size}</strong> days
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Live Data
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}