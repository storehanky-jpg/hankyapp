import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  RawMaterial, MaterialPurchase, FixedCharge, VariableExpense,
  Utility, LaborCost, Packaging, ProductionBatch, Sale, UnsoldProduct,
  CompanySettings, DashboardStats, BulkSale, RecipeConfig, RecipeItem, ShopSale,
  Customer
} from '../types';
import * as api from '../services/api';
import { offlineStorage } from '../lib/storage';

interface AppState {
  rawMaterials: RawMaterial[];
  materialPurchases: MaterialPurchase[];
  fixedCharges: FixedCharge[];
  variableExpenses: VariableExpense[];
  utilities: Utility[];
  laborCosts: LaborCost[];
  packaging: Packaging[];
  productionBatches: ProductionBatch[];
  sales: Sale[];
  unsoldProducts: UnsoldProduct[];
  bulkSales: BulkSale[];
  shopSales: ShopSale[];
  customers: Customer[];
  recipeConfig: RecipeConfig | null;
  recipeItems: RecipeItem[];
  settings: CompanySettings | null;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  refreshAll: () => Promise<void>;
  setRawMaterials: (materials: RawMaterial[]) => void;
  setMaterialPurchases: (purchases: MaterialPurchase[]) => void;
  setFixedCharges: (charges: FixedCharge[]) => void;
  setVariableExpenses: (expenses: VariableExpense[]) => void;
  setUtilities: (utilities: Utility[]) => void;
  setLaborCosts: (costs: LaborCost[]) => void;
  setPackaging: (packaging: Packaging[]) => void;
  setProductionBatches: (batches: ProductionBatch[]) => void;
  setSales: (sales: Sale[]) => void;
  setUnsoldProducts: (unsold: UnsoldProduct[]) => void;
  setBulkSales: (sales: BulkSale[]) => void;
  setShopSales: (sales: ShopSale[]) => void;
  setCustomers: (customers: Customer[]) => void;
  setRecipeConfig: (config: RecipeConfig) => void;
  setRecipeItems: (items: RecipeItem[]) => void;
  setSettings: (settings: CompanySettings) => void;
  calculateDashboardStats: () => DashboardStats;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    rawMaterials: [],
    materialPurchases: [],
    fixedCharges: [],
    variableExpenses: [],
    utilities: [],
    laborCosts: [],
    packaging: [],
    productionBatches: [],
    sales: [],
    unsoldProducts: [],
    bulkSales: [],
    shopSales: [],
    customers: [],
    recipeConfig: null,
    recipeItems: [],
    settings: null,
    isLoading: true,
    isOnline: navigator.onLine,
    error: null
  });

  const refreshAll = useCallback(async () => {
    // ── Show cached data instantly while network loads in background ──
    const cachedRawMaterials = offlineStorage.get<RawMaterial[]>('raw_materials') || [];
    const cachedMaterialPurchases = offlineStorage.get<MaterialPurchase[]>('material_purchases') || [];
    const cachedFixedCharges = offlineStorage.get<FixedCharge[]>('fixed_charges') || [];
    const cachedVariableExpenses = offlineStorage.get<VariableExpense[]>('variable_expenses') || [];
    const cachedUtilities = offlineStorage.get<Utility[]>('utilities') || [];
    const cachedLaborCosts = offlineStorage.get<LaborCost[]>('labor_costs') || [];
    const cachedPackaging = offlineStorage.get<Packaging[]>('packaging') || [];
    const cachedProductionBatches = offlineStorage.get<ProductionBatch[]>('production_batches') || [];
    const cachedSales = offlineStorage.get<Sale[]>('sales') || [];
    const cachedUnsoldProducts = offlineStorage.get<UnsoldProduct[]>('unsold_products') || [];
    const cachedBulkSales = offlineStorage.get<BulkSale[]>('bulk_sales') || [];
    const cachedShopSales = offlineStorage.get<ShopSale[]>('shop_sales') || [];
    const cachedCustomers = offlineStorage.get<Customer[]>('customers') || [];
    const cachedRecipeConfig = offlineStorage.get<RecipeConfig>('recipe_config');
    const cachedRecipeItems = offlineStorage.get<RecipeItem[]>('recipe_items') || [];
    const cachedSettings = offlineStorage.get<CompanySettings>('settings');

    const hasCachedData = cachedSales.length > 0 || cachedBulkSales.length > 0 || cachedRawMaterials.length > 0;

    if (hasCachedData) {
      setState(s => ({
        ...s,
        rawMaterials: cachedRawMaterials,
        materialPurchases: cachedMaterialPurchases,
        fixedCharges: cachedFixedCharges,
        variableExpenses: cachedVariableExpenses,
        utilities: cachedUtilities,
        laborCosts: cachedLaborCosts,
        packaging: cachedPackaging,
        productionBatches: cachedProductionBatches,
        sales: cachedSales,
        unsoldProducts: cachedUnsoldProducts,
        bulkSales: cachedBulkSales,
        shopSales: cachedShopSales,
        customers: cachedCustomers,
        recipeConfig: cachedRecipeConfig || s.recipeConfig,
        recipeItems: cachedRecipeItems,
        settings: cachedSettings || s.settings,
        isLoading: false,
        isOnline: navigator.onLine,
        error: null
      }));
    } else {
      setState(s => ({ ...s, isLoading: true, error: null }));
    }

    // ── Fetch fresh data from network in background ──
    try {
      const withTimeout = <T,>(p: Promise<T>): Promise<T> =>
        Promise.race([
          p,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
        ]);

      const [
        rawMaterials,
        materialPurchases,
        fixedCharges,
        variableExpenses,
        utilities,
        laborCosts,
        packaging,
        productionBatches,
        sales,
        unsoldProducts,
        bulkSales,
        shopSales,
        customers,
        recipeConfig,
        recipeItems,
        settings
      ] = await Promise.all([
        withTimeout(api.rawMaterialsService.getAll()).catch(() => cachedRawMaterials),
        withTimeout(api.materialPurchasesService.getAll()).catch(() => cachedMaterialPurchases),
        withTimeout(api.fixedChargesService.getAll()).catch(() => cachedFixedCharges),
        withTimeout(api.variableExpensesService.getAll()).catch(() => cachedVariableExpenses),
        withTimeout(api.utilitiesService.getAll()).catch(() => cachedUtilities),
        withTimeout(api.laborCostsService.getAll()).catch(() => cachedLaborCosts),
        withTimeout(api.packagingService.getAll()).catch(() => cachedPackaging),
        withTimeout(api.productionBatchService.getAll()).catch(() => cachedProductionBatches),
        withTimeout(api.salesService.getAll()).catch(() => cachedSales),
        withTimeout(api.unsoldProductsService.getAll()).catch(() => cachedUnsoldProducts),
        withTimeout(api.bulkSalesService.getAll()).catch(() => cachedBulkSales),
        withTimeout(api.shopSalesService.getAll()).catch(() => cachedShopSales),
        withTimeout(api.customersService.getAll()).catch(() => cachedCustomers),
        withTimeout(api.recipeConfigService.get()).catch(() => cachedRecipeConfig || { id: 'default', name: 'Macaron Classique', batch_size_kg: 1, created_at: new Date().toISOString() }),
        withTimeout(api.recipeItemsService.getAll()).catch(() => cachedRecipeItems),
        withTimeout(api.settingsService.get()).catch(() => cachedSettings || { id: 'default', company_name: 'Hanky Macarons', currency: 'DZD', profit_margin: 30, created_at: new Date().toISOString() })
      ]);

      setState({
        rawMaterials,
        materialPurchases,
        fixedCharges,
        variableExpenses,
        utilities,
        laborCosts,
        packaging,
        productionBatches,
        sales,
        unsoldProducts,
        bulkSales,
        shopSales,
        customers,
        recipeConfig,
        recipeItems,
        settings,
        isLoading: false,
        isOnline: navigator.onLine,
        error: null
      });
    } catch (error) {
      setState(s => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      }));
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const handleOnline = () => {
      setState(s => ({ ...s, isOnline: true }));
      refreshAll();
    };
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshAll]);

  const calculateDashboardStats = useCallback((): DashboardStats => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const salesToday = state.sales.filter(s => s.sale_date === today);
    const salesThisMonth = state.sales.filter(s => {
      const date = new Date(s.sale_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const totalSalesToday = salesToday.reduce((sum, s) => sum + s.total_amount, 0);
    const totalSalesMonth = salesThisMonth.reduce((sum, s) => sum + s.total_amount, 0);

    const purchasesThisMonth = state.materialPurchases.filter(p => {
      const date = new Date(p.purchase_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    const totalPurchasesMonth = purchasesThisMonth.reduce((sum, p) => sum + p.total_cost, 0);

    // Calculate production cost per kg
    const totalMaterialCost = state.rawMaterials.reduce((sum, m) => sum + m.unit_cost, 0);
    const productionCostPerKg = totalMaterialCost > 0 ? totalMaterialCost : 0;

    // Calculate boxes sold by size
    const boxesSold: { size: number; count: number }[] = [];
    const sizeCounts: Record<number, number> = {};
    salesThisMonth.forEach(s => {
      sizeCounts[s.box_size] = (sizeCounts[s.box_size] || 0) + s.quantity;
    });
    Object.entries(sizeCounts).forEach(([size, count]) => {
      boxesSold.push({ size: parseInt(size), count });
    });

    // Calculate profits
    const fixedChargesMonthly = state.fixedCharges
      .filter(c => c.is_active)
      .reduce((sum, c) => {
        switch (c.frequency) {
          case 'daily': return sum + c.amount * 30;
          case 'weekly': return sum + c.amount * 4;
          case 'monthly': return sum + c.amount;
          case 'yearly': return sum + c.amount / 12;
          default: return sum;
        }
      }, 0);

    const variableExpensesMonth = state.variableExpenses
      .filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const utilitiesMonth = state.utilities
      .filter(u => {
        const start = new Date(u.period_start);
        const end = new Date(u.period_end);
        return (start.getMonth() === currentMonth || end.getMonth() === currentMonth) &&
               (start.getFullYear() === currentYear || end.getFullYear() === currentYear);
      })
      .reduce((sum, u) => sum + u.amount, 0);

    const laborMonth = state.laborCosts
      .filter(l => l.period_month === currentMonth + 1 && l.period_year === currentYear)
      .reduce((sum, l) => sum + l.total_cost, 0);

    const totalExpensesMonth = fixedChargesMonthly + variableExpensesMonth + utilitiesMonth + laborMonth + totalPurchasesMonth;
    const profitMonth = totalSalesMonth - totalExpensesMonth;
    const profitToday = totalSalesToday - (totalExpensesMonth ? totalExpensesMonth / 30 : 0);

    return {
      totalSalesToday,
      totalSalesMonth,
      totalPurchasesMonth,
      profitToday,
      profitMonth,
      productionCostPerKg,
      boxesSold,
      recentSales: state.sales.slice(0, 10)
    };
  }, [state]);

  const contextValue: AppContextType = {
    ...state,
    refreshAll,
    setRawMaterials: (rawMaterials) => setState(s => ({ ...s, rawMaterials })),
    setMaterialPurchases: (materialPurchases) => setState(s => ({ ...s, materialPurchases })),
    setFixedCharges: (fixedCharges) => setState(s => ({ ...s, fixedCharges })),
    setVariableExpenses: (variableExpenses) => setState(s => ({ ...s, variableExpenses })),
    setUtilities: (utilities) => setState(s => ({ ...s, utilities })),
    setLaborCosts: (laborCosts) => setState(s => ({ ...s, laborCosts })),
    setPackaging: (packaging) => setState(s => ({ ...s, packaging })),
    setProductionBatches: (productionBatches) => setState(s => ({ ...s, productionBatches })),
    setSales: (sales) => setState(s => ({ ...s, sales })),
    setUnsoldProducts: (unsoldProducts) => setState(s => ({ ...s, unsoldProducts })),
    setBulkSales: (bulkSales) => setState(s => ({ ...s, bulkSales })),
    setShopSales: (shopSales) => setState(s => ({ ...s, shopSales })),
    setCustomers: (customers) => setState(s => ({ ...s, customers })),
    setRecipeConfig: (recipeConfig) => setState(s => ({ ...s, recipeConfig })),
    setRecipeItems: (recipeItems) => setState(s => ({ ...s, recipeItems })),
    setSettings: (settings) => setState(s => ({ ...s, settings })),
    calculateDashboardStats,
    clearError: () => setState(s => ({ ...s, error: null }))
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
