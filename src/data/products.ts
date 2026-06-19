import type { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    product_id: 'P001',
    product_name: 'iPhone 14',
    base_cost: 600,
    base_price: 900,
    category: 'high-demand',
    demand_min: 50,
    demand_max: 200,
    supplier: 'Foxconn'
  },
  {
    product_id: 'P002',
    product_name: 'Samsung Galaxy S23',
    base_cost: 550,
    base_price: 850,
    category: 'high-demand',
    demand_min: 50,
    demand_max: 200,
    supplier: 'Samsung Supplier'
  },
  {
    product_id: 'P003',
    product_name: 'MacBook Pro 16"',
    base_cost: 1800,
    base_price: 2500,
    category: 'laptop',
    demand_min: 20,
    demand_max: 80,
    supplier: 'Foxconn'
  },
  {
    product_id: 'P004',
    product_name: 'Dell XPS 13',
    base_cost: 1000,
    base_price: 1500,
    category: 'laptop',
    demand_min: 20,
    demand_max: 80,
    supplier: 'Foxconn'
  },
  {
    product_id: 'P005',
    product_name: 'Sony WH-1000XM5 Headphones',
    base_cost: 250,
    base_price: 400,
    category: 'accessory',
    demand_min: 100,
    demand_max: 500,
    supplier: 'Sony Supplier'
  },
  {
    product_id: 'P006',
    product_name: 'Logitech MX Master 3 Mouse',
    base_cost: 50,
    base_price: 80,
    category: 'accessory',
    demand_min: 100,
    demand_max: 500,
    supplier: 'Foxconn'
  },
  {
    product_id: 'P007',
    product_name: 'Nintendo Switch OLED',
    base_cost: 300,
    base_price: 450,
    category: 'high-demand',
    demand_min: 50,
    demand_max: 200,
    supplier: 'Foxconn'
  },
  {
    product_id: 'P008',
    product_name: 'PlayStation 5',
    base_cost: 500,
    base_price: 750,
    category: 'high-demand',
    demand_min: 50,
    demand_max: 200,
    supplier: 'Sony Supplier'
  },
  {
    product_id: 'P009',
    product_name: 'GoPro Hero 12',
    base_cost: 350,
    base_price: 500,
    category: 'high-demand',
    demand_min: 50,
    demand_max: 200,
    supplier: 'Foxconn'
  },
  {
    product_id: 'P010',
    product_name: 'Amazon Echo Dot',
    base_cost: 40,
    base_price: 70,
    category: 'accessory',
    demand_min: 100,
    demand_max: 500,
    supplier: 'Amazon Supplier'
  }
];

export const TRANSPORT_MODES: ('Truck' | 'Ship' | 'Air')[] = ['Truck', 'Ship', 'Air'];
export const REGIONS: ('North' | 'South' | 'East' | 'West')[] = ['North', 'South', 'East', 'West'];
