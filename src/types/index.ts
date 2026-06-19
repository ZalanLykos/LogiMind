export interface Product {
  product_id: string;
  product_name: string;
  base_cost: number;
  base_price: number;
  category: 'high-demand' | 'accessory' | 'laptop';
  demand_min: number;
  demand_max: number;
  supplier: string;
}

export interface DailyRecord {
  date: string;
  product_id: string;
  product_name: string;
  demand_units: number;
  production_units: number;
  cost_per_unit: number;
  total_cost: number;
  sales_price_per_unit: number;
  total_revenue: number;
  inventory_end_of_day: number;
  supplier_id: string;
  transport_mode: 'Truck' | 'Ship' | 'Air';
  region: 'North' | 'South' | 'East' | 'West';
  notes: string;
}

export type TabType = 'dashboard' | 'demand-forecasting' | 'predictive-cost' | 'database';

// Electron API interface
declare global {
  interface Window {
    electron?: {
      saveData: (data: DailyRecord[]) => Promise<{ success: boolean; message?: string; error?: string }>;
      loadData: () => Promise<DailyRecord[]>;
      clearData: () => Promise<{ success: boolean; message?: string; error?: string }>;
      getDbPath: () => Promise<string>;
      platform: string;
    };
  }
}
