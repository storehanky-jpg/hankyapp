// Types for Hanky Macarons Production Manager

export interface BulkSale {
  id: string;
  sale_date: string;
  quantity_kg: number;
  price_per_kg: number;
  total_amount: number;
  amount_paid?: number;
  customer_name?: string;
  customer_id?: string;
  invoice_number?: string;
  order_number?: string;
  notes?: string;
  created_at: string;
}

export interface RecipeConfig {
  id: string;
  name: string;
  batch_size_kg: number;
  created_at: string;
}

export interface RecipeItem {
  id: string;
  recipe_id: string;
  material_id: string;
  quantity_per_batch: number;
  recipe_type: 'coque' | 'ganache';
  created_at: string;
  material?: RawMaterial;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  unit_cost: number;
  last_purchase_date?: string;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialPurchase {
  id: string;
  material_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchase_date: string;
  invoice_number?: string;
  notes?: string;
  created_at: string;
  material?: RawMaterial;
}

export interface FixedCharge {
  id: string;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
  is_active: boolean;
  created_at: string;
}

export interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  category?: string;
  notes?: string;
  created_at: string;
}

export interface Utility {
  id: string;
  type: 'gas' | 'electricity';
  amount: number;
  period_start: string;
  period_end: string;
  consumption?: number;
  unit?: string;
  created_at: string;
}

export interface LaborCost {
  id: string;
  employee_name: string;
  daily_wage: number;
  worked_days: number;
  period_month: number;
  period_year: number;
  total_cost: number;
  created_at: string;
}

export interface Packaging {
  id: string;
  name: string;
  box_size: number;
  unit_cost: number;
  stock_quantity: number;
  supplier?: string;
  created_at: string;
}

export interface ProductionBatch {
  id: string;
  batch_date: string;
  planned_quantity: number;
  produced_quantity: number;
  lost_quantity: number;
  notes?: string;
  created_at: string;
}

export interface RecipeIngredient {
  id: string;
  material_id: string;
  quantity_per_kg: number;
  created_at: string;
  material?: RawMaterial;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
  prices?: CustomerPrice[];
  products?: CustomerProduct[];
}

export interface CustomerPrice {
  id: string;
  customer_id: string;
  box_size?: number;
  product_type?: string;
  unit_label?: string;
  unit_price: number;
  created_at: string;
}

export interface CustomerProduct {
  id: string;
  customer_id: string;
  product_type: 'vrac' | 'boite' | 'magasin';
  label: string;
  unit_label: string;
  unit_price: number;
  is_paid: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  sale_date: string;
  box_size: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  amount_paid?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_id?: string;
  notes?: string;
  is_paid: boolean;
  bon_livraison_number?: string;
  facture_number?: string;
  production_batch_id?: string;
  created_at: string;
}

export interface UnsoldProduct {
  id: string;
  date: string;
  quantity: number;
  reason?: string;
  created_at: string;
}

export interface ShopSale {
  id: string;
  sale_date: string;
  quantity: number;
  price_per_piece: number;
  total_amount: number;
  amount_paid?: number;
  is_paid: boolean;
  customer_name?: string;
  customer_id?: string;
  invoice_number?: string;
  order_number?: string;
  notes?: string;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  currency: string;
  profit_margin: number;
  default_recipe_cost_per_kg?: number;
  created_at: string;
}

export interface DashboardStats {
  totalSalesToday: number;
  totalSalesMonth: number;
  totalPurchasesMonth: number;
  profitToday: number;
  profitMonth: number;
  productionCostPerKg: number;
  boxesSold: { size: number; count: number }[];
  recentSales: Sale[];
}

export interface CostBreakdown {
  rawMaterials: number;
  labor: number;
  packaging: number;
  fixedCharges: number;
  variableExpenses: number;
  utilities: number;
  total: number;
}

export interface BoxPricing {
  size: number;
  productionCost: number;
  packagingCost: number;
  totalCost: number;
  sellingPrice: number;
  margin: number;
  marginPercent: number;
}

export interface FiscalInfo {
  id: string;
  company_name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  rc?: string;
  nif?: string;
  ai?: string;
  nis?: string;
  rib?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  category?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export interface SupplierPurchase {
  id: string;
  supplier_id: string;
  purchase_date: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_amount: number;
  amount_paid: number;
  invoice_number?: string;
  notes?: string;
  created_at: string;
}
