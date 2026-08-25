import React, { useState, useMemo } from 'react';
import { Calculator, Package, DollarSign, TrendingUp, ChefHat, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function PricingPage() {
  const { rawMaterials, fixedCharges, variableExpenses, utilities, laborCosts, packaging, settings } = useApp();

  // Recipe configuration (grams per 1 kg of macarons)
  const [recipeConfig, setRecipeConfig] = useState<Record<string, number>>({});

  // Calculate production cost
  const [productionKg, setProductionKg] = useState(1);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate monthly costs
  const fixedChargesMonthly = useMemo(() => {
    return fixedCharges
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
  }, [fixedCharges]);

  const variableExpensesMonthly = useMemo(() => {
    return variableExpenses
      .filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [variableExpenses]);

  const utilitiesMonthly = useMemo(() => {
    return utilities
      .filter(u => {
        const start = new Date(u.period_start);
        return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
      })
      .reduce((sum, u) => sum + u.amount, 0);
  }, [utilities]);

  const laborMonthly = useMemo(() => {
    return laborCosts
      .filter(l => l.period_month === currentMonth + 1 && l.period_year === currentYear)
      .reduce((sum, l) => sum + l.total_cost, 0);
  }, [laborCosts]);

  const totalMonthlyCharges = fixedChargesMonthly + variableExpensesMonthly + utilitiesMonthly + laborMonthly;

  // Calculate raw material cost per kg
  const rawMaterialCostPerKg = useMemo(() => {
    return rawMaterials.reduce((sum, m) => {
      const quantity = recipeConfig[m.id] || 0;
      return sum + (m.unit_cost * quantity / 1000); // assuming quantities in grams
    }, 0);
  }, [rawMaterials, recipeConfig]);

  // Calculate packaging costs
  const packagingCosts: Record<number, number> = useMemo(() => {
    const costs: Record<number, number> = {};
    packaging.forEach(p => {
      costs[p.box_size] = p.unit_cost;
    });
    // Default costs if not set
    [6, 10, 12, 20, 24].forEach(size => {
      if (!costs[size]) {
        costs[size] = size === 6 ? 30 : size === 10 ? 40 : size === 20 ? 60 : size === 12 ? 45 : 70;
      }
    });
    return costs;
  }, [packaging]);

  // Piece weight (grams per macaron)
  const macaronWeight = 15; // 15g per macaron

  // Calculate cost per box
  const calculateBoxCost = (boxSize: number): {
    rawMaterialCost: number;
    packagingCost: number;
    overheadCost: number;
    totalCost: number;
    suggestedPrice: number;
    margin: number;
  } => {
    const boxWeightKg = (boxSize * macaronWeight) / 1000;
    const rawMaterialCost = rawMaterialCostPerKg * boxWeightKg;

    // Overhead cost per box (based on monthly production estimate)
    const estimatedMonthlyProduction = 100; // kg
    const overheadPerKg = totalMonthlyCharges / estimatedMonthlyProduction;
    const overheadCost = overheadPerKg * boxWeightKg;

    const pkgCost = packagingCosts[boxSize] || 50;
    const totalCost = rawMaterialCost + pkgCost + overheadCost;

    const marginPercent = settings?.profit_margin || 30;
    const suggestedPrice = totalCost * (1 + marginPercent / 100);
    const margin = suggestedPrice - totalCost;

    return {
      rawMaterialCost,
      packagingCost: pkgCost,
      overheadCost,
      totalCost,
      suggestedPrice,
      margin
    };
  };

  // Box sizes to calculate
  const boxSizes = [6, 10, 12, 20, 24];

  // Custom price calculator
  const [customBoxSize, setCustomBoxSize] = useState(10);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customMargin, setCustomMargin] = useState(settings?.profit_margin || 30);

  const customCalculation = useMemo(() => {
    const singleBox = calculateBoxCost(customBoxSize);
    return {
      singleBox,
      total: {
        cost: singleBox.totalCost * customQuantity,
        price: singleBox.totalCost * customQuantity * (1 + customMargin / 100)
      }
    };
  }, [customBoxSize, customQuantity, customMargin, rawMaterialCostPerKg, totalMonthlyCharges, packagingCosts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calculateur de Prix</h1>
        <p className="text-gray-500">Calcul du prix de revient et des marges</p>
      </div>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Package size={24} />
            <span className="text-sm text-white/80">Coût Matières/kG</span>
          </div>
          <p className="text-3xl font-bold">{rawMaterialCostPerKg.toLocaleString()} DZD</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} />
            <span className="text-sm text-white/80">Charges Mensuelles</span>
          </div>
          <p className="text-3xl font-bold">{totalMonthlyCharges.toLocaleString()} DZD</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} />
            <span className="text-sm text-white/80">Marge Configurée</span>
          </div>
          <p className="text-3xl font-bold">{settings?.profit_margin || 30}%</p>
        </div>
      </div>

      {/* Recipe Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChefHat size={20} className="text-amber-500" />
          Configuration de la Recette (pour 1 kg)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rawMaterials.map(material => (
            <div key={material.id} className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">{material.name}</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={recipeConfig[material.id] || 0}
                    onChange={e => setRecipeConfig(prev => ({
                      ...prev,
                      [material.id]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-24 px-2 py-1 border rounded-lg text-sm"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500">g</span>
                  <span className="text-xs text-gray-400">
                    ({material.unit_cost.toLocaleString()} DZD/{material.unit})
                  </span>
                </div>
              </div>
            </div>
          ))}
          {rawMaterials.length === 0 && (
            <p className="col-span-full text-gray-400 text-center py-4">
              Aucune matière première enregistrée. Ajoutez des matières premières pour calculer les coûts.
            </p>
          )}
        </div>
      </div>

      {/* Box Pricing Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator size={20} className="text-amber-500" />
            Prix de Revient par Boîte
          </h2>
          <p className="text-sm text-gray-500 mt-1">Basé sur {macaronWeight}g par macaron</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Boîte</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Poids</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Matières</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Emballage</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Charges</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Coût Total</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix Suggéré</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Marge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {boxSizes.map(size => {
                const calc = calculateBoxCost(size);
                return (
                  <tr key={size} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                        {size} pcs
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {(size * macaronWeight)}g
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {calc.rawMaterialCost.toFixed(0)} DZD
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {calc.packagingCost.toFixed(0)} DZD
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {calc.overheadCost.toFixed(0)} DZD
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {calc.totalCost.toFixed(0)} DZD
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-600 font-bold">
                        {calc.suggestedPrice.toFixed(0)} DZD
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                        +{calc.margin.toFixed(0)} DZD
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Calculator */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator size={20} />
          Calculateur Personnalisé
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Taille de boîte</label>
            <select
              value={customBoxSize}
              onChange={e => setCustomBoxSize(parseInt(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border-0 text-gray-900"
            >
              {boxSizes.map(s => (
                <option key={s} value={s}>{s} pièces</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-1">Quantité</label>
            <input
              type="number"
              min="1"
              value={customQuantity}
              onChange={e => setCustomQuantity(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border-0 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm text-white/80 mb-1">Marge souhaitée (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={customMargin}
              onChange={e => setCustomMargin(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border-0 text-gray-900"
            />
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-sm text-white/80">Prix de vente</p>
            <p className="text-2xl font-bold">{customCalculation.total.price.toFixed(0)} DZD</p>
            <p className="text-xs text-white/60">Coût: {customCalculation.total.cost.toFixed(0)} DZD</p>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info size={20} className="text-blue-500" />
          Répartition des Charges Mensuelles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Charges Fixes</p>
            <p className="text-xl font-bold text-blue-700">{fixedChargesMonthly.toLocaleString()} DZD</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-amber-600">Dép. Variables</p>
            <p className="text-xl font-bold text-amber-700">{variableExpensesMonthly.toLocaleString()} DZD</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600">Gaz/Électricité</p>
            <p className="text-xl font-bold text-orange-700">{utilitiesMonthly.toLocaleString()} DZD</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Main d'œuvre</p>
            <p className="text-xl font-bold text-purple-700">{laborMonthly.toLocaleString()} DZD</p>
          </div>
        </div>
      </div>
    </div>
  );
}
