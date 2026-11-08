import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator, ChefHat, Plus, Trash2, Scale, X, Edit2, Layers, FlaskConical,
  Candy, Save, TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { supabase } from '../lib/supabase';
import type { RecipeItem } from '../types';

// ── Macaron recipe defaults ──
const DEFAULT_COQUE = { amandes: 100, sucre_glace: 100, blancs_oeufs: 100, sucre: 100, eau: 35 };
const DEFAULT_GANACHE = { chocolat: 200, lait: 100, pate_fruits: 150 };
const DEFAULT_COQUE_PRICES: Record<string, number> = {
  'Amandes en poudre': 1650, 'Sucre glace': 100, "Blancs d'oeufs": 390, 'Sucre en poudre': 75, 'Eau': 0,
};
const DEFAULT_GANACHE_PRICES: Record<string, number> = { 'Chocolat': 800, 'Lait': 100, 'Pâte de fruits': 600 };

// ── Chocolat maison defaults ──
const DEFAULT_GANACHE_PER_KG: Record<string, number> = { 'Chocolat': 200, 'Lait': 100, 'Pâte de fruits': 150 };
const CHOCOLAT_DEFAULT_PRICES: Record<string, number> = { 'Lait': 100, 'Pâte de fruits': 600 };

type RecipeType = 'coque' | 'ganache';
type MainTab = 'macaron' | 'chocolat';

interface RecipeLine {
  name: string;
  quantity: number;
  unit: string;
  materialId?: string;
  unitCost?: number;
  defaultCost?: number;
}

interface ChocolatConfig { id: string; yield_g: number; notes: string | null; }
interface ChocolatIngredient { id: string; config_id: string; name: string; quantity_g: number; unit_cost_per_kg: number; }

export default function RecipePage() {
  const { rawMaterials, recipeConfig, recipeItems, setRecipeItems, setRawMaterials } = useApp();

  const [mainTab, setMainTab] = useState<MainTab>('macaron');

  // ── Macaron state ──
  const [activeTab, setActiveTab] = useState<RecipeType>('coque');
  const [multiplier, setMultiplier] = useState(1);
  const [ganacheDailyQty, setGanacheDailyQty] = useState(0);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newIngredient, setNewIngredient] = useState({ material_id: '', quantity_per_batch: 0 });

  // ── Chocolat state ──
  const [chocConfig, setChocConfig] = useState<ChocolatConfig | null>(null);
  const [chocIngredients, setChocIngredients] = useState<ChocolatIngredient[]>([]);
  const [chocLoading, setChocLoading] = useState(true);
  const [chocSaving, setChocSaving] = useState(false);
  const [showAddChoc, setShowAddChoc] = useState(false);
  const [newChocIng, setNewChocIng] = useState({ name: '', quantity_g: 0, unit_cost_per_kg: 0 });
  const [editChocId, setEditChocId] = useState<string | null>(null);
  const [editChocIng, setEditChocIng] = useState({ name: '', quantity_g: 0, unit_cost_per_kg: 0 });
  const [editYield, setEditYield] = useState(false);
  const [yieldValue, setYieldValue] = useState(1000);
  const [coqueKg, setCoqueKg] = useState(1);
  const [chocMultiplier, setChocMultiplier] = useState(1);

  // ── Load chocolat data ──
  useEffect(() => {
    loadChocolatData();
  }, []);

  async function loadChocolatData() {
    setChocLoading(true);
    try {
      const { data: configs } = await supabase.from('chocolate_config').select('*').limit(1);
      let cfg: ChocolatConfig;
      if (!configs || configs.length === 0) {
        const { data: newCfg, error } = await supabase.from('chocolate_config').insert({ yield_g: 1000, notes: null }).select().single();
        if (error) throw error;
        cfg = newCfg;
      } else {
        cfg = configs[0];
      }
      setChocConfig(cfg);
      setYieldValue(cfg.yield_g);
      const { data: ings } = await supabase.from('chocolate_ingredients').select('*').eq('config_id', cfg.id).order('created_at');
      setChocIngredients(ings || []);
    } finally {
      setChocLoading(false);
    }
  }

  async function handleAddChocIngredient(e: React.FormEvent) {
    e.preventDefault();
    if (!chocConfig) return;
    setChocSaving(true);
    try {
      const { data, error } = await supabase.from('chocolate_ingredients').insert({ config_id: chocConfig.id, ...newChocIng }).select().single();
      if (error) throw error;
      setChocIngredients([...chocIngredients, data]);
      setNewChocIng({ name: '', quantity_g: 0, unit_cost_per_kg: 0 });
      setShowAddChoc(false);
    } finally {
      setChocSaving(false);
    }
  }

  async function handleDeleteChocIngredient(id: string) {
    if (!confirm('Supprimer cet ingrédient?')) return;
    const { error } = await supabase.from('chocolate_ingredients').delete().eq('id', id);
    if (!error) setChocIngredients(chocIngredients.filter(i => i.id !== id));
  }

  function startEditChoc(ing: ChocolatIngredient) {
    setEditChocId(ing.id);
    setEditChocIng({ name: ing.name, quantity_g: ing.quantity_g, unit_cost_per_kg: ing.unit_cost_per_kg });
  }

  async function handleSaveChocEdit(id: string) {
    setChocSaving(true);
    try {
      const { data, error } = await supabase.from('chocolate_ingredients').update(editChocIng).eq('id', id).select().single();
      if (error) throw error;
      setChocIngredients(chocIngredients.map(i => i.id === id ? data : i));
      setEditChocId(null);
    } finally {
      setChocSaving(false);
    }
  }

  async function handleSaveYield() {
    if (!chocConfig) return;
    const { data, error } = await supabase.from('chocolate_config').update({ yield_g: yieldValue }).eq('id', chocConfig.id).select().single();
    if (!error && data) { setChocConfig(data); setEditYield(false); }
  }

  // ── Macaron recipe computations ──
  const coqueItems = useMemo(() => recipeItems.filter(i => !i.recipe_type || i.recipe_type === 'coque'), [recipeItems]);
  const ganacheItems = useMemo(() => recipeItems.filter(i => i.recipe_type === 'ganache'), [recipeItems]);

  const defaultCoqueLines: RecipeLine[] = useMemo(() => [
    { name: 'Amandes en poudre', quantity: DEFAULT_COQUE.amandes, unit: 'g', defaultCost: DEFAULT_COQUE_PRICES['Amandes en poudre'] },
    { name: 'Sucre glace', quantity: DEFAULT_COQUE.sucre_glace, unit: 'g', defaultCost: DEFAULT_COQUE_PRICES['Sucre glace'] },
    { name: "Blancs d'oeufs", quantity: DEFAULT_COQUE.blancs_oeufs, unit: 'g', defaultCost: DEFAULT_COQUE_PRICES["Blancs d'oeufs"] },
    { name: 'Sucre en poudre', quantity: DEFAULT_COQUE.sucre, unit: 'g', defaultCost: DEFAULT_COQUE_PRICES['Sucre en poudre'] },
    { name: 'Eau', quantity: DEFAULT_COQUE.eau, unit: 'g', defaultCost: DEFAULT_COQUE_PRICES['Eau'] },
  ].map(line => {
    const mat = rawMaterials.find(m =>
      (m.name.toLowerCase().includes('amande') && line.name.includes('Amande')) ||
      (m.name.toLowerCase().includes('sucre glace') && line.name.includes('glace')) ||
      (m.name.toLowerCase().includes('sucre') && !m.name.toLowerCase().includes('glace') && line.name.includes('poudre')) ||
      (m.name.toLowerCase().includes('oeuf') && line.name.includes('oeufs')) ||
      (m.name.toLowerCase().includes('eau') && line.name === 'Eau')
    );
    return mat ? { ...line, materialId: mat.id, unitCost: mat.unit_cost } : line;
  }), [rawMaterials]);

  const defaultGanacheLines: RecipeLine[] = useMemo(() => [
    { name: 'Chocolat', quantity: DEFAULT_GANACHE.chocolat, unit: 'g', defaultCost: DEFAULT_GANACHE_PRICES['Chocolat'] },
    { name: 'Lait', quantity: DEFAULT_GANACHE.lait, unit: 'g', defaultCost: DEFAULT_GANACHE_PRICES['Lait'] },
    { name: 'Pâte de fruits', quantity: DEFAULT_GANACHE.pate_fruits, unit: 'g', defaultCost: DEFAULT_GANACHE_PRICES['Pâte de fruits'] },
  ].map(line => {
    const mat = rawMaterials.find(m =>
      (m.name.toLowerCase().includes('chocolat') && line.name === 'Chocolat') ||
      (m.name.toLowerCase().includes('lait') && line.name === 'Lait') ||
      (m.name.toLowerCase().includes('pâte') && line.name.includes('fruits'))
    );
    return mat ? { ...line, materialId: mat.id, unitCost: mat.unit_cost } : line;
  }), [rawMaterials]);

  const customCoqueLines: RecipeLine[] = useMemo(() => coqueItems.map(item => {
    const mat = rawMaterials.find(m => m.id === item.material_id);
    return { name: mat?.name || 'Inconnu', quantity: item.quantity_per_batch, unit: mat?.unit || 'g', materialId: item.material_id, unitCost: mat?.unit_cost, defaultCost: DEFAULT_COQUE_PRICES[mat?.name || ''] || 0 };
  }), [coqueItems, rawMaterials]);

  const customGanacheLines: RecipeLine[] = useMemo(() => ganacheItems.map(item => {
    const mat = rawMaterials.find(m => m.id === item.material_id);
    return { name: mat?.name || 'Inconnu', quantity: item.quantity_per_batch, unit: mat?.unit || 'g', materialId: item.material_id, unitCost: mat?.unit_cost, defaultCost: DEFAULT_GANACHE_PRICES[mat?.name || ''] || 0 };
  }), [ganacheItems, rawMaterials]);

  const activeCoqueLines = customCoqueLines.length > 0 ? customCoqueLines : defaultCoqueLines;
  const activeGanacheLines = customGanacheLines.length > 0 ? customGanacheLines : defaultGanacheLines;
  const activeLines = activeTab === 'coque' ? activeCoqueLines : activeGanacheLines;
  const activeCustomItems = activeTab === 'coque' ? coqueItems : ganacheItems;
  const defaultPrices = activeTab === 'coque' ? DEFAULT_COQUE_PRICES : DEFAULT_GANACHE_PRICES;

  const multipliedLines = useMemo(() => activeLines.map(line => {
    const effectiveCost = line.unitCost ?? line.defaultCost ?? 0;
    return { ...line, multipliedQuantity: line.quantity * multiplier, effectiveCost, totalCost: (line.quantity * multiplier / 1000) * effectiveCost };
  }), [activeLines, multiplier]);

  const totalCost = multipliedLines.reduce((s, l) => s + l.totalCost, 0);
  const totalWeight = multipliedLines.reduce((s, l) => s + l.multipliedQuantity, 0);

  const coqueTotalCost = useMemo(() => activeCoqueLines.reduce((s, l) => {
    const cost = l.unitCost ?? l.defaultCost ?? 0;
    return s + (l.quantity * multiplier / 1000) * cost;
  }, 0), [activeCoqueLines, multiplier]);

  const ganacheTotalCost = useMemo(() => activeGanacheLines.reduce((s, l) => {
    const cost = l.unitCost ?? l.defaultCost ?? 0;
    return s + (l.quantity * multiplier / 1000) * cost;
  }, 0), [activeGanacheLines, multiplier]);

  const handleUpdatePrice = async (ingredientName: string, price: number) => {
    const existing = rawMaterials.find(m => m.name.toLowerCase().includes(ingredientName.toLowerCase().split(' ')[0]));
    if (existing) {
      const updated = await api.rawMaterialsService.update(existing.id, { unit_cost: price });
      setRawMaterials(rawMaterials.map(m => m.id === updated.id ? updated : m));
    } else {
      const newMat = await api.rawMaterialsService.create({ name: ingredientName, unit: 'kg', unit_cost: price, supplier: '' });
      setRawMaterials([...rawMaterials, newMat]);
    }
    setShowPriceModal(false);
  };

  const openPriceModal = (ingredientName: string) => {
    setSelectedIngredient(ingredientName);
    const line = activeLines.find(l => l.name === ingredientName);
    setNewPrice(line?.unitCost ?? line?.defaultCost ?? 0);
    setShowPriceModal(true);
  };

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newItem = await api.recipeItemsService.create({
        recipe_id: recipeConfig?.id || 'default', material_id: newIngredient.material_id,
        quantity_per_batch: newIngredient.quantity_per_batch, recipe_type: activeTab,
      } as Omit<RecipeItem, 'id' | 'created_at'>);
      setRecipeItems([...recipeItems, newItem]);
      setShowAddIngredient(false);
      setNewIngredient({ material_id: '', quantity_per_batch: 0 });
    } catch (error) { console.error('Error adding ingredient:', error); }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (!confirm('Supprimer cet ingrédient?')) return;
    try {
      await api.recipeItemsService.delete(id);
      setRecipeItems(recipeItems.filter(item => item.id !== id));
    } catch (error) { console.error('Error deleting ingredient:', error); }
  };

  const availableMaterials = rawMaterials.filter(m => !activeCustomItems.some(item => item.material_id === m.id));
  const isCustom = activeCustomItems.length > 0;

  const ganacheCostPerGram = useMemo(() => {
    const baseWeight = activeGanacheLines.reduce((s, l) => s + l.quantity, 0);
    const baseCost = activeGanacheLines.reduce((s, l) => {
      const cost = l.unitCost ?? l.defaultCost ?? 0;
      return s + (l.quantity / 1000) * cost;
    }, 0);
    return baseWeight > 0 ? baseCost / baseWeight : 0;
  }, [activeGanacheLines]);

  const todayGanacheCost = ganacheDailyQty * ganacheCostPerGram;
  const todayTotalCost = coqueTotalCost + todayGanacheCost;
  const macaronsCount = Math.round((activeCoqueLines.reduce((s, l) => s + l.quantity * multiplier, 0)) / 1000 * 55);

  // ── Chocolat computations ──
  const totalIngCost = useMemo(() => chocIngredients.reduce((s, i) => s + (i.quantity_g / 1000) * i.unit_cost_per_kg, 0), [chocIngredients]);
  const yieldKg = (chocConfig?.yield_g || 1000) / 1000;
  const costPerKg = yieldKg > 0 && totalIngCost > 0 ? totalIngCost / yieldKg : 0;

  // Scaled by chocolat multiplier
  const scaledChocIngredients = useMemo(() => chocIngredients.map(i => ({
    ...i,
    scaledQuantity: i.quantity_g * chocMultiplier,
    scaledCost: (i.quantity_g * chocMultiplier / 1000) * i.unit_cost_per_kg,
  })), [chocIngredients, chocMultiplier]);
  const scaledTotalIngCost = scaledChocIngredients.reduce((s, i) => s + i.scaledCost, 0);
  const scaledYieldG = (chocConfig?.yield_g || 1000) * chocMultiplier;
  const scaledYieldKg = scaledYieldG / 1000;
  const scaledCostPerKg = scaledYieldKg > 0 && scaledTotalIngCost > 0 ? scaledTotalIngCost / scaledYieldKg : costPerKg;

  const chocGanacheItems = useMemo(() => recipeItems.filter(i => i.recipe_type === 'ganache'), [recipeItems]);

  const chocGanacheLines = useMemo(() => {
    if (chocGanacheItems.length > 0) {
      return chocGanacheItems.map(item => {
        const mat = rawMaterials.find(m => m.id === item.material_id);
        const isChoc = mat?.name?.toLowerCase().includes('chocolat');
        const unitPrice = isChoc && costPerKg > 0 ? costPerKg : (mat?.unit_cost ?? 0);
        const qtyG = item.quantity_per_batch * coqueKg;
        return { name: mat?.name || 'Inconnu', qtyG, unitPrice, cost: (qtyG / 1000) * unitPrice, isChoc: !!isChoc };
      });
    }
    return Object.entries(DEFAULT_GANACHE_PER_KG).map(([name, baseG]) => {
      const isChoc = name === 'Chocolat';
      const unitPrice = isChoc && costPerKg > 0 ? costPerKg : (CHOCOLAT_DEFAULT_PRICES[name] ?? 0);
      const qtyG = baseG * coqueKg;
      return { name, qtyG, unitPrice, cost: (qtyG / 1000) * unitPrice, isChoc };
    });
  }, [chocGanacheItems, rawMaterials, costPerKg, coqueKg]);

  const totalGanacheCost = chocGanacheLines.reduce((s, l) => s + l.cost, 0);
  const totalGanacheG = chocGanacheLines.reduce((s, l) => s + l.qtyG, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recettes & Chocolat Maison</h1>
        <p className="text-gray-500">Configurez la recette des macarons et le chocolat maison</p>
      </div>

      {/* Main tabs: Macaron vs Chocolat */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
        <button
          onClick={() => setMainTab('macaron')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            mainTab === 'macaron' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ChefHat size={18} /> Recette Macarons
        </button>
        <button
          onClick={() => setMainTab('chocolat')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
            mainTab === 'chocolat' ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Candy size={18} /> Chocolat Maison
        </button>
      </div>

      {/* ════════ MACARON TAB ════════ */}
      {mainTab === 'macaron' && (
        <>
          {/* Multiplicateur */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale size={24} className="text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Multiplicateur de Production</h2>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setMultiplier(Math.max(0.5, multiplier - 0.5))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 transition-colors">-</button>
              <div className="flex-1 text-center">
                <input type="number" min="0.5" step="0.5" value={multiplier} onChange={e => setMultiplier(Math.max(0.5, parseFloat(e.target.value) || 1))} className="w-32 text-center text-4xl font-bold text-amber-600 bg-transparent border-b-2 border-amber-300 focus:border-amber-500 outline-none" />
                <p className="text-gray-500 mt-1">fois la recette de base</p>
              </div>
              <button onClick={() => setMultiplier(multiplier + 0.5)} className="w-12 h-12 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-2xl font-bold text-amber-600 transition-colors">+</button>
            </div>
          </div>

          {/* Sub-tabs Coque/Ganache */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b">
              <button onClick={() => setActiveTab('coque')} className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${activeTab === 'coque' ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <ChefHat size={18} /> Recette Coque
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'coque' ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>Amandes · Sucre · Blancs d'oeufs</span>
              </button>
              <button onClick={() => setActiveTab('ganache')} className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${activeTab === 'ganache' ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-500' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <Layers size={18} /> Recette Ganache
                <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === 'ganache' ? 'bg-rose-200 text-rose-800' : 'bg-gray-100 text-gray-500'}`}>Chocolat · Lait · Pâte de fruits</span>
              </button>
            </div>

            {/* Banner */}
            <div className={`p-4 flex items-center gap-3 ${activeTab === 'coque' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'} text-white`}>
              {activeTab === 'coque' ? <ChefHat size={22} /> : <Layers size={22} />}
              <div>
                <p className="font-bold text-base">{activeTab === 'coque' ? 'Coque Macaron' : 'Ganache Macaron'}</p>
                <p className="text-xs text-white/80">Recette de base par lot · multiplicateur x{multiplier}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xl font-bold">{totalWeight.toLocaleString()}g</p>
                <p className="text-xs text-white/80">Poids total</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ingrédient</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Base (g)</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Quantité x{multiplier}</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix/kg</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Coût</th>
                    {isCustom && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {multipliedLines.map((line, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{line.name}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{line.quantity}g</td>
                      <td className={`px-4 py-3 text-right font-bold ${activeTab === 'coque' ? 'text-amber-600' : 'text-rose-600'}`}>{line.multipliedQuantity.toLocaleString()}g</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className={line.unitCost ? 'text-gray-900' : 'text-gray-400 text-sm'}>
                            {(line.unitCost ?? line.defaultCost ?? 0) > 0 ? `${(line.unitCost ?? line.defaultCost)!.toLocaleString()} DA/kg` : '—'}
                          </span>
                          <button onClick={() => openPriceModal(line.name)} className={`p-1 rounded ${activeTab === 'coque' ? 'text-amber-500 hover:bg-amber-100' : 'text-rose-500 hover:bg-rose-100'}`}><Edit2 size={13} /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{line.totalCost > 0 ? `${line.totalCost.toFixed(0)} DA` : '—'}</td>
                      {isCustom && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => { const item = activeCustomItems.find(it => it.material_id === line.materialId); if (item) handleDeleteIngredient(item.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className={activeTab === 'coque' ? 'bg-amber-50' : 'bg-rose-50'}>
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-800">Coût total {activeTab === 'coque' ? 'coque' : 'ganache'}:</td>
                    <td className={`px-4 py-3 text-right font-bold text-lg ${activeTab === 'coque' ? 'text-amber-700' : 'text-rose-700'}`}>{totalCost.toFixed(0)} DA</td>
                    {isCustom && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setShowAddIngredient(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors">
              <Plus size={18} /> Personnaliser {activeTab === 'coque' ? 'la coque' : 'la ganache'}
            </button>
          </div>

          {/* Résumé combiné */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-amber-50 rounded-xl p-4"><p className="text-sm text-amber-600 font-medium">Coût Coque</p><p className="text-2xl font-bold text-amber-700">{coqueTotalCost.toFixed(0)} DA</p><p className="text-xs text-amber-500">pour x{multiplier}</p></div>
            <div className="bg-rose-50 rounded-xl p-4"><p className="text-sm text-rose-600 font-medium">Coût Ganache</p><p className="text-2xl font-bold text-rose-700">{ganacheTotalCost.toFixed(0)} DA</p><p className="text-xs text-rose-500">pour x{multiplier}</p></div>
            <div className="bg-emerald-50 rounded-xl p-4"><p className="text-sm text-emerald-600 font-medium">Coût Total</p><p className="text-2xl font-bold text-emerald-700">{(coqueTotalCost + ganacheTotalCost).toFixed(0)} DA</p><p className="text-xs text-emerald-500">coque + ganache</p></div>
            <div className="bg-blue-50 rounded-xl p-4"><p className="text-sm text-blue-600 font-medium">Nb. Macarons</p><p className="text-2xl font-bold text-blue-700">{macaronsCount}</p><p className="text-xs text-blue-500">55 pcs/kg</p></div>
          </div>

          {/* Calcul du jour */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-5 flex items-center gap-3 text-white">
              <FlaskConical size={22} />
              <div><p className="font-bold text-base">Calcul du Prix de Revient du Jour</p><p className="text-xs text-white/80">Coques calculées par le multiplicateur · Saisir la quantité de ganache utilisée</p></div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-center gap-2 mb-3"><ChefHat size={16} className="text-amber-600" /><span className="text-sm font-semibold text-amber-800">Coût des Coques (×{multiplier})</span></div>
                  <p className="text-3xl font-bold text-amber-700">{coqueTotalCost.toFixed(0)} <span className="text-base font-medium">DA</span></p>
                  <p className="text-xs text-amber-500 mt-2">Ajustez le multiplicateur ci-dessus</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-rose-700 flex items-center gap-2"><Layers size={15} /> Ganache utilisée aujourd'hui (grammes)</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGanacheDailyQty(q => Math.max(0, q - 50))} className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-xl font-bold text-rose-600 transition-colors flex-shrink-0 border border-rose-200">-</button>
                    <div className="relative flex-1">
                      <input type="number" min="0" step="50" value={ganacheDailyQty || ''} placeholder="0" onChange={e => setGanacheDailyQty(Math.max(0, parseFloat(e.target.value) || 0))} className="w-full text-center text-2xl font-bold text-rose-700 px-4 py-3 border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-500 bg-rose-50" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">g</span>
                    </div>
                    <button onClick={() => setGanacheDailyQty(q => q + 50)} className="w-10 h-10 rounded-xl bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-xl font-bold text-rose-600 transition-colors flex-shrink-0 border border-rose-200">+</button>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 px-1"><span>{ganacheCostPerGram > 0 ? `${(ganacheCostPerGram * 1000).toFixed(1)} DA/kg` : 'Prix non configuré'}</span><span className="font-semibold text-rose-600">{todayGanacheCost.toFixed(0)} DA</span></div>
                </div>
              </div>
              <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2 mb-4"><Calculator size={18} className="text-emerald-600" /><h3 className="font-semibold text-emerald-800">Prix de Revient Total du Jour</h3></div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-emerald-200"><span className="text-sm text-gray-600 flex items-center gap-2"><ChefHat size={14} className="text-amber-500" /> Coût des Coques (×{multiplier})</span><span className="font-semibold text-amber-700">{coqueTotalCost.toFixed(0)} DA</span></div>
                  <div className="flex justify-between items-center py-2 border-b border-emerald-200"><span className="text-sm text-gray-600 flex items-center gap-2"><Layers size={14} className="text-rose-500" /> Coût de la Ganache ({ganacheDailyQty}g)</span><span className="font-semibold text-rose-700">{todayGanacheCost.toFixed(0)} DA</span></div>
                  <div className="flex justify-between items-center pt-2"><span className="font-bold text-gray-800 text-base">TOTAL Prix de Revient</span><span className="text-2xl font-bold text-emerald-700">{todayTotalCost.toFixed(0)} DA</span></div>
                </div>
                {macaronsCount > 0 && todayTotalCost > 0 && (
                  <div className="mt-4 pt-4 border-t border-emerald-200 flex justify-between items-center"><span className="text-sm text-gray-600">Coût par macaron (~{macaronsCount} pièces)</span><span className="font-bold text-emerald-700">{(todayTotalCost / macaronsCount).toFixed(1)} DA</span></div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════ CHOCOLAT TAB ════════ */}
      {mainTab === 'chocolat' && (
        <>
          {chocLoading ? (
            <div className="flex items-center justify-center py-24"><div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-500" /></div>
          ) : (
            <>
              {/* Multiplicateur de production chocolat */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Scale size={24} className="text-amber-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Multiplicateur de Production Chocolat</h2>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setChocMultiplier(Math.max(0.5, chocMultiplier - 0.5))} className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 transition-colors">-</button>
                  <div className="flex-1 text-center">
                    <input type="number" min="0.5" step="0.5" value={chocMultiplier} onChange={e => setChocMultiplier(Math.max(0.5, parseFloat(e.target.value) || 1))} className="w-32 text-center text-4xl font-bold text-amber-700 bg-transparent border-b-2 border-amber-300 focus:border-amber-500 outline-none" />
                    <p className="text-gray-500 mt-1">fois la recette de base</p>
                  </div>
                  <button onClick={() => setChocMultiplier(chocMultiplier + 0.5)} className="w-12 h-12 rounded-xl bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-2xl font-bold text-amber-700 transition-colors">+</button>
                </div>
              </div>

              {/* Recette du chocolat */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-amber-700 to-amber-900 text-white">
                  <ChefHat size={22} />
                  <div className="flex-1"><h2 className="font-bold text-lg">Recette Chocolat Maison</h2><p className="text-xs text-amber-200">Ingrédients nécessaires pour produire le chocolat · multiplicateur x{chocMultiplier}</p></div>
                  <button onClick={() => setShowAddChoc(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"><Plus size={16} /> Ajouter</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-amber-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-amber-800">Ingrédient</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-amber-800">Base (g)</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-amber-800">Qté x{chocMultiplier}</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-amber-800">Prix (DA/kg)</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-amber-800">Coût</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {chocIngredients.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun ingrédient. Ajoutez les matières premières de votre chocolat maison.</td></tr>
                      )}
                      {scaledChocIngredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-gray-50">
                          {editChocId === ing.id ? (
                            <>
                              <td className="px-4 py-2"><input value={editChocIng.name} onChange={e => setEditChocIng({ ...editChocIng, name: e.target.value })} className="w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-amber-500" /></td>
                              <td className="px-4 py-2"><input type="number" min="0" step="1" value={editChocIng.quantity_g} onChange={e => setEditChocIng({ ...editChocIng, quantity_g: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 border rounded text-sm text-right focus:ring-1 focus:ring-amber-500" /></td>
                              <td className="px-4 py-2 text-right text-sm font-bold text-amber-700">{(editChocIng.quantity_g * chocMultiplier).toLocaleString()} g</td>
                              <td className="px-4 py-2"><input type="number" min="0" step="1" value={editChocIng.unit_cost_per_kg} onChange={e => setEditChocIng({ ...editChocIng, unit_cost_per_kg: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 border rounded text-sm text-right focus:ring-1 focus:ring-amber-500" /></td>
                              <td className="px-4 py-2 text-right text-sm text-gray-500">{((editChocIng.quantity_g * chocMultiplier / 1000) * editChocIng.unit_cost_per_kg).toFixed(0)} DA</td>
                              <td className="px-4 py-2 text-right"><div className="flex justify-end gap-1"><button onClick={() => handleSaveChocEdit(ing.id)} disabled={chocSaving} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Save size={15} /></button><button onClick={() => setEditChocId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={15} /></button></div></td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-medium text-gray-900">{ing.name}</td>
                              <td className="px-4 py-3 text-right text-gray-500">{ing.quantity_g.toLocaleString()} g</td>
                              <td className="px-4 py-3 text-right font-bold text-amber-700">{ing.scaledQuantity.toLocaleString()} g</td>
                              <td className="px-4 py-3 text-right text-gray-700">{ing.unit_cost_per_kg.toLocaleString()} DA/kg</td>
                              <td className="px-4 py-3 text-right font-medium text-amber-700">{ing.scaledCost.toFixed(0)} DA</td>
                              <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><button onClick={() => startEditChoc(ing)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit2 size={15} /></button><button onClick={() => handleDeleteChocIngredient(ing.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button></div></td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    {chocIngredients.length > 0 && (
                      <tfoot className="bg-amber-50"><tr><td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-800">Total ingrédients (x{chocMultiplier}):</td><td className="px-4 py-3 text-right font-bold text-amber-800 text-base">{scaledTotalIngCost.toFixed(0)} DA</td><td /></tr></tfoot>
                    )}
                  </table>
                </div>
                {/* Rendement */}
                <div className="p-4 border-t bg-gray-50 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1"><p className="text-sm font-medium text-gray-700">Rendement de base (grammes de chocolat produits)</p><p className="text-xs text-gray-500">La quantité de chocolat obtenue avec la recette de base</p></div>
                  {editYield ? (
                    <div className="flex items-center gap-2"><input type="number" min="1" step="50" value={yieldValue} onChange={e => setYieldValue(parseFloat(e.target.value) || 1000)} className="w-32 px-3 py-1.5 border rounded-lg text-center font-bold focus:ring-2 focus:ring-amber-500" /><span className="text-sm text-gray-500">g</span><button onClick={handleSaveYield} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg"><Save size={16} /></button><button onClick={() => { setEditYield(false); setYieldValue(chocConfig?.yield_g || 1000); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={16} /></button></div>
                  ) : (
                    <div className="flex items-center gap-2"><span className="text-2xl font-bold text-amber-700">{(chocConfig?.yield_g || 1000).toLocaleString()} g</span><button onClick={() => setEditYield(true)} className="p-1.5 text-amber-500 hover:bg-amber-100 rounded-lg"><Edit2 size={15} /></button></div>
                  )}
                </div>
                {/* Rendement multiplié */}
                <div className="px-4 pb-4 bg-gray-50">
                  <div className="bg-amber-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-800">Rendement avec multiplicateur x{chocMultiplier}:</span>
                    <span className="text-xl font-bold text-amber-900">{scaledYieldG.toLocaleString()} g ({scaledYieldKg.toFixed(3)} kg)</span>
                  </div>
                </div>
              </div>

              {/* Prix de revient chocolat */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200"><p className="text-sm font-medium text-amber-700">Coût ingrédients (x{chocMultiplier})</p><p className="text-3xl font-bold text-amber-800 mt-1">{scaledTotalIngCost.toFixed(0)} DA</p><p className="text-xs text-amber-600 mt-1">pour {scaledYieldG.toLocaleString()}g de chocolat</p></div>
                <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200"><p className="text-sm font-medium text-orange-700">Rendement (x{chocMultiplier})</p><p className="text-3xl font-bold text-orange-800 mt-1">{scaledYieldG.toLocaleString()} g</p><p className="text-xs text-orange-600 mt-1">{scaledYieldKg.toFixed(3)} kg de chocolat produit</p></div>
                <div className={`rounded-2xl p-5 border ${scaledCostPerKg > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-2"><TrendingUp size={18} className={scaledCostPerKg > 0 ? 'text-emerald-600' : 'text-gray-400'} /><p className={`text-sm font-medium ${scaledCostPerKg > 0 ? 'text-emerald-700' : 'text-gray-500'}`}>Prix de Revient Chocolat</p></div>
                  <p className={`text-3xl font-bold mt-1 ${scaledCostPerKg > 0 ? 'text-emerald-800' : 'text-gray-400'}`}>{scaledCostPerKg > 0 ? `${scaledCostPerKg.toFixed(0)} DA/kg` : '—'}</p>
                  <p className={`text-xs mt-1 ${scaledCostPerKg > 0 ? 'text-emerald-600 font-semibold' : 'text-gray-400'}`}>{scaledCostPerKg > 0 ? 'Prix du chocolat maison' : 'Ajoutez des ingrédients'}</p>
                </div>
              </div>

              {/* Calcul ganache pour la production */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-rose-500 to-pink-600 text-white">
                  <Layers size={22} />
                  <div className="flex-1"><h2 className="font-bold text-lg">Calcul Ganache par Production</h2><p className="text-xs text-rose-100">Quantité de ganache utilisée en fonction des coques produites</p></div>
                </div>
                <div className="p-4 bg-rose-50 border-b flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1"><p className="text-sm font-semibold text-rose-800">Quantité de coques produites</p><p className="text-xs text-rose-600">Saisissez la quantité en kg pour calculer la ganache nécessaire</p></div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setCoqueKg(Math.max(0.5, coqueKg - 0.5))} className="w-10 h-10 rounded-xl bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-xl font-bold text-rose-600 transition-colors">-</button>
                    <div className="text-center"><input type="number" min="0.5" step="0.5" value={coqueKg} onChange={e => setCoqueKg(Math.max(0.5, parseFloat(e.target.value) || 1))} className="w-24 text-center text-3xl font-bold text-rose-700 bg-transparent border-b-2 border-rose-300 focus:border-rose-500 outline-none" /><p className="text-xs text-rose-500 mt-0.5">kg de coques</p></div>
                    <button onClick={() => setCoqueKg(coqueKg + 0.5)} className="w-10 h-10 rounded-xl bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-xl font-bold text-rose-600 transition-colors">+</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ingrédient ganache</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Qté / kg coque</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Qté pour {coqueKg} kg</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix unitaire</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Coût</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {chocGanacheLines.map((line, i) => (
                        <tr key={i} className={line.isChoc ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="font-medium text-gray-900">{line.name}</span>{line.isChoc && costPerKg > 0 && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Maison</span>}</div></td>
                          <td className="px-4 py-3 text-right text-gray-500 text-sm">{(line.qtyG / coqueKg).toFixed(0)} g</td>
                          <td className="px-4 py-3 text-right font-bold text-rose-700">{line.qtyG.toFixed(0)} g</td>
                          <td className="px-4 py-3 text-right text-gray-600 text-sm">{line.unitPrice > 0 ? `${line.unitPrice.toFixed(0)} DA/kg` : '—'}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">{line.cost > 0 ? `${line.cost.toFixed(0)} DA` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-rose-50"><tr><td colSpan={2} className="px-4 py-3 text-right font-bold text-gray-800">Total ganache pour {coqueKg} kg de coques:</td><td className="px-4 py-3 text-right font-bold text-rose-700">{totalGanacheG.toFixed(0)} g</td><td className="px-4 py-3 text-right text-xs text-gray-500">{(totalGanacheG / 1000).toFixed(2)} kg</td><td className="px-4 py-3 text-right font-bold text-rose-700 text-lg">{totalGanacheCost.toFixed(0)} DA</td></tr></tfoot>
                  </table>
                </div>
                <div className="p-4 bg-gray-50 border-t">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-white rounded-xl p-3 border border-gray-200"><p className="text-xs text-gray-500">Coques produites</p><p className="text-xl font-bold text-gray-800">{coqueKg} kg</p><p className="text-xs text-gray-400">{Math.round(coqueKg * 55)} macarons</p></div>
                    <div className="bg-white rounded-xl p-3 border border-gray-200"><p className="text-xs text-gray-500">Ganache totale</p><p className="text-xl font-bold text-rose-700">{totalGanacheG.toFixed(0)} g</p><p className="text-xs text-gray-400">{(totalGanacheG / 1000).toFixed(2)} kg</p></div>
                    <div className="bg-white rounded-xl p-3 border border-amber-200"><p className="text-xs text-amber-600">Coût ganache</p><p className="text-xl font-bold text-amber-700">{totalGanacheCost.toFixed(0)} DA</p><p className="text-xs text-amber-500">pour la production</p></div>
                    <div className="bg-white rounded-xl p-3 border border-rose-200"><p className="text-xs text-rose-600">Ganache / macaron</p><p className="text-xl font-bold text-rose-700">{coqueKg > 0 ? (totalGanacheG / (coqueKg * 55)).toFixed(1) : '—'} g</p><p className="text-xs text-rose-400">par pièce</p></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {/* Add ingredient (macaron) */}
      {showAddIngredient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="text-lg font-semibold">{activeTab === 'coque' ? 'Personnaliser la Coque' : 'Personnaliser la Ganache'}</h2><button onClick={() => setShowAddIngredient(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
            <form onSubmit={handleAddIngredient} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Matière première</label><select required value={newIngredient.material_id} onChange={e => setNewIngredient({ ...newIngredient, material_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"><option value="">Sélectionner</option>{availableMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit_cost.toLocaleString()} DA/{m.unit})</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantité par lot de base (g)</label><input type="number" min="0" step="1" required value={newIngredient.quantity_per_batch} onChange={e => setNewIngredient({ ...newIngredient, quantity_per_batch: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" /></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowAddIngredient(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button><button type="submit" className={`px-4 py-2 text-white rounded-lg ${activeTab === 'coque' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'}`}>Ajouter</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Price modal */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="text-lg font-semibold">Prix — {selectedIngredient}</h2><button onClick={() => setShowPriceModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
            <div className="p-4 space-y-4">
              {defaultPrices[selectedIngredient] != null && <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800">Prix de référence: <span className="font-bold">{defaultPrices[selectedIngredient].toLocaleString()} DA/kg</span></div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix au kg (DA)</label><input type="number" min="0" step="1" value={newPrice} onChange={e => setNewPrice(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" /></div>
              <div className="flex justify-end gap-2"><button onClick={() => setShowPriceModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button><button onClick={() => handleUpdatePrice(selectedIngredient, newPrice)} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">Enregistrer</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Add chocolat ingredient */}
      {showAddChoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b"><h2 className="text-lg font-semibold">Ajouter un ingrédient</h2><button onClick={() => setShowAddChoc(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
            <form onSubmit={handleAddChocIngredient} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'ingrédient</label><input required placeholder="ex: Cacao en poudre, Beurre de cacao..." value={newChocIng.name} onChange={e => setNewChocIng({ ...newChocIng, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantité (g)</label><input type="number" min="0" step="1" required value={newChocIng.quantity_g} onChange={e => setNewChocIng({ ...newChocIng, quantity_g: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix (DA/kg)</label><input type="number" min="0" step="1" required value={newChocIng.unit_cost_per_kg} onChange={e => setNewChocIng({ ...newChocIng, unit_cost_per_kg: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" /></div>
              </div>
              {newChocIng.quantity_g > 0 && newChocIng.unit_cost_per_kg > 0 && <div className="bg-amber-50 rounded-lg p-3 text-sm">Coût: <span className="font-bold text-amber-700">{((newChocIng.quantity_g / 1000) * newChocIng.unit_cost_per_kg).toFixed(0)} DA</span></div>}
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowAddChoc(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button><button type="submit" disabled={chocSaving} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">{chocSaving ? 'Enregistrement...' : 'Ajouter'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
