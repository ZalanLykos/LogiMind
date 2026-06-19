import type { DailyRecord, Product } from '../types';
import { PRODUCTS, TRANSPORT_MODES, REGIONS } from './products';
import { format, addDays, startOfYear } from 'date-fns';

// Random number generator with seed support for reproducibility
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  // Linear congruential generator
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Random number between min and max
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Random integer between min and max (inclusive)
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  // Random choice from array
  choice<T>(arr: T[]): T {
    return arr[this.rangeInt(0, arr.length - 1)];
  }

  // Normal distribution using Box-Muller transform
  normal(mean: number, stdDev: number): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

// Generate seasonal multiplier (higher in Nov-Dec, lower in mid-year)
function getSeasonalMultiplier(dayOfYear: number): number {
  // Peak season: November-December (days 305-365)
  // Use sine wave for smooth transition
  const normalizedDay = (dayOfYear / 365) * 2 * Math.PI;
  // Shift so peak is around day 330 (late November)
  const seasonal = Math.sin(normalizedDay - Math.PI / 2) * 0.3 + 1;
  // Boost for holiday season (Nov-Dec)
  const holidayBoost = dayOfYear > 305 ? 1.3 : 1;
  return seasonal * holidayBoost;
}

// Special events that affect demand
function getSpecialEvent(dayOfYear: number, random: SeededRandom): { multiplier: number; note: string } {
  const events: { day: number; month: string; name: string; multiplier: number }[] = [
    { day: 1, month: '01', name: 'New Year', multiplier: 1.5 },
    { day: 14, month: '02', name: 'Valentine Day', multiplier: 1.3 },
    { day: 25, month: '12', name: 'Christmas', multiplier: 2.0 },
    { day: 26, month: '11', name: 'Black Friday', multiplier: 2.5 },
    { day: 27, month: '11', name: 'Cyber Monday', multiplier: 2.3 },
    { day: 4, month: '07', name: 'Independence Day', multiplier: 1.2 },
  ];

  // Check if current day is near any event (within 3 days)
  for (const event of events) {
    const eventDay = parseInt(event.month) * 30 + event.day; // Approximate
    if (Math.abs(dayOfYear - eventDay) <= 3) {
      return { multiplier: event.multiplier, note: `${event.name} demand spike` };
    }
  }

  // Random supplier delay (5% chance)
  if (random.next() < 0.05) {
    return { multiplier: 0.7, note: 'Supplier delay' };
  }

  // Random transport anomaly (3% chance)
  if (random.next() < 0.03) {
    return { multiplier: 0.8, note: 'Transport anomaly' };
  }

  return { multiplier: 1, note: '' };
}

// Generate demand with seasonal patterns and randomness
function generateDemand(product: Product, dayOfYear: number, random: SeededRandom): { demand: number; note: string } {
  const baseDemand = random.rangeInt(product.demand_min, product.demand_max);
  const seasonalMult = getSeasonalMultiplier(dayOfYear);
  const event = getSpecialEvent(dayOfYear, random);
  
  // Add random noise (±15%)
  const noise = random.normal(1, 0.15);
  
  let demand = Math.round(baseDemand * seasonalMult * event.multiplier * noise);
  
  // Ensure demand doesn't go below 0
  demand = Math.max(0, demand);
  
  return { demand, note: event.note };
}

// Generate cost with supplier and market fluctuations
function generateCost(product: Product, random: SeededRandom): number {
  // Supplier fluctuation ±5-10%
  const supplierFluctuation = random.normal(0, 0.075);
  // Market variation ±5%
  const marketVariation = random.normal(0, 0.05);
  
  const fluctuation = supplierFluctuation + marketVariation;
  const cost = product.base_cost * (1 + fluctuation);
  
  // Round to 2 decimal places
  return Math.round(cost * 100) / 100;
}

// Generate sales price with seasonal and random variation
function generateSalesPrice(product: Product, dayOfYear: number, random: SeededRandom): number {
  // Seasonal price variation (higher during holidays)
  const seasonalMult = getSeasonalMultiplier(dayOfYear);
  const priceVariation = random.normal(0, 0.03); // ±3% random variation
  
  const price = product.base_price * (seasonalMult * 0.9 + 0.1) * (1 + priceVariation);
  
  // Round to 2 decimal places
  return Math.round(price * 100) / 100;
}

// Generate all data for a year with random seed
export function generateYearlyData(year?: number): DailyRecord[] {
  // Use random seed based on current timestamp for completely random data each time
  const seed = year ?? Date.now() + Math.floor(Math.random() * 1000000);
  const random = new SeededRandom(seed);
  const records: DailyRecord[] = [];
  const dataYear = year ?? 2024;
  const startDate = startOfYear(new Date(dataYear, 0, 1));
  
  // Track inventory for each product
  const inventory: Map<string, number> = new Map();
  PRODUCTS.forEach(p => inventory.set(p.product_id, 100)); // Start with 100 units

  for (let day = 0; day < 365; day++) {
    const currentDate = addDays(startDate, day);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfYear = day + 1;

    for (const product of PRODUCTS) {
      // Generate demand
      const { demand: demand_units, note: demandNote } = generateDemand(product, dayOfYear, random);
      
      // Get current inventory
      const currentInventory = inventory.get(product.product_id) || 0;
      
      // Determine production (try to meet demand + safety stock)
      const safetyStock = Math.round(demand_units * 0.2);
      const targetProduction = demand_units + safetyStock;
      
      // Production has some randomness (80-120% of target)
      const productionVariation = random.range(0.8, 1.2);
      let production_units = Math.round(targetProduction * productionVariation);
      
      // Cost per unit
      const cost_per_unit = generateCost(product, random);
      
      // Sales price
      const sales_price_per_unit = generateSalesPrice(product, dayOfYear, random);
      
      // Calculate actual shipped units (limited by available inventory + production)
      const availableUnits = currentInventory + production_units;
      const actualShipped = Math.min(demand_units, availableUnits);
      
      // Calculate totals
      const total_cost = Math.round(production_units * cost_per_unit * 100) / 100;
      const total_revenue = Math.round(actualShipped * sales_price_per_unit * 100) / 100;
      
      // Update inventory
      const inventory_end_of_day = Math.max(0, currentInventory + production_units - actualShipped);
      inventory.set(product.product_id, inventory_end_of_day);
      
      // Add stockout note if applicable
      let finalNote = demandNote;
      if (actualShipped < demand_units) {
        finalNote = finalNote ? `${finalNote}, Stockout` : 'Stockout';
      }
      
      const record: DailyRecord = {
        date: dateStr,
        product_id: product.product_id,
        product_name: product.product_name,
        demand_units,
        production_units,
        cost_per_unit,
        total_cost,
        sales_price_per_unit,
        total_revenue,
        inventory_end_of_day,
        supplier_id: product.supplier,
        transport_mode: random.choice(TRANSPORT_MODES),
        region: random.choice(REGIONS),
        notes: finalNote
      };
      
      records.push(record);
    }
  }

  return records;
}

// Export data as JSON file
export function exportToJSON(records: DailyRecord[]): string {
  return JSON.stringify(records, null, 2);
}

// Download JSON file
export function downloadJSON(records: DailyRecord[], filename: string = 'data.json'): void {
  const json = exportToJSON(records);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// File System Access API - Save to local file
export async function saveToLocalFile(records: DailyRecord[]): Promise<boolean> {
  const json = exportToJSON(records);
  const blob = new Blob([json], { type: 'application/json' });
  
  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      const opts = {
        suggestedName: 'Database.json',
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
      };
      
      // @ts-expect-error - File System Access API may not be in all TypeScript lib definitions
      const handle = await window.showSaveFilePicker(opts);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      // User cancelled or error occurred, fall back to download
      if ((err as Error).name !== 'AbortError') {
        console.error('File System Access API error:', err);
      }
      downloadJSON(records, 'Database.json');
      return false;
    }
  } else {
    // Fallback for browsers without File System Access API
    downloadJSON(records, 'Database.json');
    return false;
  }
}
