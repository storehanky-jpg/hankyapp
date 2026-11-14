import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { offlineStorage, isOnline } from '../lib/storage';
import { offlineCreate, offlineUpdate, offlineDelete, purgeFromLocal, mergeWithLocal, addToTombstone } from '../lib/offlineDb';
import type {
  RawMaterial, MaterialPurchase, FixedCharge, VariableExpense,
  Utility, LaborCost, Packaging, ProductionBatch, ProductionMaterial, Sale, UnsoldProduct,
  CompanySettings, BulkSale, RecipeConfig, RecipeItem, ShopSale,
  Customer, CustomerPrice, CustomerProduct, FiscalInfo, Supplier, SupplierPurchase, Order
} from '../types';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData<T>(key: string): { data: T | null; timestamp: number } | null {
  const cached = offlineStorage.get<{ data: T; timestamp: number }>(`cache_${key}`);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  offlineStorage.set(`cache_${key}`, { data, timestamp: Date.now() });
}

// Raw Materials
export const rawMaterialsService = {
  async getAll(): Promise<RawMaterial[]> {
    if (!isOnline()) {
      return offlineStorage.get<RawMaterial[]>('raw_materials') || [];
    }
    try {
      const { data, error } = await supabase.from('raw_materials').select('*').order('name');
      if (error) throw error;
      const merged = mergeWithLocal<RawMaterial>('raw_materials', data);
      offlineStorage.set('raw_materials', merged);
      return merged;
    } catch {
      return offlineStorage.get<RawMaterial[]>('raw_materials') || [];
    }
  },

  async create(material: Omit<RawMaterial, 'id' | 'created_at' | 'updated_at'>): Promise<RawMaterial> {
    if (!isOnline()) {
      return offlineCreate<RawMaterial>('raw_materials', { ...material, updated_at: new Date().toISOString() });
    }
    const { data, error } = await supabase.from('raw_materials').insert(material).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, material: Partial<RawMaterial>): Promise<RawMaterial> {
    if (!isOnline()) {
      return offlineUpdate<RawMaterial>('raw_materials', id, { ...material, updated_at: new Date().toISOString() });
    }
    const { data, error } = await supabase
      .from('raw_materials')
      .update({ ...material, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<RawMaterial>('raw_materials', id);
      addToTombstone('raw_materials', id);
      return;
    }
    const { error } = await supabase.from('raw_materials').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<RawMaterial>('raw_materials', id);
    addToTombstone('raw_materials', id);
  }
};

// Material Purchases
export const materialPurchasesService = {
  async getAll(): Promise<MaterialPurchase[]> {
    if (!isOnline()) {
      return offlineStorage.get<MaterialPurchase[]>('material_purchases') || [];
    }
    try {
      const { data, error } = await supabase
        .from('material_purchases')
        .select('*, material:raw_materials(*)')
        .order('purchase_date', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<MaterialPurchase>('material_purchases', data);
      offlineStorage.set('material_purchases', merged);
      return merged;
    } catch {
      return offlineStorage.get<MaterialPurchase[]>('material_purchases') || [];
    }
  },

  async create(purchase: Omit<MaterialPurchase, 'id' | 'created_at'>): Promise<MaterialPurchase> {
    if (!isOnline()) {
      return offlineCreate<MaterialPurchase>('material_purchases', purchase);
    }
    const { data, error } = await supabase.from('material_purchases').insert(purchase).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, purchase: Partial<MaterialPurchase>): Promise<MaterialPurchase> {
    if (!isOnline()) {
      return offlineUpdate<MaterialPurchase>('material_purchases', id, purchase);
    }
    const { data, error } = await supabase.from('material_purchases').update(purchase).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<MaterialPurchase>('material_purchases', id);
      addToTombstone('material_purchases', id);
      return;
    }
    const { error } = await supabase.from('material_purchases').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<MaterialPurchase>('material_purchases', id);
    addToTombstone('material_purchases', id);
  }
};

// Fixed Charges
export const fixedChargesService = {
  async getAll(): Promise<FixedCharge[]> {
    if (!isOnline()) {
      return offlineStorage.get<FixedCharge[]>('fixed_charges') || [];
    }
    try {
      const { data, error } = await supabase.from('fixed_charges').select('*').order('name');
      if (error) throw error;
      const merged = mergeWithLocal<FixedCharge>('fixed_charges', data);
      offlineStorage.set('fixed_charges', merged);
      return merged;
    } catch {
      return offlineStorage.get<FixedCharge[]>('fixed_charges') || [];
    }
  },

  async create(charge: Omit<FixedCharge, 'id' | 'created_at'>): Promise<FixedCharge> {
    if (!isOnline()) {
      return offlineCreate<FixedCharge>('fixed_charges', charge);
    }
    const { data, error } = await supabase.from('fixed_charges').insert(charge).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, charge: Partial<FixedCharge>): Promise<FixedCharge> {
    if (!isOnline()) {
      return offlineUpdate<FixedCharge>('fixed_charges', id, charge);
    }
    const { data, error } = await supabase.from('fixed_charges').update(charge).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<FixedCharge>('fixed_charges', id);
      addToTombstone('fixed_charges', id);
      return;
    }
    const { error } = await supabase.from('fixed_charges').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<FixedCharge>('fixed_charges', id);
    addToTombstone('fixed_charges', id);
  }
};

// Variable Expenses
export const variableExpensesService = {
  async getAll(): Promise<VariableExpense[]> {
    if (!isOnline()) {
      return offlineStorage.get<VariableExpense[]>('variable_expenses') || [];
    }
    try {
      const { data, error } = await supabase.from('variable_expenses').select('*').order('date', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<VariableExpense>('variable_expenses', data);
      offlineStorage.set('variable_expenses', merged);
      return merged;
    } catch {
      return offlineStorage.get<VariableExpense[]>('variable_expenses') || [];
    }
  },

  async create(expense: Omit<VariableExpense, 'id' | 'created_at'>): Promise<VariableExpense> {
    if (!isOnline()) {
      return offlineCreate<VariableExpense>('variable_expenses', expense);
    }
    const { data, error } = await supabase.from('variable_expenses').insert(expense).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<VariableExpense>('variable_expenses', id);
      addToTombstone('variable_expenses', id);
      return;
    }
    const { error } = await supabase.from('variable_expenses').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<VariableExpense>('variable_expenses', id);
    addToTombstone('variable_expenses', id);
  }
};

// Utilities
export const utilitiesService = {
  async getAll(): Promise<Utility[]> {
    if (!isOnline()) {
      return offlineStorage.get<Utility[]>('utilities') || [];
    }
    try {
      const { data, error } = await supabase.from('utilities').select('*').order('period_start', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<Utility>('utilities', data);
      offlineStorage.set('utilities', merged);
      return merged;
    } catch {
      return offlineStorage.get<Utility[]>('utilities') || [];
    }
  },

  async create(utility: Omit<Utility, 'id' | 'created_at'>): Promise<Utility> {
    if (!isOnline()) {
      return offlineCreate<Utility>('utilities', utility);
    }
    const { data, error } = await supabase.from('utilities').insert(utility).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<Utility>('utilities', id);
      addToTombstone('utilities', id);
      return;
    }
    const { error } = await supabase.from('utilities').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<Utility>('utilities', id);
    addToTombstone('utilities', id);
  }
};

// Labor Costs
export const laborCostsService = {
  async getAll(): Promise<LaborCost[]> {
    if (!isOnline()) {
      return offlineStorage.get<LaborCost[]>('labor_costs') || [];
    }
    try {
      const { data, error } = await supabase.from('labor_costs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<LaborCost>('labor_costs', data);
      offlineStorage.set('labor_costs', merged);
      return merged;
    } catch {
      return offlineStorage.get<LaborCost[]>('labor_costs') || [];
    }
  },

  async create(labor: Omit<LaborCost, 'id' | 'created_at'>): Promise<LaborCost> {
    if (!isOnline()) {
      return offlineCreate<LaborCost>('labor_costs', labor);
    }
    const { data, error } = await supabase.from('labor_costs').insert(labor).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<LaborCost>('labor_costs', id);
      addToTombstone('labor_costs', id);
      return;
    }
    const { error } = await supabase.from('labor_costs').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<LaborCost>('labor_costs', id);
    addToTombstone('labor_costs', id);
  }
};

// Packaging
export const packagingService = {
  async getAll(): Promise<Packaging[]> {
    if (!isOnline()) {
      return offlineStorage.get<Packaging[]>('packaging') || [];
    }
    try {
      const { data, error } = await supabase.from('packaging').select('*').order('box_size');
      if (error) throw error;
      const merged = mergeWithLocal<Packaging>('packaging', data);
      offlineStorage.set('packaging', merged);
      return merged;
    } catch {
      return offlineStorage.get<Packaging[]>('packaging') || [];
    }
  },

  async create(pkg: Omit<Packaging, 'id' | 'created_at'>): Promise<Packaging> {
    if (!isOnline()) {
      return offlineCreate<Packaging>('packaging', pkg);
    }
    const { data, error } = await supabase.from('packaging').insert(pkg).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, pkg: Partial<Packaging>): Promise<Packaging> {
    if (!isOnline()) {
      return offlineUpdate<Packaging>('packaging', id, pkg);
    }
    const { data, error } = await supabase.from('packaging').update(pkg).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<Packaging>('packaging', id);
      addToTombstone('packaging', id);
      return;
    }
    const { error } = await supabase.from('packaging').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<Packaging>('packaging', id);
    addToTombstone('packaging', id);
  }
};

// Production Batches
export const productionBatchService = {
  async getAll(): Promise<ProductionBatch[]> {
    if (!isOnline()) {
      return offlineStorage.get<ProductionBatch[]>('production_batches') || [];
    }
    try {
      const { data, error } = await supabase
        .from('production_batches')
        .select('*, materials:production_materials(*, material:raw_materials(*))')
        .order('batch_date', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<ProductionBatch>('production_batches', data);
      offlineStorage.set('production_batches', merged);
      return merged;
    } catch {
      return offlineStorage.get<ProductionBatch[]>('production_batches') || [];
    }
  },

  async create(batch: Omit<ProductionBatch, 'id' | 'created_at' | 'materials'>): Promise<ProductionBatch> {
    if (!isOnline()) {
      return offlineCreate<ProductionBatch>('production_batches', batch);
    }
    const { data, error } = await supabase.from('production_batches').insert(batch).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, batch: Partial<ProductionBatch>): Promise<ProductionBatch> {
    if (!isOnline()) {
      return offlineUpdate<ProductionBatch>('production_batches', id, batch);
    }
    const { data, error } = await supabase.from('production_batches').update(batch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<ProductionBatch>('production_batches', id);
      addToTombstone('production_batches', id);
      return;
    }
    const { error } = await supabase.from('production_batches').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<ProductionBatch>('production_batches', id);
    addToTombstone('production_batches', id);
  }
};

// Sales
export const salesService = {
  async getAll(): Promise<Sale[]> {
    if (!isOnline()) {
      return offlineStorage.get<Sale[]>('sales') || [];
    }
    try {
      const { data, error } = await supabase.from('sales').select('*').order('sale_date', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<Sale>('sales', data);
      offlineStorage.set('sales', merged);
      return merged;
    } catch {
      return offlineStorage.get<Sale[]>('sales') || [];
    }
  },

  async create(sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> {
    if (!isOnline()) {
      return offlineCreate<Sale>('sales', sale);
    }
    const { data, error } = await supabase.from('sales').insert(sale).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, sale: Partial<Sale>): Promise<Sale> {
    if (!isOnline()) {
      return offlineUpdate<Sale>('sales', id, sale);
    }
    const { data, error } = await supabase.from('sales').update(sale).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<Sale>('sales', id);
      addToTombstone('sales', id);
      return;
    }
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<Sale>('sales', id);
    addToTombstone('sales', id);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    if (!isOnline()) {
      const sales = offlineStorage.get<Sale[]>('sales') || [];
      return sales.filter(s => s.sale_date >= startDate && s.sale_date <= endDate);
    }
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: false });
    if (error) throw error;
    return data;
  }
};

// Unsold Products
export const unsoldProductsService = {
  async getAll(): Promise<UnsoldProduct[]> {
    if (!isOnline()) {
      return offlineStorage.get<UnsoldProduct[]>('unsold_products') || [];
    }
    try {
      const { data, error } = await supabase.from('unsold_products').select('*').order('date', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<UnsoldProduct>('unsold_products', data);
      offlineStorage.set('unsold_products', merged);
      return merged;
    } catch {
      return offlineStorage.get<UnsoldProduct[]>('unsold_products') || [];
    }
  },

  async create(unsold: Omit<UnsoldProduct, 'id' | 'created_at'>): Promise<UnsoldProduct> {
    if (!isOnline()) {
      return offlineCreate<UnsoldProduct>('unsold_products', unsold);
    }
    const { data, error } = await supabase.from('unsold_products').insert(unsold).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<UnsoldProduct>('unsold_products', id);
      addToTombstone('unsold_products', id);
      return;
    }
    const { error } = await supabase.from('unsold_products').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<UnsoldProduct>('unsold_products', id);
    addToTombstone('unsold_products', id);
  }
};

// Company Settings
export const settingsService = {
  async get(): Promise<CompanySettings> {
    const local = offlineStorage.get<CompanySettings>('settings');
    if (!isOnline()) {
      return local || {
        id: 'default',
        company_name: 'Hanky Macarons',
        currency: 'DZD',
        profit_margin: 30,
        created_at: new Date().toISOString()
      };
    }
    try {
      const { data, error } = await supabase.from('company_settings').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) {
        const defaultSettings = {
          company_name: 'Hanky Macarons',
          currency: 'DZD',
          profit_margin: 30
        };
        const { data: newSettings, error: createError } = await supabase
          .from('company_settings')
          .insert(defaultSettings)
          .select()
          .single();
        if (createError) throw createError;
        offlineStorage.set('settings', newSettings);
        return newSettings;
      }
      offlineStorage.set('settings', data);
      return data;
    } catch {
      return local || {
        id: 'default',
        company_name: 'Hanky Macarons',
        currency: 'DZD',
        profit_margin: 30,
        created_at: new Date().toISOString()
      };
    }
  },

  async update(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const current = offlineStorage.get<CompanySettings>('settings');
    const updated = { ...current, ...settings } as CompanySettings;
    offlineStorage.set('settings', updated);
    if (!isOnline()) return updated;
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .update(settings)
        .eq('id', settings.id || 'default')
        .select()
        .single();
      if (error) throw error;
      offlineStorage.set('settings', data);
      return data;
    } catch {
      return updated;
    }
  }
};

// Bulk Sales
export const bulkSalesService = {
  async getAll(): Promise<BulkSale[]> {
    if (!isOnline()) {
      return offlineStorage.get<BulkSale[]>('bulk_sales') || [];
    }
    try {
      const { data, error } = await supabase.from('bulk_sales').select('*').order('sale_date', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<BulkSale>('bulk_sales', data);
      offlineStorage.set('bulk_sales', merged);
      return merged;
    } catch {
      return offlineStorage.get<BulkSale[]>('bulk_sales') || [];
    }
  },

  async create(sale: Omit<BulkSale, 'id' | 'created_at'>): Promise<BulkSale> {
    if (!isOnline()) {
      return offlineCreate<BulkSale>('bulk_sales', sale);
    }
    const { data, error } = await supabase.from('bulk_sales').insert(sale).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, sale: Partial<BulkSale>): Promise<BulkSale> {
    if (!isOnline()) {
      return offlineUpdate<BulkSale>('bulk_sales', id, sale);
    }
    const { data, error } = await supabase.from('bulk_sales').update(sale).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<BulkSale>('bulk_sales', id);
      addToTombstone('bulk_sales', id);
      return;
    }
    const { error } = await supabase.from('bulk_sales').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<BulkSale>('bulk_sales', id);
    addToTombstone('bulk_sales', id);
  }
};

// Recipe Config
export const recipeConfigService = {
  async get(): Promise<RecipeConfig> {
    const local = offlineStorage.get<RecipeConfig>('recipe_config');
    if (!isOnline()) {
      return local || {
        id: 'default',
        name: 'Macaron Classique',
        batch_size_kg: 1,
        created_at: new Date().toISOString()
      };
    }
    try {
      const { data, error } = await supabase.from('recipe_config').select('*').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) {
        const defaultRecipe = { name: 'Macaron Classique', batch_size_kg: 1 };
        const { data: newRecipe, error: createError } = await supabase
          .from('recipe_config')
          .insert(defaultRecipe)
          .select()
          .single();
        if (createError) throw createError;
        offlineStorage.set('recipe_config', newRecipe);
        return newRecipe;
      }
      offlineStorage.set('recipe_config', data);
      return data;
    } catch {
      return local || {
        id: 'default',
        name: 'Macaron Classique',
        batch_size_kg: 1,
        created_at: new Date().toISOString()
      };
    }
  },

  async update(recipe: Partial<RecipeConfig>): Promise<RecipeConfig> {
    const current = offlineStorage.get<RecipeConfig>('recipe_config');
    const updated = { ...current, ...recipe } as RecipeConfig;
    offlineStorage.set('recipe_config', updated);
    if (!isOnline()) return updated;
    try {
      const { data, error } = await supabase
        .from('recipe_config')
        .update(recipe)
        .eq('id', recipe.id || 'default')
        .select()
        .single();
      if (error) throw error;
      offlineStorage.set('recipe_config', data);
      return data;
    } catch {
      return updated;
    }
  }
};

// Recipe Items
export const recipeItemsService = {
  async getAll(): Promise<RecipeItem[]> {
    if (!isOnline()) {
      return offlineStorage.get<RecipeItem[]>('recipe_items') || [];
    }
    try {
      const { data, error } = await supabase
        .from('recipe_items')
        .select('*, material:raw_materials(*)')
        .order('created_at');
      if (error) throw error;
      const merged = mergeWithLocal<RecipeItem>('recipe_items', data);
      offlineStorage.set('recipe_items', merged);
      return merged;
    } catch {
      return offlineStorage.get<RecipeItem[]>('recipe_items') || [];
    }
  },

  async create(item: Omit<RecipeItem, 'id' | 'created_at'>): Promise<RecipeItem> {
    if (!isOnline()) {
      return offlineCreate<RecipeItem>('recipe_items', item);
    }
    const { data, error } = await supabase.from('recipe_items').insert(item).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, item: Partial<RecipeItem>): Promise<RecipeItem> {
    if (!isOnline()) {
      return offlineUpdate<RecipeItem>('recipe_items', id, item);
    }
    const { data, error } = await supabase.from('recipe_items').update(item).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<RecipeItem>('recipe_items', id);
      addToTombstone('recipe_items', id);
      return;
    }
    const { error } = await supabase.from('recipe_items').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<RecipeItem>('recipe_items', id);
    addToTombstone('recipe_items', id);
  }
};

// Shop Sales (Magasin Coques)
export const shopSalesService = {
  async getAll(): Promise<ShopSale[]> {
    if (!isOnline()) {
      return offlineStorage.get<ShopSale[]>('shop_sales') || [];
    }
    try {
      const { data, error } = await supabase.from('shop_sales').select('*').order('sale_date', { ascending: false });
      if (error) throw error;
      const merged = mergeWithLocal<ShopSale>('shop_sales', data);
      offlineStorage.set('shop_sales', merged);
      return merged;
    } catch {
      return offlineStorage.get<ShopSale[]>('shop_sales') || [];
    }
  },

  async create(sale: Omit<ShopSale, 'id' | 'created_at'>): Promise<ShopSale> {
    if (!isOnline()) {
      return offlineCreate<ShopSale>('shop_sales', sale);
    }
    const { data, error } = await supabase.from('shop_sales').insert(sale).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, sale: Partial<ShopSale>): Promise<ShopSale> {
    if (!isOnline()) {
      return offlineUpdate<ShopSale>('shop_sales', id, sale);
    }
    const { data, error } = await supabase.from('shop_sales').update(sale).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<ShopSale>('shop_sales', id);
      addToTombstone('shop_sales', id);
      return;
    }
    const { error } = await supabase.from('shop_sales').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<ShopSale>('shop_sales', id);
    addToTombstone('shop_sales', id);
  }
};

// Customers
export const customersService = {
  async getAll(): Promise<Customer[]> {
    if (!isOnline()) {
      return offlineStorage.get<Customer[]>('customers') || [];
    }
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, prices:customer_prices(*)')
        .order('name');
      if (error) throw error;
      const merged = mergeWithLocal<Customer>('customers', data);
      offlineStorage.set('customers', merged);
      return merged;
    } catch {
      return offlineStorage.get<Customer[]>('customers') || [];
    }
  },

  async create(customer: Omit<Customer, 'id' | 'created_at' | 'prices'>): Promise<Customer> {
    if (!isOnline()) {
      const defaultPrices: CustomerPrice[] = [
        { id: uuidv4(), customer_id: '', product_type: 'vrac', box_size: null, unit_label: 'kg', unit_price: 1800, created_at: new Date().toISOString() },
        { id: uuidv4(), customer_id: '', product_type: 'boite20', box_size: 20, unit_label: 'boîte', unit_price: 1100, created_at: new Date().toISOString() },
        { id: uuidv4(), customer_id: '', product_type: 'boite10', box_size: 10, unit_label: 'boîte', unit_price: 600, created_at: new Date().toISOString() },
        { id: uuidv4(), customer_id: '', product_type: 'boite6', box_size: 6, unit_label: 'boîte', unit_price: 400, created_at: new Date().toISOString() },
        { id: uuidv4(), customer_id: '', product_type: 'magasin', box_size: null, unit_label: 'pcs', unit_price: 40, created_at: new Date().toISOString() },
      ];
      const newCustomer = offlineCreate<Customer>('customers', customer);
      defaultPrices.forEach(p => { p.customer_id = newCustomer.id; });
      const allPrices = offlineStorage.get<CustomerPrice[]>('customer_prices') || [];
      allPrices.push(...defaultPrices);
      offlineStorage.set('customer_prices', allPrices);
      return { ...newCustomer, prices: defaultPrices };
    }
    const { data, error } = await supabase.from('customers').insert(customer).select().single();
    if (error) throw error;
    const defaultPrices = [
      { product_type: 'vrac', box_size: null, unit_label: 'kg', unit_price: 1800 },
      { product_type: 'boite20', box_size: 20, unit_label: 'boîte', unit_price: 1100 },
      { product_type: 'boite10', box_size: 10, unit_label: 'boîte', unit_price: 600 },
      { product_type: 'boite6', box_size: 6, unit_label: 'boîte', unit_price: 400 },
      { product_type: 'magasin', box_size: null, unit_label: 'pcs', unit_price: 40 },
    ];
    const pricesToInsert = defaultPrices.map(p => ({ ...p, customer_id: data.id }));
    const { data: insertedPrices, error: pricesError } = await supabase
      .from('customer_prices')
      .insert(pricesToInsert)
      .select();
    if (pricesError) console.error('Failed to create default prices:', pricesError);
    return { ...data, prices: insertedPrices || [] };
  },

  async update(id: string, customer: Partial<Omit<Customer, 'prices'>>): Promise<Customer> {
    if (!isOnline()) {
      return offlineUpdate<Customer>('customers', id, customer);
    }
    const { data, error } = await supabase.from('customers').update(customer).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<Customer>('customers', id);
      addToTombstone('customers', id);
      const prices = offlineStorage.get<CustomerPrice[]>('customer_prices') || [];
      offlineStorage.set('customer_prices', prices.filter(p => p.customer_id !== id));
      return;
    }
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<Customer>('customers', id);
    addToTombstone('customers', id);
  }
};

// Customer Prices
export const customerPricesService = {
  async upsert(customer_id: string, box_size: number, unit_price: number): Promise<CustomerPrice> {
    const product_type = 'boite' + box_size;
    if (!isOnline()) {
      const prices = offlineStorage.get<CustomerPrice[]>('customer_prices') || [];
      const idx = prices.findIndex(p => p.customer_id === customer_id && p.box_size === box_size);
      if (idx >= 0) {
        prices[idx] = { ...prices[idx], unit_price, unit_label: 'boîte' };
        offlineStorage.set('customer_prices', prices);
        return prices[idx];
      }
      const newPrice: CustomerPrice = {
        id: uuidv4(), customer_id, box_size, product_type,
        unit_price, unit_label: 'boîte', created_at: new Date().toISOString()
      };
      prices.push(newPrice);
      offlineStorage.set('customer_prices', prices);
      return newPrice;
    }
    const { data, error } = await supabase
      .from('customer_prices')
      .upsert({ customer_id, box_size, product_type, unit_price, unit_label: 'boîte' }, { onConflict: 'customer_id,box_size' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async upsertByType(customer_id: string, product_type: string, unit_price: number, unit_label?: string): Promise<CustomerPrice> {
    if (!isOnline()) {
      const prices = offlineStorage.get<CustomerPrice[]>('customer_prices') || [];
      const idx = prices.findIndex(p => p.customer_id === customer_id && p.product_type === product_type);
      if (idx >= 0) {
        prices[idx] = { ...prices[idx], unit_price, unit_label: unit_label || prices[idx].unit_label || 'pcs' };
        offlineStorage.set('customer_prices', prices);
        return prices[idx];
      }
      const newPrice: CustomerPrice = {
        id: uuidv4(), customer_id, product_type,
        unit_price, unit_label: unit_label || 'pcs', created_at: new Date().toISOString()
      };
      prices.push(newPrice);
      offlineStorage.set('customer_prices', prices);
      return newPrice;
    }
    const { data, error } = await supabase
      .from('customer_prices')
      .upsert({ customer_id, product_type, unit_price, unit_label: unit_label || 'pcs' }, { onConflict: 'customer_id,product_type' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getByCustomer(customerId: string): Promise<CustomerPrice[]> {
    if (!isOnline()) {
      const prices = offlineStorage.get<CustomerPrice[]>('customer_prices') || [];
      return prices.filter(p => p.customer_id === customerId);
    }
    const { data, error } = await supabase
      .from('customer_prices')
      .select('*')
      .eq('customer_id', customerId);
    if (error) throw error;
    return data || [];
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<CustomerPrice>('customer_prices', id);
      addToTombstone('customer_prices', id);
      return;
    }
    const { error } = await supabase.from('customer_prices').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<CustomerPrice>('customer_prices', id);
    addToTombstone('customer_prices', id);
  }
};

export const customerProductsService = {
  async getByCustomer(customerId: string): Promise<CustomerProduct[]> {
    if (!isOnline()) {
      const products = offlineStorage.get<CustomerProduct[]>('customer_products') || [];
      return products.filter(p => p.customer_id === customerId);
    }
    try {
      const { data, error } = await supabase
        .from('customer_products')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch {
      const products = offlineStorage.get<CustomerProduct[]>('customer_products') || [];
      return products.filter(p => p.customer_id === customerId);
    }
  },

  async create(payload: Omit<CustomerProduct, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerProduct> {
    if (!isOnline()) {
      return offlineCreate<CustomerProduct>('customer_products', { ...payload, updated_at: new Date().toISOString() });
    }
    const { data, error } = await supabase
      .from('customer_products')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Omit<CustomerProduct, 'id' | 'created_at' | 'updated_at'>>): Promise<CustomerProduct> {
    if (!isOnline()) {
      return offlineUpdate<CustomerProduct>('customer_products', id, { ...updates, updated_at: new Date().toISOString() });
    }
    const { data, error } = await supabase
      .from('customer_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<CustomerProduct>('customer_products', id);
      addToTombstone('customer_products', id);
      return;
    }
    const { error } = await supabase.from('customer_products').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<CustomerProduct>('customer_products', id);
    addToTombstone('customer_products', id);
  }
};

export const fiscalInfoService = {
  async get(): Promise<FiscalInfo | null> {
    const local = offlineStorage.get<FiscalInfo>('fiscal_info');
    if (!isOnline()) return local;
    try {
      const { data, error } = await supabase.from('company_fiscal_info').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (data) offlineStorage.set('fiscal_info', data);
      return data;
    } catch {
      return local;
    }
  },

  async update(id: string, updates: Partial<Omit<FiscalInfo, 'id' | 'created_at' | 'updated_at'>>): Promise<FiscalInfo> {
    const current = offlineStorage.get<FiscalInfo>('fiscal_info');
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() } as FiscalInfo;
    offlineStorage.set('fiscal_info', updated);
    if (!isOnline()) return updated;
    try {
      const { data, error } = await supabase.from('company_fiscal_info').update(updates).eq('id', id).select().single();
      if (error) throw error;
      offlineStorage.set('fiscal_info', data);
      return data;
    } catch {
      return updated;
    }
  },

  async upsert(info: Partial<Omit<FiscalInfo, 'id' | 'created_at' | 'updated_at'>>): Promise<FiscalInfo> {
    const existing = await this.get();
    if (existing) {
      return this.update(existing.id, info);
    }
    const newInfo = { ...info, id: uuidv4(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as FiscalInfo;
    offlineStorage.set('fiscal_info', newInfo);
    if (!isOnline()) return newInfo;
    try {
      const { data, error } = await supabase.from('company_fiscal_info').insert(info).select().single();
      if (error) throw error;
      offlineStorage.set('fiscal_info', data);
      return data;
    } catch {
      return newInfo;
    }
  }
};

export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    if (!isOnline()) {
      return offlineStorage.get<Supplier[]>('suppliers') || [];
    }
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
      if (error) throw error;
      const merged = mergeWithLocal<Supplier>('suppliers', data || []);
      offlineStorage.set('suppliers', merged);
      return merged;
    } catch {
      return offlineStorage.get<Supplier[]>('suppliers') || [];
    }
  },

  async create(payload: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    if (!isOnline()) {
      return offlineCreate<Supplier>('suppliers', payload);
    }
    const { data, error } = await supabase.from('suppliers').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Omit<Supplier, 'id' | 'created_at'>>): Promise<Supplier> {
    if (!isOnline()) {
      return offlineUpdate<Supplier>('suppliers', id, updates);
    }
    const { data, error } = await supabase.from('suppliers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<Supplier>('suppliers', id);
      addToTombstone('suppliers', id);
      return;
    }
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<Supplier>('suppliers', id);
    addToTombstone('suppliers', id);
  }
};

export const supplierPurchasesService = {
  async getBySupplier(supplierId: string): Promise<SupplierPurchase[]> {
    if (!isOnline()) {
      const purchases = offlineStorage.get<SupplierPurchase[]>('supplier_purchases') || [];
      return purchases.filter(p => p.supplier_id === supplierId);
    }
    try {
      const { data, error } = await supabase.from('supplier_purchases').select('*').eq('supplier_id', supplierId).order('purchase_date', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch {
      const purchases = offlineStorage.get<SupplierPurchase[]>('supplier_purchases') || [];
      return purchases.filter(p => p.supplier_id === supplierId);
    }
  },

  async create(payload: Omit<SupplierPurchase, 'id' | 'created_at'>): Promise<SupplierPurchase> {
    if (!isOnline()) {
      return offlineCreate<SupplierPurchase>('supplier_purchases', payload);
    }
    const { data, error } = await supabase.from('supplier_purchases').insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Omit<SupplierPurchase, 'id' | 'created_at'>>): Promise<SupplierPurchase> {
    if (!isOnline()) {
      return offlineUpdate<SupplierPurchase>('supplier_purchases', id, updates);
    }
    const { data, error } = await supabase.from('supplier_purchases').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<SupplierPurchase>('supplier_purchases', id);
      addToTombstone('supplier_purchases', id);
      return;
    }
    const { error } = await supabase.from('supplier_purchases').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<SupplierPurchase>('supplier_purchases', id);
    addToTombstone('supplier_purchases', id);
  }
};

// Production Materials (raw materials used per batch)
export const productionMaterialsService = {
  async getByBatch(batchId: string): Promise<ProductionMaterial[]> {
    if (!isOnline()) {
      const all = offlineStorage.get<ProductionMaterial[]>('production_materials') || [];
      return all.filter(m => m.batch_id === batchId);
    }
    try {
      const { data, error } = await supabase
        .from('production_materials')
        .select('*, material:raw_materials(*)')
        .eq('batch_id', batchId);
      if (error) throw error;
      return data || [];
    } catch {
      const all = offlineStorage.get<ProductionMaterial[]>('production_materials') || [];
      return all.filter(m => m.batch_id === batchId);
    }
  },

  async create(item: Omit<ProductionMaterial, 'id' | 'created_at'>): Promise<ProductionMaterial> {
    if (!isOnline()) {
      return offlineCreate<ProductionMaterial>('production_materials', item);
    }
    const { data, error } = await supabase.from('production_materials').insert(item).select().single();
    if (error) throw error;
    return data;
  },

  async deleteByBatch(batchId: string): Promise<void> {
    if (!isOnline()) {
      const all = offlineStorage.get<ProductionMaterial[]>('production_materials') || [];
      offlineStorage.set('production_materials', all.filter(m => m.batch_id !== batchId));
      return;
    }
    const { error } = await supabase.from('production_materials').delete().eq('batch_id', batchId);
    if (error) throw error;
    const pmAll = offlineStorage.get<ProductionMaterial[]>('production_materials') || [];
    offlineStorage.set('production_materials', pmAll.filter(m => m.batch_id !== batchId));
  }
};

// Orders (dashboard command tracking)
export const ordersService = {
  async getAll(): Promise<Order[]> {
    if (!isOnline()) {
      return offlineStorage.get<Order[]>('orders') || [];
    }
    try {
      const { data, error } = await supabase.from('orders').select('*').order('expected_date', { ascending: true });
      if (error) throw error;
      const merged = mergeWithLocal<Order>('orders', data);
      offlineStorage.set('orders', merged);
      return merged;
    } catch {
      return offlineStorage.get<Order[]>('orders') || [];
    }
  },

  async create(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    if (!isOnline()) {
      return offlineCreate<Order>('orders', order);
    }
    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Order>): Promise<Order> {
    if (!isOnline()) {
      return offlineUpdate<Order>('orders', id, updates);
    }
    const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!isOnline()) {
      offlineDelete<Order>('orders', id);
      addToTombstone('orders', id);
      return;
    }
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    purgeFromLocal<Order>('orders', id);
    addToTombstone('orders', id);
  }
};

// Reset sales and purchases (admin only)
export const resetDataService = {
  async resetSalesAndPurchases(): Promise<void> {
    const tables = ['sales', 'material_purchases', 'bulk_sales', 'shop_sales', 'supplier_purchases'];
    if (!isOnline()) {
      for (const table of tables) {
        const existing = offlineStorage.get<{ id: string }[]>(table) || [];
        const tomb = new Set(existing.map(i => i.id));
        offlineStorage.set('deleted_' + table, [...tomb]);
        offlineStorage.set(table, []);
      }
      return;
    }
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      const existing = offlineStorage.get<{ id: string }[]>(table) || [];
      const tomb = new Set(existing.map(i => i.id));
      offlineStorage.set('deleted_' + table, [...tomb]);
      offlineStorage.set(table, []);
    }
  }
};
