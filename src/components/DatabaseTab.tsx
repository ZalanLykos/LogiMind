import { useState, useEffect } from 'react';
import { Database, RefreshCw, Play, FileJson, Trash2, HardDrive } from 'lucide-react';
import { DataTable } from './DataTable';
import { generateYearlyData } from '../data/generators';
import { loadData, saveData, clearData } from '../utils/dataLoader';
import type { DailyRecord } from '../types';

export function DatabaseTab() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [dbPath, setDbPath] = useState<string>('');
  const [isElectron, setIsElectron] = useState(false);
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalRevenue: 0,
    totalCost: 0,
    stockoutDays: 0
  });

  // Check if running in Electron and load data
  useEffect(() => {
    const init = async () => {
      if (window.electron) {
        setIsElectron(true);
        const path = await window.electron.getDbPath();
        setDbPath(path);
      } else {
        setIsElectron(false);
      }
      await fetchData();
    };
    init();
  }, []);

  const fetchData = async () => {
    try {
      const data = await loadData();
      if (data && data.length > 0) {
        setRecords(data);
        calculateStats(data);
        setSaveStatus(isElectron ? 'Data loaded from Database.json' : 'Data loaded from server');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: DailyRecord[]) => {
    const totalRevenue = data.reduce((sum, r) => sum + r.total_revenue, 0);
    const totalCost = data.reduce((sum, r) => sum + r.total_cost, 0);
    const stockoutDays = data.filter(r => r.inventory_end_of_day === 0).length;
    
    setStats({
      totalRecords: data.length,
      totalRevenue,
      totalCost,
      stockoutDays
    });
  };

  const saveToFile = async (data: DailyRecord[]) => {
    try {
      const result = await saveData(data);
      if (result.success) {
        setSaveStatus(isElectron ? 'Auto-saved to Database.json' : 'Saved to server');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Failed to save: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving to file:', error);
      setSaveStatus('Failed to auto-save');
    }
  };

  const clearFile = async () => {
    try {
      const result = await clearData();
      if (result.success) {
        setSaveStatus(isElectron ? 'Database.json cleared' : 'Server data cleared');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error clearing file:', error);
    }
  };

  const generateData = () => {
    setIsGenerating(true);
    setSaveStatus('');
    
    setTimeout(async () => {
      const newRecords = generateYearlyData();
      setRecords(newRecords);
      calculateStats(newRecords);
      
      // Auto-save to file
      await saveToFile(newRecords);
      
      setIsGenerating(false);
    }, 100);
  };

  const resetData = async () => {
    if (confirm('Are you sure you want to reset all data? This will also clear Database.json.')) {
      setRecords([]);
      setStats({
        totalRecords: 0,
        totalRevenue: 0,
        totalCost: 0,
        stockoutDays: 0
      });
      await clearFile();
    }
  };

  const handleUpdateRecord = async (index: number, updatedRecord: DailyRecord) => {
    const newRecords = [...records];
    newRecords[index] = updatedRecord;
    setRecords(newRecords);
    calculateStats(newRecords);
    
    // Auto-save after edit
    await saveToFile(newRecords);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
        <p className="mt-4 text-gray-600">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 mb-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Database</h2>
          </div>
          {saveStatus && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <HardDrive className="h-4 w-4 mr-1" />
              {saveStatus}
            </span>
          )}
        </div>
        <p className="text-gray-600">
          Manage logistics data for 10 products over 365 days. 
          {isElectron ? (
            <span className="text-green-600 font-medium"> Data auto-saves to Database.json</span>
          ) : (
            <span className="text-yellow-600"> Run in Electron for auto-save</span>
          )}
        </p>
        {dbPath && (
          <p className="text-xs text-gray-400 mt-1">File: {dbPath}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={generateData}
          disabled={isGenerating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Generate Data
            </>
          )}
        </button>

        <button
          onClick={resetData}
          disabled={records.length === 0 || isGenerating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Reset Data & Clear File
        </button>
      </div>

      {/* Stats Cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileJson className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Records</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalRecords.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalRevenue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Cost</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.totalCost)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Stockout Days</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.stockoutDays.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {records.length > 0 ? (
        <DataTable records={records} onUpdateRecord={handleUpdateRecord} />
      ) : (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by generating data for the year.</p>
          <div className="mt-6">
            <button
              onClick={generateData}
              disabled={isGenerating}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Play className="h-4 w-4 mr-2" />
              Generate Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
