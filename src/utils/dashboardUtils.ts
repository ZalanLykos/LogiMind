import type { DailyRecord } from '../types';
import { PRODUCTS } from '../data/products';

// Aggregate data by date
export function aggregateByDate(records: DailyRecord[]) {
  const grouped = new Map<string, {
    date: string;
    demand: number;
    production: number;
    revenue: number;
    cost: number;
    inventory: number;
  }>();

  records.forEach(record => {
    const existing = grouped.get(record.date);
    if (existing) {
      existing.demand += record.demand_units;
      existing.production += record.production_units;
      existing.revenue += record.total_revenue;
      existing.cost += record.total_cost;
      existing.inventory += record.inventory_end_of_day;
    } else {
      grouped.set(record.date, {
        date: record.date,
        demand: record.demand_units,
        production: record.production_units,
        revenue: record.total_revenue,
        cost: record.total_cost,
        inventory: record.inventory_end_of_day
      });
    }
  });

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Aggregate data by product
export function aggregateByProduct(records: DailyRecord[]) {
  const grouped = new Map<string, {
    product_id: string;
    product_name: string;
    demand: number;
    production: number;
    revenue: number;
    cost: number;
    category: string;
  }>();

  records.forEach(record => {
    const existing = grouped.get(record.product_id);
    if (existing) {
      existing.demand += record.demand_units;
      existing.production += record.production_units;
      existing.revenue += record.total_revenue;
      existing.cost += record.total_cost;
    } else {
      const product = PRODUCTS.find(p => p.product_id === record.product_id);
      grouped.set(record.product_id, {
        product_id: record.product_id,
        product_name: record.product_name,
        demand: record.demand_units,
        production: record.production_units,
        revenue: record.total_revenue,
        cost: record.total_cost,
        category: product?.category || 'unknown'
      });
    }
  });

  return Array.from(grouped.values());
}

// Aggregate data by category
export function aggregateByCategory(records: DailyRecord[]) {
  const grouped = new Map<string, {
    category: string;
    cost: number;
    revenue: number;
    count: number;
  }>();

  records.forEach(record => {
    const product = PRODUCTS.find(p => p.product_id === record.product_id);
    const category = product?.category || 'unknown';
    const existing = grouped.get(category);
    if (existing) {
      existing.cost += record.total_cost;
      existing.revenue += record.total_revenue;
      existing.count += 1;
    } else {
      grouped.set(category, {
        category,
        cost: record.total_cost,
        revenue: record.total_revenue,
        count: 1
      });
    }
  });

  return Array.from(grouped.values());
}

// Aggregate data by region
export function aggregateByRegion(records: DailyRecord[]) {
  const grouped = new Map<string, {
    region: string;
    demand: number;
    production: number;
    shipments: number;
  }>();

  records.forEach(record => {
    const existing = grouped.get(record.region);
    if (existing) {
      existing.demand += record.demand_units;
      existing.production += record.production_units;
      existing.shipments += 1;
    } else {
      grouped.set(record.region, {
        region: record.region,
        demand: record.demand_units,
        production: record.production_units,
        shipments: 1
      });
    }
  });

  return Array.from(grouped.values());
}

// Aggregate data by transport mode
export function aggregateByTransport(records: DailyRecord[]) {
  const grouped = new Map<string, {
    transport_mode: string;
    shipments: number;
    cost: number;
    avgTime: number;
  }>();

  const transportTimes: Record<string, number> = {
    'Air': 1,
    'Truck': 3,
    'Ship': 7
  };

  records.forEach(record => {
    const existing = grouped.get(record.transport_mode);
    if (existing) {
      existing.shipments += 1;
      existing.cost += record.total_cost;
    } else {
      grouped.set(record.transport_mode, {
        transport_mode: record.transport_mode,
        shipments: 1,
        cost: record.total_cost,
        avgTime: transportTimes[record.transport_mode] || 3
      });
    }
  });

  return Array.from(grouped.values());
}

// Aggregate data by supplier
export function aggregateBySupplier(records: DailyRecord[]) {
  const grouped = new Map<string, {
    supplier: string;
    cost: number;
    shipments: number;
  }>();

  records.forEach(record => {
    const existing = grouped.get(record.supplier_id);
    if (existing) {
      existing.cost += record.total_cost;
      existing.shipments += 1;
    } else {
      grouped.set(record.supplier_id, {
        supplier: record.supplier_id,
        cost: record.total_cost,
        shipments: 1
      });
    }
  });

  return Array.from(grouped.values());
}

// Get inventory status for all products
export function getInventoryStatus(records: DailyRecord[]) {
  const latestByProduct = new Map<string, {
    product_id: string;
    product_name: string;
    inventory: number;
    category: string;
    lastDate: string;
  }>();

  records.forEach(record => {
    const existing = latestByProduct.get(record.product_id);
    if (!existing || record.date > existing.lastDate) {
      const product = PRODUCTS.find(p => p.product_id === record.product_id);
      latestByProduct.set(record.product_id, {
        product_id: record.product_id,
        product_name: record.product_name,
        inventory: record.inventory_end_of_day,
        category: product?.category || 'unknown',
        lastDate: record.date
      });
    }
  });

  return Array.from(latestByProduct.values());
}

// Get stockout events
export function getStockoutEvents(records: DailyRecord[]) {
  return records
    .filter(r => r.inventory_end_of_day === 0)
    .map(r => ({
      date: r.date,
      product_id: r.product_id,
      product_name: r.product_name,
      region: r.region,
      notes: r.notes
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);
}

// Get special events from notes
export function getSpecialEvents(records: DailyRecord[]) {
  return records
    .filter(r => r.notes && r.notes.length > 0)
    .map(r => ({
      date: r.date,
      product_name: r.product_name,
      region: r.region,
      event: r.notes,
      type: r.notes.includes('Stockout') ? 'warning' : 
            r.notes.includes('delay') || r.notes.includes('anomaly') ? 'error' : 'info'
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);
}

// Calculate KPIs
export function calculateKPIs(records: DailyRecord[]) {
  if (records.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalCost: 0,
      profitMargin: 0,
      fulfillmentRate: 0,
      stockoutDays: 0,
      avgCostPerUnit: 0,
      activeShipments: 0
    };
  }

  const totalOrders = records.reduce((sum, r) => sum + r.production_units, 0);
  const totalRevenue = records.reduce((sum, r) => sum + r.total_revenue, 0);
  const totalCost = records.reduce((sum, r) => sum + r.total_cost, 0);
  const totalDemand = records.reduce((sum, r) => sum + r.demand_units, 0);
  const totalProduction = records.reduce((sum, r) => sum + r.production_units, 0);
  const stockoutDays = records.filter(r => r.inventory_end_of_day === 0).length;
  const totalUnits = records.reduce((sum, r) => sum + r.production_units, 0);

  return {
    totalOrders,
    totalRevenue,
    totalCost,
    profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0,
    fulfillmentRate: totalDemand > 0 ? (totalProduction / totalDemand) * 100 : 0,
    stockoutDays,
    avgCostPerUnit: totalUnits > 0 ? totalCost / totalUnits : 0,
    activeShipments: records.filter(r => r.notes && r.notes.length > 0).length
  };
}

// Get inventory trend over time
export function getInventoryTrend(records: DailyRecord[]) {
  const grouped = new Map<string, number>();

  records.forEach(record => {
    const existing = grouped.get(record.date);
    if (existing) {
      grouped.set(record.date, existing + record.inventory_end_of_day);
    } else {
      grouped.set(record.date, record.inventory_end_of_day);
    }
  });

  return Array.from(grouped.entries())
    .map(([date, inventory]) => ({ date, inventory }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Format number
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

// Get status color based on value and thresholds
export function getStatusColor(value: number, type: 'fulfillment' | 'margin' | 'inventory'): { color: string; status: 'success' | 'warning' | 'danger' } {
  switch (type) {
    case 'fulfillment':
      if (value >= 95) return { color: 'text-green-600 bg-green-50', status: 'success' };
      if (value >= 90) return { color: 'text-yellow-600 bg-yellow-50', status: 'warning' };
      return { color: 'text-red-600 bg-red-50', status: 'danger' };
    case 'margin':
      if (value >= 20) return { color: 'text-green-600 bg-green-50', status: 'success' };
      if (value >= 10) return { color: 'text-yellow-600 bg-yellow-50', status: 'warning' };
      return { color: 'text-red-600 bg-red-50', status: 'danger' };
    case 'inventory':
      if (value >= 50 && value <= 200) return { color: 'text-green-600 bg-green-50', status: 'success' };
      if (value >= 20 && value < 50) return { color: 'text-yellow-600 bg-yellow-50', status: 'warning' };
      if (value > 200) return { color: 'text-blue-600 bg-blue-50', status: 'success' };
      return { color: 'text-red-600 bg-red-50', status: 'danger' };
    default:
      return { color: 'text-gray-600 bg-gray-50', status: 'success' };
  }
}