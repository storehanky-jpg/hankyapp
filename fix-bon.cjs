--- lignes 1-135 ---
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
--- lignes 262-300 ---
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
--- lignes 480-625 ---
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
--- lignes 650-674 ---
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

