import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Tabs } from './components/Tabs';
import { DatabaseTab } from './components/DatabaseTab';
import { DashboardTab } from './components/DashboardTab';
import { DemandForecastingTab } from './components/DemandForecastingTab';
import { PredictiveCostTab } from './components/PredictiveCostTab';
import { AIChatPanel } from './components/dashboard/AIChatPanel';
import { loadData } from './utils/dataLoader';
import type { TabType, DailyRecord } from './types';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Application Error</h2>
              <p className="text-gray-600 mb-4">
                {this.state.error?.message || 'An unknown error occurred'}
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [records, setRecords] = useState<DailyRecord[]>([]);

  // Load data for AI chat
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadData();
        setRecords(data || []);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Listen for tab switch events from child components
  useEffect(() => {
    const handleSwitchTab = (event: CustomEvent<TabType>) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('switchTab', handleSwitchTab as EventListener);
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab as EventListener);
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'demand-forecasting':
        return <DemandForecastingTab />;
      case 'predictive-cost':
        return <PredictiveCostTab />;
      case 'database':
        return <DatabaseTab />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <Layout>
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        {renderTabContent()}
        {/* Floating AI Chat - available on all tabs */}
        <AIChatPanel records={records} />
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
