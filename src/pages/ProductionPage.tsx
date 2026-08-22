import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ChefHat, AlertTriangle, Package, X, Calculator, Edit2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';

// Default coque recipe (g per batch)
const DEFAULT_COQUE: { name: string; qty: number }[] = [
  { name: 'Amandes en poudre', qty: 100 },
  { name: 'Sucre glace', qty: 100 },
  { name: "Blancs d'oeufs", qty: 100 },
  { name: 'Sucre en poudre', qty: 100 },
  { name: 'Eau', qty: 35 },
];

const DEFAULT_GANACHE_PER_KG = 450; // g ganache per kg coques (200+100+150)

interface CostLine {
  name: string;
  qtyG: number;
  pricePerKg: number;
}

export default function ProductionPage() {
  const {
    productionBatches, setProductionBatches,
    unsoldProducts, setUnsoldProducts,
    recipeItems, rawMaterials
  } = useApp();

  const [activeTab, setActiveTab] = useState<'batches' | 'unsold' | 'cost'>('batches');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showUnsoldModal, setShowUnsoldModal] = useState(false);
  const [editBatch, setEditBatch] = useState<string | null>(null);

  const [batchForm, setBatchForm] = useState({
    batch_date: format(new Date(), 'yyyy-MM-dd'),
    planned_quantity: 0,
    produced_quantity: 0,
    lost_quantity: 0,
    notes: ''
  });

  const [unsoldForm, setUnsoldForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    quantity: 0,
    reason: ''
  });

  // Cost calculator state
  const coqueRecipeItems = useMemo(() =>
    recipeItems.filter(i => !i.recipe_type || i.recipe_type === 'coque'),
    [recipeItems]);

  const ganacheRecipeItems = useMemo(() =>
    recipeItems.filter(i => i.recipe_type === 'ganache'),
    [recipeItems]);

  // Build initial cost lines from recipe or defaults
  const initialCostLines = useMemo((): CostLine[] => {
    if (coqueRecipeItems.length > 0) {
      return coqueRecipeItems.map(item => {
        const mat = rawMaterials.find(m => m.id === item.material_id);
        return { name: mat?.name || 'Inconnu', qtyG: item.quantity_per_batch, pricePerKg: mat?.unit_cost ?? 0 };
      });
    }
    return DEFAULT_COQUE.map(d => {
      const mat = rawMaterials.find(m =>
        (m.name.toLowerCase().includes('amande') && d.name.includes('Amande')) ||
        (m.name.toLowerCase().includes('sucre glace') && d.name.includes('glace')) ||
        (m.name.toLowerCase().includes('sucre') && !m.name.toLowerCase().includes('glace') && d.name.includes('poudre')) ||
        (m.name.toLowerCase().includes('oeuf') && d.name.includes('oeufs')) ||
        (m.name.toLowerCase().includes('eau') && d.name === 'Eau')
      );
      return { name: d.name, qtyG: d.qty, pricePerKg: mat?.unit_cost ?? 0 };
    });
  }, [coqueRecipeItems, rawMaterials]);

  const [costLines, setCostLines] = useState<CostLine[]>([]);
  const [costMultiplier, setCostMultiplier] = useState(1);
  const [ganacheKg, setGanacheKg] = useState(0);
  const [ganachePricePerKg, setGanachePricePerKg] = useState(0);
  const [costInitialized, setCostInitialized] = useState(false);

  // Lazy-initialize cost lines when entering cost tab
  function initCostTab() {
    if (!costInitialized) {
      setCostLines(initialCostLines.map(l => ({ ...l, qtyG: l.qtyG * costMultiplier })));
      // Auto-set ganache defaults
      const ganacheTotal = ganacheRecipeItems.length > 0
        ? ganacheRecipeItems.reduce((s, i) => s + i.quantity_per_batch, 0)
        : DEFAULT_GANACHE_PER_KG;
      setGanacheKg((ganacheTotal * costMultiplier) / 1000);
      // Auto-price from ganache recipe
      const ganacheCostPerKg = ganacheRecipeItems.length > 0
        ? ganacheRecipeItems.reduce((s, i) => {
            const mat = rawMaterials.find(m => m.id === i.material_id);
            return s + (i.quantity_per_batch / 1000) * (mat?.unit_cost ?? 0);
          }, 0) / (ganacheRecipeItems.reduce((s, i) => s + i.quantity_per_batch, 0) / 1000 || 1)
        : 0;
      setGanachePricePerKg(ganacheCostPerKg);
      setCostInitialized(true);
    }
  }

  // When multiplier changes, scale quantities
  function handleMultiplierChange(val: number) {
    const prev = costMultiplier;
    setCostMultiplier(val);
    setCostLines(lines => lines.map(l => ({ ...l, qtyG: parseFloat(((l.qtyG / prev) * val).toFixed(1)) })));
    setGanacheKg(g => parseFloat(((g / prev) * val).toFixed(3)));
  }

  function updateCostLine(index: number, field: keyof CostLine, value: number | string) {
    setCostLines(lines => lines.map((l, i) => i === index ? { ...l, [field]: value } : l));
  }

  // Totals
  const coqueCost = costLines.reduce((s, l) => s + (l.qtyG / 1000) * l.pricePerKg, 0);
  const ganacheCost = ganacheKg * ganachePricePerKg;
  const totalCost = coqueCost + ganacheCost;
  const totalCoqueWeightG = costLines.reduce((s, l) => s + l.qtyG, 0);
  const macaronsCount = Math.round((totalCoqueWeightG / 1000) * 55);
  const costPerMacaron = macaronsCount > 0 ? totalCost / macaronsCount : 0;
  const costPerKg = totalCoqueWeightG > 0 ? (totalCost / (totalCoqueWeightG / 1000)) : 0;

  // --- Batch handlers ---
  const openBatchModal = (batch?: typeof productionBatches[0]) => {
    if (batch) {
      setEditBatch(batch.id);
      setBatchForm({
        batch_date: batch.batch_date,
        planned_quantity: batch.planned_quantity,
        produced_quantity: batch.produced_quantity,
        lost_quantity: batch.lost_quantity,
        notes: batch.notes || ''
      });
    } else {
      setEditBatch(null);
      setBatchForm({ batch_date: format(new Date(), 'yyyy-MM-dd'), planned_quantity: 0, produced_quantity: 0, lost_quantity: 0, notes: '' });
    }
    setShowBatchModal(true);
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editBatch) {
        const updated = await api.productionBatchService.update(editBatch, batchForm);
        setProductionBatches(productionBatches.map(b => b.id === editBatch ? updated : b));
      } else {
        const newBatch = await api.productionBatchService.create(batchForm);
        setProductionBatches([newBatch, ...productionBatches]);
      }
      setShowBatchModal(false);
    } catch (error) {
      console.error('Error saving batch:', error);
    }
  };

  const handleUnsoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUnsold = await api.unsoldProductsService.create(unsoldForm);
      setUnsoldProducts([newUnsold, ...unsoldProducts]);
      setShowUnsoldModal(false);
      setUnsoldForm({ date: format(new Date(), 'yyyy-MM-dd'), quantity: 0, reason: '' });
    } catch (error) {
      console.error('Error saving unsold:', error);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm('Supprimer ce lot?')) return;
    try {
      await api.productionBatchService.delete(id);
      setProductionBatches(productionBatches.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  const handleDeleteUnsold = async (id: string) => {
    if (!confirm('Supprimer cette entrée?')) return;
    try {
      await api.unsoldProductsService.delete(id);
      setUnsoldProducts(unsoldProducts.filter(u => u.id !== id));
    } catch (error) {
      console.error('Error deleting unsold:', error);
    }
  };

  // Stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const batchesThisMonth = productionBatches.filter(b => {
    const d = new Date(b.batch_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalPlanned = batchesThisMonth.reduce((s, b) => s + b.planned_quantity, 0);
  const totalProduced = batchesThisMonth.reduce((s, b) => s + b.produced_quantity, 0);
  const totalLost = batchesThisMonth.reduce((s, b) => s + b.lost_quantity, 0);
  const productionEfficiency = totalPlanned > 0 ? (totalProduced / totalPlanned * 100).toFixed(1) : 0;
  const unsoldThisMonth = unsoldProducts.filter(u => {
    const d = new Date(u.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalUnsold = unsoldThisMonth.reduce((s, u) => s + u.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production</h1>
          <p className="text-gray-500">Suivi des lots, pertes et coût de revient</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openBatchModal()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-sm">
            <Plus size={18} /> Nouveau Lot
          </button>
          <button onClick={() => setShowUnsoldModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors shadow-sm">
            <AlertTriangle size={18} /> Non Vendu
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Planifié ce mois', value: totalPlanned, icon: <Package size={20} className="text-blue-600" />, bg: 'bg-blue-100' },
          { label: 'Produit ce mois', value: totalProduced, icon: <ChefHat size={20} className="text-emerald-600" />, bg: 'bg-emerald-100' },
          { label: 'Pertes production', value: totalLost, icon: <AlertTriangle size={20} className="text-orange-600" />, bg: 'bg-orange-100' },
          { label: 'Non vendu', value: totalUnsold, icon: <AlertTriangle size={20} className="text-rose-600" />, bg: 'bg-rose-100' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${s.bg} rounded-lg`}>{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Efficiency bar */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-white/80 text-sm">Efficacité de production</p>
            <p className="text-2xl font-bold">{productionEfficiency}%</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Pertes totales</p>
            <p className="text-xl font-bold">{totalLost + totalUnsold} unités</p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-2">
          <div className="bg-white rounded-full h-2 transition-all"
            style={{ width: `${Math.min(parseFloat(String(productionEfficiency)), 100)}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { id: 'batches', label: 'Lots de Production', icon: <ChefHat size={16} />, count: productionBatches.length },
          { id: 'unsold', label: 'Non Vendus', icon: <AlertTriangle size={16} />, count: unsoldProducts.length },
          { id: 'cost', label: 'Coût de Revient', icon: <Calculator size={16} /> },
        ] as const).map(tab => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'cost') initCostTab(); }}
            className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-colors ${
              activeTab === tab.id ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.icon} {tab.label}
            {'count' in tab && <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Lots de Production */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Planifié</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Produit</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Pertes</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Efficacité</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Notes</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productionBatches.map(batch => {
                  const eff = batch.planned_quantity > 0
                    ? (batch.produced_quantity / batch.planned_quantity * 100).toFixed(1) : 0;
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{format(new Date(batch.batch_date), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{batch.planned_quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{batch.produced_quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={batch.lost_quantity > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                          {batch.lost_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          parseFloat(String(eff)) >= 95 ? 'bg-green-100 text-green-700' :
                          parseFloat(String(eff)) >= 80 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>{eff}%</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">{batch.notes || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openBatchModal(batch)}
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteBatch(batch.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {productionBatches.length === 0 && (
            <div className="p-8 text-center text-gray-400">Aucun lot de production enregistré</div>
          )}
        </div>
      )}

      {/* Produits Non Vendus */}
      {activeTab === 'unsold' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Quantité</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Raison</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unsoldProducts.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{format(new Date(u.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 text-right font-medium text-red-600">{u.quantity}</td>
                    <td className="px-4 py-3 text-gray-600">{u.reason || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteUnsold(u.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unsoldProducts.length === 0 && (
            <div className="p-8 text-center text-gray-400">Aucun produit non vendu enregistré</div>
          )}
        </div>
      )}

      {/* Coût de Revient */}
      {activeTab === 'cost' && (
        <div className="space-y-4">
          {/* Multiplier */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Quantité produite</h3>
                <p className="text-sm text-gray-500">Ajustez pour recalculer toutes les quantités</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleMultiplierChange(Math.max(0.5, costMultiplier - 0.5))}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600">
                  -
                </button>
                <div className="text-center">
                  <input type="number" min="0.5" step="0.5"
                    value={costMultiplier}
                    onChange={e => handleMultiplierChange(Math.max(0.5, parseFloat(e.target.value) || 1))}
                    className="w-20 text-center text-3xl font-bold text-amber-600 bg-transparent border-b-2 border-amber-300 focus:border-amber-500 outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">kg de coques</p>
                </div>
                <button onClick={() => handleMultiplierChange(costMultiplier + 0.5)}
                  className="w-10 h-10 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-xl font-bold text-amber-600">
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Ingrédients Coque */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-amber-50 flex items-center gap-2">
              <ChefHat size={18} className="text-amber-600" />
              <h3 className="font-semibold text-amber-900">Matières Premières — Coque</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ingrédient</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Quantité utilisée (g)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix (DA/kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Coût</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {costLines.map((line, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{line.name}</td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" min="0" step="1"
                          value={line.qtyG}
                          onChange={e => updateCostLine(i, 'qtyG', parseFloat(e.target.value) || 0)}
                          className="w-28 px-2 py-1 border rounded-lg text-right text-sm focus:ring-2 focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input type="number" min="0" step="1"
                          value={line.pricePerKg}
                          onChange={e => updateCostLine(i, 'pricePerKg', parseFloat(e.target.value) || 0)}
                          className="w-28 px-2 py-1 border rounded-lg text-right text-sm focus:ring-2 focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-amber-700">
                        {((line.qtyG / 1000) * line.pricePerKg).toFixed(0)} DA
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-amber-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-800">Sous-total Coque:</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">{coqueCost.toFixed(0)} DA</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Ganache */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-rose-50 flex items-center gap-2">
              <Package size={18} className="text-rose-600" />
              <h3 className="font-semibold text-rose-900">Ganache utilisée pour la garniture</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poids total ganache utilisée (kg)</label>
                  <input type="number" min="0" step="0.01"
                    value={ganacheKg}
                    onChange={e => setGanacheKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 text-lg font-bold"
                  />
                  <p className="text-xs text-gray-400 mt-1">{(ganacheKg * 1000).toFixed(0)} grammes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de revient ganache (DA/kg)</label>
                  <input type="number" min="0" step="1"
                    value={ganachePricePerKg}
                    onChange={e => setGanachePricePerKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 text-lg font-bold"
                  />
                  <p className="text-xs text-gray-400 mt-1">Depuis la page Chocolat Maison</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-200">
                  <p className="text-sm text-rose-700 font-medium">Coût Ganache</p>
                  <p className="text-2xl font-bold text-rose-800">{ganacheCost.toFixed(0)} DA</p>
                  <p className="text-xs text-rose-500">{ganacheKg.toFixed(2)} kg × {ganachePricePerKg.toFixed(0)} DA/kg</p>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé Prix de Revient */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator size={22} />
              Prix de Revient Total — {costMultiplier} kg de production
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-sm">Coût Coque</p>
                <p className="text-2xl font-bold">{coqueCost.toFixed(0)} DA</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-sm">Coût Ganache</p>
                <p className="text-2xl font-bold">{ganacheCost.toFixed(0)} DA</p>
              </div>
              <div className="bg-amber-500/80 rounded-xl p-4">
                <p className="text-white/80 text-sm font-medium">Total Matières</p>
                <p className="text-2xl font-bold">{totalCost.toFixed(0)} DA</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-white/70 text-sm">Coût / Macaron</p>
                <p className="text-2xl font-bold">{costPerMacaron.toFixed(1)} DA</p>
                <p className="text-xs text-white/50">{macaronsCount} pièces</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap gap-4 text-sm text-white/70">
              <span>Coût/kg: <strong className="text-white">{costPerKg.toFixed(0)} DA/kg</strong></span>
              <span>Poids coque: <strong className="text-white">{totalCoqueWeightG.toFixed(0)} g</strong></span>
              <span>Ganache utilisée: <strong className="text-white">{(ganacheKg * 1000).toFixed(0)} g</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editBatch ? 'Modifier le Lot' : 'Nouveau Lot de Production'}</h2>
              <button onClick={() => setShowBatchModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleBatchSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={batchForm.batch_date}
                  onChange={e => setBatchForm({ ...batchForm, batch_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Planifié', key: 'planned_quantity' as const },
                  { label: 'Produit', key: 'produced_quantity' as const },
                  { label: 'Pertes', key: 'lost_quantity' as const },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <input type="number" min="0" required={f.key !== 'lost_quantity'}
                      value={batchForm[f.key]}
                      onChange={e => setBatchForm({ ...batchForm, [f.key]: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <textarea value={batchForm.notes}
                  onChange={e => setBatchForm({ ...batchForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                  {editBatch ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unsold Modal */}
      {showUnsoldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Produit Non Vendu</h2>
              <button onClick={() => setShowUnsoldModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleUnsoldSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={unsoldForm.date}
                  onChange={e => setUnsoldForm({ ...unsoldForm, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input type="number" min="0" required value={unsoldForm.quantity}
                  onChange={e => setUnsoldForm({ ...unsoldForm, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison (optionnel)</label>
                <select value={unsoldForm.reason}
                  onChange={e => setUnsoldForm({ ...unsoldForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Sélectionner une raison</option>
                  <option value="Expiration">Expiration</option>
                  <option value="Défectueux">Défectueux</option>
                  <option value="Annulation commande">Annulation commande</option>
                  <option value="Mauvaise production">Mauvaise production</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowUnsoldModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit"
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
