import type { DailyRecord } from '../types';
import { PRODUCTS } from '../data/products';

// Calculate moving average for a series of values
export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push(values[i]);
    } else {
      let sum = 0;
      for (let j = 0; j < window; j++) {
        sum += values[i - j];
      }
      result.push(sum / window);
    }
  }
  return result;
}

// Calculate exponential smoothing
export function exponentialSmoothing(values: number[], alpha: number = 0.3): number[] {
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

// Calculate linear trend and project future values
export function linearTrend(values: number[], forecastDays: number): { trend: number[]; forecast: number[]; slope: number; intercept: number } {
  const n = values.length;
  
  // Handle edge cases
  if (n === 0) {
    return { trend: [], forecast: [], slope: 0, intercept: 0 };
  }
  
  if (n === 1) {
    const value = values[0];
    return { 
      trend: [value], 
      forecast: Array(forecastDays).fill(value), 
      slope: 0, 
      intercept: value 
    };
  }
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }
  
  const denominator = n * sumXX - sumX * sumX;
  
  // Handle case where denominator is zero (all x values are the same, shouldn't happen with our x values)
  if (Math.abs(denominator) < 0.0001) {
    const avg = sumY / n;
    return { 
      trend: values.map(() => avg), 
      forecast: Array(forecastDays).fill(avg), 
      slope: 0, 
      intercept: avg 
    };
  }
  
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  
  const trend = values.map((_, i) => slope * i + intercept);
  const forecast = Array.from({ length: forecastDays }, (_, i) => slope * (n + i) + intercept);
  
  return { trend, forecast, slope, intercept };
}

// Calculate seasonal factors (weekly pattern)
export function calculateSeasonalFactors(records: DailyRecord[]): number[] {
  const dayOfWeekTotals = new Array(7).fill(0);
  const dayOfWeekCounts = new Array(7).fill(0);
  
  records.forEach(record => {
    const date = new Date(record.date);
    const dayOfWeek = date.getDay();
    dayOfWeekTotals[dayOfWeek] += record.demand_units;
    dayOfWeekCounts[dayOfWeek]++;
  });
  
  const averages = dayOfWeekTotals.map((total, i) => 
    dayOfWeekCounts[i] > 0 ? total / dayOfWeekCounts[i] : 1
  );
  
  const overallAvg = averages.reduce((a, b) => a + b, 0) / 7;
  return averages.map(avg => avg / overallAvg);
}

// Aggregate demand by date for forecasting
export function aggregateDemandByDate(records: DailyRecord[]): { date: string; demand: number; production: number }[] {
  const grouped = new Map<string, { date: string; demand: number; production: number }>();
  
  records.forEach(record => {
    const existing = grouped.get(record.date);
    if (existing) {
      existing.demand += record.demand_units;
      existing.production += record.production_units;
    } else {
      grouped.set(record.date, {
        date: record.date,
        demand: record.demand_units,
        production: record.production_units
      });
    }
  });
  
  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}

// Generate demand forecast with multiple methods
export function generateDemandForecast(
  records: DailyRecord[],
  forecastDays: number = 30
): {
  historical: { date: string; demand: number; production: number }[];
  forecast: { date: string; predicted: number; lower: number; upper: number }[];
  seasonalFactors: number[];
  trendSlope: number;
  confidence: number;
} {
  const historical = aggregateDemandByDate(records);
  const demands = historical.map(h => h.demand);
  
  if (demands.length === 0) {
    return { historical: [], forecast: [], seasonalFactors: [], trendSlope: 0, confidence: 0 };
  }
  
  // Calculate trend
  const { trend, forecast: trendForecast, slope } = linearTrend(demands, forecastDays);
  
  // Calculate seasonal factors
  const seasonalFactors = calculateSeasonalFactors(records);
  
  // Calculate standard deviation for confidence intervals
  const residuals = demands.map((d, i) => d - (trend[i] || d));
  const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
  
  // Generate forecast dates
  const lastDate = new Date(historical[historical.length - 1].date);
  const forecast = Array.from({ length: forecastDays }, (_, i) => {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i + 1);
    
    // Combine trend with seasonal factor
    const dayOfWeek = date.getDay();
    const seasonalFactor = seasonalFactors[dayOfWeek] || 1;
    const basePrediction = trendForecast[i] * seasonalFactor;
    
    // Ensure prediction is non-negative
    const predicted = Math.max(0, Math.round(basePrediction));
    
    return {
      date: date.toISOString().split('T')[0],
      predicted,
      lower: Math.max(0, Math.round(basePrediction - 1.96 * stdDev)),
      upper: Math.round(basePrediction + 1.96 * stdDev)
    };
  });
  
  // Calculate confidence based on historical fit
  const mape = demands.reduce((sum, actual, i) => {
    const predicted = trend[i] || actual;
    return sum + Math.abs((actual - predicted) / actual);
  }, 0) / demands.length * 100;
  
  const confidence = Math.max(0, Math.min(100, 100 - mape));
  
  return {
    historical,
    forecast,
    seasonalFactors,
    trendSlope: slope,
    confidence
  };
}

// Aggregate data by product for forecasting
export function aggregateByProductForForecast(records: DailyRecord[]): {
  product_id: string;
  product_name: string;
  category: string;
  avgDemand: number;
  growthRate: number;
  volatility: number;
  seasonalStrength: number;
}[] {
  const productData = new Map<string, {
    product_id: string;
    product_name: string;
    category: string;
    demands: number[];
    dates: string[];
  }>();
  
  records.forEach(record => {
    const existing = productData.get(record.product_id);
    if (existing) {
      existing.demands.push(record.demand_units);
      existing.dates.push(record.date);
    } else {
      const product = PRODUCTS.find(p => p.product_id === record.product_id);
      productData.set(record.product_id, {
        product_id: record.product_id,
        product_name: record.product_name,
        category: product?.category || 'unknown',
        demands: [record.demand_units],
        dates: [record.date]
      });
    }
  });
  
  return Array.from(productData.values()).map(data => {
    const demands = data.demands;
    const avgDemand = demands.reduce((a, b) => a + b, 0) / demands.length;
    
    // Calculate growth rate using linear trend
    const { slope, intercept: _intercept } = linearTrend(demands, 0);
    const growthRate = avgDemand > 0 ? (slope / avgDemand) * 100 : 0;
    
    // Calculate volatility (coefficient of variation)
    const variance = demands.reduce((sum, d) => sum + Math.pow(d - avgDemand, 2), 0) / demands.length;
    const stdDev = Math.sqrt(variance);
    const volatility = avgDemand > 0 ? (stdDev / avgDemand) * 100 : 0;
    
    // Calculate seasonal strength
    const dayOfWeekTotals = new Array(7).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);
    data.dates.forEach((date, i) => {
      const day = new Date(date).getDay();
      dayOfWeekTotals[day] += demands[i];
      dayOfWeekCounts[day]++;
    });
    const dayAvgs = dayOfWeekTotals.map((total, i) => 
      dayOfWeekCounts[i] > 0 ? total / dayOfWeekCounts[i] : avgDemand
    );
    const seasonalVariance = dayAvgs.reduce((sum, d) => sum + Math.pow(d - avgDemand, 2), 0) / 7;
    const seasonalStrength = avgDemand > 0 ? (Math.sqrt(seasonalVariance) / avgDemand) * 100 : 0;
    
    return {
      product_id: data.product_id,
      product_name: data.product_name,
      category: data.category,
      avgDemand: Math.round(avgDemand),
      growthRate: Math.round(growthRate * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      seasonalStrength: Math.round(seasonalStrength * 100) / 100
    };
  }).sort((a, b) => b.avgDemand - a.avgDemand);
}

// Cost analysis utilities
export function analyzeCostTrends(records: DailyRecord[]): {
  product_id: string;
  product_name: string;
  category: string;
  avgCost: number;
  costTrend: number;
  costVolatility: number;
  predictedNextMonth: number;
}[] {
  const productData = new Map<string, {
    product_id: string;
    product_name: string;
    category: string;
    costs: number[];
  }>();
  
  records.forEach(record => {
    const existing = productData.get(record.product_id);
    if (existing) {
      existing.costs.push(record.cost_per_unit);
    } else {
      const product = PRODUCTS.find(p => p.product_id === record.product_id);
      productData.set(record.product_id, {
        product_id: record.product_id,
        product_name: record.product_name,
        category: product?.category || 'unknown',
        costs: [record.cost_per_unit]
      });
    }
  });
  
  return Array.from(productData.values()).map(data => {
    const costs = data.costs;
    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    
    // Calculate trend
    const { slope, intercept } = linearTrend(costs, 30);
    const costTrend = avgCost > 0 ? (slope / avgCost) * 100 : 0;
    
    // Calculate volatility
    const variance = costs.reduce((sum, c) => sum + Math.pow(c - avgCost, 2), 0) / costs.length;
    const stdDev = Math.sqrt(variance);
    const costVolatility = avgCost > 0 ? (stdDev / avgCost) * 100 : 0;
    
    // Predict next month cost
    const predictedNextMonth = Math.max(0, slope * (costs.length + 15) + intercept);
    
    return {
      product_id: data.product_id,
      product_name: data.product_name,
      category: data.category,
      avgCost: Math.round(avgCost * 100) / 100,
      costTrend: Math.round(costTrend * 100) / 100,
      costVolatility: Math.round(costVolatility * 100) / 100,
      predictedNextMonth: Math.round(predictedNextMonth * 100) / 100
    };
  }).sort((a, b) => b.avgCost - a.avgCost);
}

// Analyze supplier costs
export function analyzeSupplierCosts(records: DailyRecord[]): {
  supplier: string;
  avgCost: number;
  totalSpend: number;
  costTrend: number;
  volatility: number;
  shipmentCount: number;
}[] {
  const supplierData = new Map<string, {
    supplier: string;
    costs: number[];
    totalSpend: number;
    shipmentCount: number;
  }>();
  
  records.forEach(record => {
    const existing = supplierData.get(record.supplier_id);
    if (existing) {
      existing.costs.push(record.cost_per_unit);
      existing.totalSpend += record.total_cost;
      existing.shipmentCount++;
    } else {
      supplierData.set(record.supplier_id, {
        supplier: record.supplier_id,
        costs: [record.cost_per_unit],
        totalSpend: record.total_cost,
        shipmentCount: 1
      });
    }
  });
  
  return Array.from(supplierData.values()).map(data => {
    const avgCost = data.costs.reduce((a, b) => a + b, 0) / data.costs.length;
    
    // Calculate trend
    const { slope } = linearTrend(data.costs, 0);
    const costTrend = avgCost > 0 ? (slope / avgCost) * 100 : 0;
    
    // Calculate volatility
    const variance = data.costs.reduce((sum, c) => sum + Math.pow(c - avgCost, 2), 0) / data.costs.length;
    const volatility = avgCost > 0 ? (Math.sqrt(variance) / avgCost) * 100 : 0;
    
    return {
      supplier: data.supplier,
      avgCost: Math.round(avgCost * 100) / 100,
      totalSpend: Math.round(data.totalSpend),
      costTrend: Math.round(costTrend * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      shipmentCount: data.shipmentCount
    };
  }).sort((a, b) => b.totalSpend - a.totalSpend);
}

// Calculate cost by transport mode
export function analyzeTransportCosts(records: DailyRecord[]): {
  transport_mode: string;
  avgCost: number;
  avgCostPerUnit: number;
  totalShipments: number;
  totalCost: number;
}[] {
  const transportData = new Map<string, {
    transport_mode: string;
    costs: number[];
    costPerUnits: number[];
    totalShipments: number;
    totalCost: number;
  }>();
  
  records.forEach(record => {
    const existing = transportData.get(record.transport_mode);
    if (existing) {
      existing.costs.push(record.total_cost);
      existing.costPerUnits.push(record.cost_per_unit);
      existing.totalShipments++;
      existing.totalCost += record.total_cost;
    } else {
      transportData.set(record.transport_mode, {
        transport_mode: record.transport_mode,
        costs: [record.total_cost],
        costPerUnits: [record.cost_per_unit],
        totalShipments: 1,
        totalCost: record.total_cost
      });
    }
  });
  
  return Array.from(transportData.values()).map(data => ({
    transport_mode: data.transport_mode,
    avgCost: Math.round((data.costs.reduce((a, b) => a + b, 0) / data.costs.length) * 100) / 100,
    avgCostPerUnit: Math.round((data.costPerUnits.reduce((a, b) => a + b, 0) / data.costPerUnits.length) * 100) / 100,
    totalShipments: data.totalShipments,
    totalCost: Math.round(data.totalCost)
  }));
}

// Detect cost anomalies
export function detectCostAnomalies(records: DailyRecord[]): {
  date: string;
  product_name: string;
  supplier: string;
  cost: number;
  avgCost: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
}[] {
  // Calculate average cost per product
  const productCosts = new Map<string, number[]>();
  records.forEach(record => {
    const existing = productCosts.get(record.product_id);
    if (existing) {
      existing.push(record.cost_per_unit);
    } else {
      productCosts.set(record.product_id, [record.cost_per_unit]);
    }
  });
  
  const productAvgs = new Map<string, { avg: number; stdDev: number }>();
  productCosts.forEach((costs, productId) => {
    const avg = costs.reduce((a, b) => a + b, 0) / costs.length;
    const variance = costs.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / costs.length;
    productAvgs.set(productId, { avg, stdDev: Math.sqrt(variance) });
  });
  
  // Find anomalies (costs > 2 standard deviations from mean)
  const anomalies = records
    .map(record => {
      const stats = productAvgs.get(record.product_id);
      if (!stats || stats.stdDev === 0) return null;
      
      const deviation = Math.abs(record.cost_per_unit - stats.avg) / stats.stdDev;
      if (deviation < 1.5) return null;
      
      return {
        date: record.date,
        product_name: record.product_name,
        supplier: record.supplier_id,
        cost: Math.round(record.cost_per_unit * 100) / 100,
        avgCost: Math.round(stats.avg * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        severity: deviation > 3 ? 'high' : deviation > 2 ? 'medium' : 'low' as 'low' | 'medium' | 'high'
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, 20);
  
  return anomalies;
}

// Format percentage
export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// Get trend color
export function getTrendColor(value: number): { color: string; bg: string; icon: string } {
  if (value > 5) return { color: 'text-green-600', bg: 'bg-green-50', icon: '↑' };
  if (value > 0) return { color: 'text-green-500', bg: 'bg-green-50', icon: '↗' };
  if (value > -5) return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '→' };
  return { color: 'text-red-600', bg: 'bg-red-50', icon: '↓' };
}
