import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Package, ShoppingCart, X, Truck, ChevronRight, Wallet, ArrowLeft, BarChart3, TrendingUp } from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfYear, subWeeks, subMonths, subYears, isAfter } from 'date-fns';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { RawMaterial, MaterialPurchase, Supplier, SupplierPurchase } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type PaymentStatus = 'paid' | 'unpaid' | 'partial';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Payé',
  unpaid: 'Non payé',
  partial: 'Versement',
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  unpaid: 'bg-red-100 text-red-700 border border-red-200',
  partial: 'bg-orange-100 text-orange-700 border border-orange-200',
};

const STATUS_DOT: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-500',
  unpaid: 'bg-red-500',
  partial: 'bg-orange-500',
};

export default function MaterialsPage() {
  const {
    rawMaterials, setRawMaterials,
    materialPurchases, setMaterialPurchases
  } = useApp();

  const [activeTab, setActiveTab] = useState<'materials' | 'purchases' | 'suppliers' | 'stats'>('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [materialSearch, setMaterialSearch] = useState('');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchase[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showSupplierPurchaseModal, setShowSupplierPurchaseModal] = useState(false);
  const [editingSupplierPurchase, setEditingSupplierPurchase] = useState<SupplierPurchase | null>(null);

  const [supplierForm, setSupplierForm] = useState({ name: '', category: '', phone: '', address: '', notes: '' });
  const [supplierPurchaseForm, setSupplierPurchaseForm] = useState({
    item_name: '', quantity: 1, unit: 'kg', unit_cost: 0,
    purchase_date: format(new Date(), 'yyyy-MM-dd'), amount_paid: 0, invoice_number: '', notes: ''
  });

  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    api.suppliersService.getAll().then(setSuppliers).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      api.supplierPurchasesService.getBySupplier(selectedSupplier.id).then(setSupplierPurchases).catch(() => {});
    } else { setSupplierPurchases([]); }
  }, [selectedSupplier]);

  const [materialForm, setMaterialForm] = useState({
    name: '',
    unit: 'kg',
    unit_cost: 0,
    supplier: ''
  });

  const [purchaseForm, setPurchaseForm] = useState({
    material_id: '',
    quantity: 0,
    unit_cost: 0,
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    invoice_number: '',
    notes: '',
    payment_status: 'unpaid' as PaymentStatus,
    amount_paid: 0,
  });

  useEffect(() => {
    if (selectedMaterialId && showPurchaseModal) return;
    if (rawMaterials.length > 0 && !purchaseForm.material_id) {
      setPurchaseForm(prev => ({ ...prev, material_id: rawMaterials[0].id }));
    }
  }, [rawMaterials, showPurchaseModal, selectedMaterialId, purchaseForm.material_id]);

  const filteredMaterials = rawMaterials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPurchases = materialPurchases.filter(p =>
    p.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered materials for the purchase modal dropdown
  const dropdownMaterials = rawMaterials.filter(m =>
    m.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        const updated = await api.rawMaterialsService.update(editingMaterial.id, {
          name: materialForm.name,
          unit: materialForm.unit,
          unit_cost: materialForm.unit_cost,
          supplier: materialForm.supplier || undefined,
          last_purchase_date: format(new Date(), 'yyyy-MM-dd')
        });
        setRawMaterials(rawMaterials.map(m => m.id === updated.id ? updated : m));
      } else {
        const newMaterial = await api.rawMaterialsService.create({
          name: materialForm.name,
          unit: materialForm.unit,
          unit_cost: materialForm.unit_cost,
          supplier: materialForm.supplier || undefined
        });
        setRawMaterials([...rawMaterials, newMaterial]);
      }
      setShowMaterialModal(false);
      setEditingMaterial(null);
      setMaterialForm({ name: '', unit: 'kg', unit_cost: 0, supplier: '' });
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total_cost = purchaseForm.quantity * purchaseForm.unit_cost;
      const amount_paid = purchaseForm.payment_status === 'paid' ? total_cost
        : purchaseForm.payment_status === 'partial' ? purchaseForm.amount_paid
        : 0;

      const newPurchase = await api.materialPurchasesService.create({
        material_id: purchaseForm.material_id,
        quantity: purchaseForm.quantity,
        unit_cost: purchaseForm.unit_cost,
        total_cost,
        purchase_date: purchaseForm.purchase_date,
        invoice_number: purchaseForm.invoice_number || undefined,
        notes: purchaseForm.notes || undefined,
        payment_status: purchaseForm.payment_status,
        amount_paid,
      });
      const material = rawMaterials.find(m => m.id === purchaseForm.material_id);
      setMaterialPurchases([{ ...newPurchase, material }, ...materialPurchases]);

      await api.rawMaterialsService.update(purchaseForm.material_id, {
        unit_cost: purchaseForm.unit_cost,
        last_purchase_date: purchaseForm.purchase_date
      });

      setShowPurchaseModal(false);
      setMaterialSearch('');
      setPurchaseForm({
        material_id: rawMaterials[0]?.id || '',
        quantity: 0,
        unit_cost: 0,
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
        invoice_number: '',
        notes: '',
        payment_status: 'unpaid',
        amount_paid: 0,
      });
    } catch (error) {
      console.error('Error saving purchase:', error);
    }
  };

  const handleUpdatePurchaseStatus = async (purchase: MaterialPurchase, status: PaymentStatus) => {
    const amount_paid = status === 'paid' ? purchase.total_cost
      : status === 'partial' ? (purchase.amount_paid || 0)
      : 0;
    try {
      const updated = await api.materialPurchasesService.update(purchase.id, {
        payment_status: status,
        amount_paid,
      });
      setMaterialPurchases(materialPurchases.map(p => p.id === updated.id ? updated : p));
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const handleUpdatePurchaseAmountPaid = async (purchase: MaterialPurchase, amount: number) => {
    try {
      const updated = await api.materialPurchasesService.update(purchase.id, {
        amount_paid: amount,
        payment_status: 'partial',
      });
      setMaterialPurchases(materialPurchases.map(p => p.id === updated.id ? updated : p));
    } catch (error) {
      console.error('Error updating amount paid:', error);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Supprimer cette matière première?')) return;
    try {
      await api.rawMaterialsService.delete(id);
      setRawMaterials(rawMaterials.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Supprimer cet achat?')) return;
    try {
      await api.materialPurchasesService.delete(id);
      setMaterialPurchases(materialPurchases.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting purchase:', error);
    }
  };

  const openEditMaterial = (material: RawMaterial) => {
    setEditingMaterial(material);
    setMaterialForm({
      name: material.name,
      unit: material.unit,
      unit_cost: material.unit_cost,
      supplier: material.supplier || ''
    });
    setShowMaterialModal(true);
  };

  const openNewPurchase = (materialId?: string) => {
    if (materialId) {
      setPurchaseForm(prev => ({ ...prev, material_id: materialId }));
      setSelectedMaterialId(materialId);
    } else {
      setSelectedMaterialId('');
    }
    const material = rawMaterials.find(m => m.id === materialId);
    if (material) {
      setPurchaseForm(prev => ({ ...prev, unit_cost: material.unit_cost }));
    }
    setMaterialSearch('');
    setShowPurchaseModal(true);
  };

  const totalPurchasesValue = materialPurchases
    .filter(p => {
      const date = new Date(p.purchase_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.total_cost, 0);

  // Statistics calculations
  const statsData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (statsPeriod === 'week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
    } else if (statsPeriod === 'month') {
      startDate = startOfMonth(now);
    } else {
      startDate = startOfYear(now);
    }

    const periodPurchases = materialPurchases.filter(p => isAfter(new Date(p.purchase_date), startDate));

    const byMaterial: Record<string, { name: string; quantity: number; cost: number; unit: string }> = {};
    for (const p of periodPurchases) {
      const key = p.material_id;
      if (!byMaterial[key]) {
        byMaterial[key] = {
          name: p.material?.name || 'Inconnu',
          quantity: 0,
          cost: 0,
          unit: p.material?.unit || 'kg',
        };
      }
      byMaterial[key].quantity += p.quantity;
      byMaterial[key].cost += p.total_cost;
    }

    const chartData = Object.values(byMaterial)
      .sort((a, b) => b.quantity - a.quantity)
      .map(d => ({ name: d.name, Quantité: d.quantity, Coût: d.cost, unit: d.unit }));

    const totalQuantity = chartData.reduce((s, d) => s + d.Quantité, 0);
    const totalCost = chartData.reduce((s, d) => s + d.Coût, 0);

    return { chartData, totalQuantity, totalCost, count: periodPurchases.length };
  }, [materialPurchases, statsPeriod]);

  const supplierStats = useMemo(() => {
    const total = supplierPurchases.reduce((s, p) => s + p.total_amount, 0);
    const paid = supplierPurchases.reduce((s, p) => s + p.amount_paid, 0);
    return { total, paid, reste: total - paid, count: supplierPurchases.length };
  }, [supplierPurchases]);

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        const updated = await api.suppliersService.update(editingSupplier.id, supplierForm);
        setSuppliers(suppliers.map(s => s.id === updated.id ? updated : s));
      } else {
        const created = await api.suppliersService.create(supplierForm);
        setSuppliers([...suppliers, created]);
      }
      setShowSupplierModal(false);
      setEditingSupplier(null);
      setSupplierForm({ name: '', category: '', phone: '', address: '', notes: '' });
    } catch (err) { console.error(err); }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Supprimer ce fournisseur et tous ses achats ?')) return;
    try { await api.suppliersService.delete(id); setSuppliers(suppliers.filter(s => s.id !== id)); if (selectedSupplier?.id === id) setSelectedSupplier(null); }
    catch (err) { console.error(err); }
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({ name: s.name, category: s.category || '', phone: s.phone || '', address: s.address || '', notes: s.notes || '' });
    setShowSupplierModal(true);
  };

  const handleSupplierPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const total = supplierPurchaseForm.quantity * supplierPurchaseForm.unit_cost;
    try {
      if (editingSupplierPurchase) {
        const updated = await api.supplierPurchasesService.update(editingSupplierPurchase.id, {
          ...supplierPurchaseForm, total_amount: total, notes: supplierPurchaseForm.notes || undefined,
          invoice_number: supplierPurchaseForm.invoice_number || undefined,
        });
        setSupplierPurchases(supplierPurchases.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await api.supplierPurchasesService.create({
          ...supplierPurchaseForm, supplier_id: selectedSupplier.id, total_amount: total,
          notes: supplierPurchaseForm.notes || undefined, invoice_number: supplierPurchaseForm.invoice_number || undefined,
        });
        setSupplierPurchases([created, ...supplierPurchases]);
      }
      setShowSupplierPurchaseModal(false);
      setEditingSupplierPurchase(null);
      setSupplierPurchaseForm({ item_name: '', quantity: 1, unit: 'kg', unit_cost: 0, purchase_date: format(new Date(), 'yyyy-MM-dd'), amount_paid: 0, invoice_number: '', notes: '' });
    } catch (err) { console.error(err); }
  };

  const handleDeleteSupplierPurchase = async (id: string) => {
    if (!confirm('Supprimer cet achat ?')) return;
    try { await api.supplierPurchasesService.delete(id); setSupplierPurchases(supplierPurchases.filter(p => p.id !== id)); }
    catch (err) { console.error(err); }
  };

  const handleSupplierVersement = async (p: SupplierPurchase) => {
    const reste = p.total_amount - p.amount_paid;
    const amountStr = prompt(`Règlement pour "${p.item_name}"
Reste à régler: ${reste.toLocaleString()} DA
Montant du règlement:`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) return;
    try {
      const updated = await api.supplierPurchasesService.update(p.id, { amount_paid: p.amount_paid + amount });
      setSupplierPurchases(supplierPurchases.map(x => x.id === p.id ? updated : x));
    } catch (err) { console.error(err); }
  };

  const purchaseTotal = purchaseForm.quantity * purchaseForm.unit_cost;
  const resteAPayer = purchaseTotal - purchaseForm.amount_paid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matières Premières</h1>
          <p className="text-gray-500">Gestion des ingrédients et achats</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingMaterial(null);
              setMaterialForm({ name: '', unit: 'kg', unit_cost: 0, supplier: '' });
              setShowMaterialModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nouvelle Matière
          </button>
          <button
            onClick={() => openNewPurchase()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <ShoppingCart size={18} />
            Nouvel Achat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Package size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Matières</p>
              <p className="text-xl font-bold text-gray-900">{rawMaterials.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <ShoppingCart size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Achats ce mois</p>
              <p className="text-xl font-bold text-gray-900">{totalPurchasesValue.toLocaleString()} DZD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        <button onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'materials' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}>Matières Premières</button>
        <button onClick={() => setActiveTab('purchases')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'purchases' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}>Historique Achats</button>
        <button onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'stats' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}>Statistiques</button>
        <button onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'suppliers' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-700'}`}>Fournisseurs</button>
      </div>

      {/* Materials Table */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Unité</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix/Unité</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fournisseur</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Dernier Achat</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMaterials.map(material => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{material.name}</td>
                    <td className="px-4 py-3 text-gray-600">{material.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{material.unit_cost.toLocaleString()} DZD</td>
                    <td className="px-4 py-3 text-gray-600">{material.supplier || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {material.last_purchase_date
                        ? format(new Date(material.last_purchase_date), 'dd/MM/yyyy')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openNewPurchase(material.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Acheter"
                        >
                          <ShoppingCart size={16} />
                        </button>
                        <button
                          onClick={() => openEditMaterial(material)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMaterials.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              Aucune matière première trouvée
            </div>
          )}
        </div>
      )}

      {/* Purchases Table */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Matière</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Quantité</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix/Unité</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Reste</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map(purchase => {
                  const reste = purchase.total_cost - (purchase.amount_paid || 0);
                  return (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{purchase.material?.name || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{purchase.quantity} {purchase.material?.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{purchase.unit_cost.toLocaleString()} DZD</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{purchase.total_cost.toLocaleString()} DZD</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          {(['paid', 'unpaid', 'partial'] as PaymentStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => handleUpdatePurchaseStatus(purchase, s)}
                              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${
                                purchase.payment_status === s
                                  ? STATUS_STYLES[s]
                                  : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'
                              }`}
                            >
                              {STATUS_LABELS[s]}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {purchase.payment_status === 'partial' ? (
                          <button
                            onClick={() => {
                              const val = prompt('Montant déjà versé (DA):', String(purchase.amount_paid || 0));
                              if (val !== null) handleUpdatePurchaseAmountPaid(purchase, parseFloat(val) || 0);
                            }}
                            className="text-orange-600 font-medium hover:underline"
                          >
                            {reste.toLocaleString()} DZD
                          </button>
                        ) : purchase.payment_status === 'unpaid' ? (
                          <span className="text-red-600 font-medium">{reste.toLocaleString()} DZD</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleDeletePurchase(purchase.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredPurchases.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              Aucun achat trouvé
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setStatsPeriod(p)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statsPeriod === p
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {p === 'week' ? 'Cette semaine' : p === 'month' ? 'Ce mois' : 'Cette année'}
              </button>
            ))}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg"><BarChart3 size={20} className="text-amber-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Achats ({statsPeriod === 'week' ? 'semaine' : statsPeriod === 'month' ? 'mois' : 'année'})</p>
                  <p className="text-xl font-bold text-gray-900">{statsData.count}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><Package size={20} className="text-blue-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Quantité totale</p>
                  <p className="text-xl font-bold text-gray-900">{statsData.totalQuantity.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp size={20} className="text-emerald-600" /></div>
                <div>
                  <p className="text-sm text-gray-500">Coût total</p>
                  <p className="text-xl font-bold text-gray-900">{statsData.totalCost.toLocaleString()} DZD</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          {statsData.chartData.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Consommation par matière première</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={statsData.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'Coût') return `${value.toLocaleString()} DZD`;
                      return value.toLocaleString();
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Quantité" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Coût" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
              <BarChart3 size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Aucune donnée pour cette période</p>
            </div>
          )}

          {/* Table */}
          {statsData.chartData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Matière Première</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Quantité</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Coût Total</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix moyen/Unité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {statsData.chartData.map((d) => (
                      <tr key={d.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{d.Quantité.toLocaleString()} {d.unit}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{d.Coût.toLocaleString()} DZD</td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {d.Quantité > 0 ? (d.Coût / d.Quantité).toLocaleString() : 0} DZD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        selectedSupplier ? (
          <div className="space-y-4">
            <button onClick={() => setSelectedSupplier(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
              <ArrowLeft size={18} /> Retour aux fournisseurs
            </button>

            {/* Supplier header */}
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><Truck size={24} /></div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedSupplier.name}</h2>
                    {selectedSupplier.category && <p className="text-white/80 text-sm">{selectedSupplier.category}</p>}
                    {selectedSupplier.phone && <p className="text-white/80 text-sm">Tel: {selectedSupplier.phone}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingSupplier(selectedSupplier); setSupplierForm({ name: selectedSupplier.name, category: selectedSupplier.category || '', phone: selectedSupplier.phone || '', address: selectedSupplier.address || '', notes: selectedSupplier.notes || '' }); setShowSupplierModal(true); }}
                    className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30"><Edit2 size={14} /></button>
                  <button onClick={() => { setSupplierPurchaseForm({ item_name: '', quantity: 1, unit: 'kg', unit_cost: 0, purchase_date: format(new Date(), 'yyyy-MM-dd'), amount_paid: 0, invoice_number: '', notes: '' }); setEditingSupplierPurchase(null); setShowSupplierPurchaseModal(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-medium shadow-sm"><Plus size={16} /> Achat</button>
                </div>
              </div>
            </div>

            {/* Supplier stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500 mb-1">Achats</p><p className="text-2xl font-bold text-gray-900">{supplierStats.count}</p></div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500 mb-1">Montant Global</p><p className="text-2xl font-bold text-gray-900">{supplierStats.total.toLocaleString()}</p></div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100"><p className="text-xs text-emerald-600 font-medium mb-1">Versé</p><p className="text-2xl font-bold text-emerald-700">{supplierStats.paid.toLocaleString()}</p></div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100"><p className="text-xs text-red-600 font-medium mb-1">Reste à Régler</p><p className="text-2xl font-bold text-red-700">{supplierStats.reste.toLocaleString()}</p></div>
            </div>

            {/* Purchases table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Article</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Qté</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Versé</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Reste</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplierPurchases.map(p => {
                      const reste = p.total_amount - p.amount_paid;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-600 text-sm">{format(new Date(p.purchase_date), 'dd/MM/yyyy')}</td>
                          <td className="px-4 py-3 font-medium text-gray-900 text-sm">{p.item_name}</td>
                          <td className="px-4 py-3 text-right text-gray-600 text-sm">{p.quantity} {p.unit}</td>
                          <td className="px-4 py-3 text-right text-gray-600 text-sm">{p.unit_cost.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">{p.total_amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-emerald-600 text-sm">{p.amount_paid.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-red-600 text-sm">{reste.toLocaleString()}</td>
                          <td className="px-4 py-3"><div className="flex justify-end gap-1">
                            <button onClick={() => handleSupplierVersement(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Règlement"><Wallet size={15} /></button>
                            <button onClick={() => { setEditingSupplierPurchase(p); setSupplierPurchaseForm({ item_name: p.item_name, quantity: p.quantity, unit: p.unit, unit_cost: p.unit_cost, purchase_date: p.purchase_date, amount_paid: p.amount_paid, invoice_number: p.invoice_number || '', notes: p.notes || '' }); setShowSupplierPurchaseModal(true); }} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title="Modifier"><Edit2 size={15} /></button>
                            <button onClick={() => handleDeleteSupplierPurchase(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={15} /></button>
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {supplierPurchases.length > 0 && (
                    <tfoot className="bg-gray-50"><tr>
                      <td colSpan={4} className="px-4 py-3 font-bold text-right">Total Global</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{supplierStats.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{supplierStats.paid.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{supplierStats.reste.toLocaleString()}</td>
                      <td />
                    </tr></tfoot>
                  )}
                </table>
              </div>
              {supplierPurchases.length === 0 && <div className="p-8 text-center text-gray-400">Aucun achat enregistré</div>}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', category: '', phone: '', address: '', notes: '' }); setShowSupplierModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-sm">
                <Plus size={18} /> Nouveau Fournisseur
              </button>
            </div>
            {suppliers.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
                <Truck size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Aucun fournisseur enregistré</p>
                <p className="text-sm mt-1">Cliquez sur "Nouveau Fournisseur" pour commencer</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map(s => (
                  <button key={s.id} onClick={() => setSelectedSupplier(s)}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-blue-300 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white flex-shrink-0"><Truck size={20} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors flex items-center gap-1">{s.name}<ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500" /></p>
                        {s.category && <p className="text-xs text-gray-500">{s.category}</p>}
                      </div>
                    </div>
                    {s.phone && <p className="text-xs text-gray-500">Tel: {s.phone}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingSupplier ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}</h2>
              <button onClick={() => setShowSupplierModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSupplierSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Sammar / Kouba / Blida" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <input type="text" value={supplierForm.category} onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Oeufs, Emballage, Sucre" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={supplierForm.notes} rows={2} onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">{editingSupplier ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Purchase Modal */}
      {showSupplierPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">{editingSupplierPurchase ? 'Modifier Achat' : 'Nouvel Achat'}</h2>
              <button onClick={() => setShowSupplierPurchaseModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSupplierPurchaseSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Article *</label>
                <input type="text" required value={supplierPurchaseForm.item_name} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, item_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Oeufs, Emballage" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qté</label>
                  <input type="number" step="0.01" min="0" required value={supplierPurchaseForm.quantity} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <input type="text" value={supplierPurchaseForm.unit} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix/U</label>
                  <input type="number" min="0" step="0.01" required value={supplierPurchaseForm.unit_cost} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={supplierPurchaseForm.purchase_date} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Versement (DA)</label>
                <input type="number" min="0" value={supplierPurchaseForm.amount_paid} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, amount_paid: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Facture</label>
                <input type="text" value={supplierPurchaseForm.invoice_number} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg flex justify-between">
                <span className="text-sm text-blue-800">Total: <b>{(supplierPurchaseForm.quantity * supplierPurchaseForm.unit_cost).toLocaleString()} DA</b></span>
                <span className="text-sm text-red-600">Reste: {((supplierPurchaseForm.quantity * supplierPurchaseForm.unit_cost) - supplierPurchaseForm.amount_paid).toLocaleString()} DA</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSupplierPurchaseModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">{editingSupplierPurchase ? 'Modifier' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">{editingMaterial ? 'Modifier' : 'Nouvelle'} Matière</h2>
              <button onClick={() => setShowMaterialModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMaterialSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={materialForm.name}
                  onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ex: Poudre d'amande"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <select
                    value={materialForm.unit}
                    onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="g">Gramme (g)</option>
                    <option value="L">Litre (L)</option>
                    <option value="ml">Millilitre (ml)</option>
                    <option value="unité">Unité</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix/Unité (DZD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={materialForm.unit_cost}
                    onChange={e => setMaterialForm({ ...materialForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur (optionnel)</label>
                <input
                  type="text"
                  value={materialForm.supplier}
                  onChange={e => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Nom du fournisseur"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  {editingMaterial ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Nouvel Achat</h2>
              <button onClick={() => setShowPurchaseModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePurchaseSubmit} className="p-4 space-y-4">
              {/* Searchable Material Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matière Première</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher une matière..."
                    value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto border rounded-lg divide-y divide-gray-100">
                  {dropdownMaterials.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPurchaseForm({ ...purchaseForm, material_id: m.id, unit_cost: m.unit_cost });
                        setMaterialSearch('');
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        purchaseForm.material_id === m.id
                          ? 'bg-amber-50 text-amber-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {m.name} <span className="text-gray-400">({m.unit}) — {m.unit_cost.toLocaleString()} DZD</span>
                    </button>
                  ))}
                  {dropdownMaterials.length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-400">Aucune matière trouvée</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={purchaseForm.quantity}
                    onChange={e => setPurchaseForm({ ...purchaseForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix/Unité (DZD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={purchaseForm.unit_cost}
                    onChange={e => setPurchaseForm({ ...purchaseForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'achat</label>
                <input
                  type="date"
                  required
                  value={purchaseForm.purchase_date}
                  onChange={e => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut de paiement</label>
                <div className="flex gap-2">
                  {(['paid', 'unpaid', 'partial'] as PaymentStatus[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPurchaseForm({
                        ...purchaseForm,
                        payment_status: s,
                        amount_paid: s === 'paid' ? purchaseTotal : s === 'unpaid' ? 0 : purchaseForm.amount_paid,
                      })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        purchaseForm.payment_status === s
                          ? STATUS_STYLES[s]
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_DOT[s]}`} />
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partial payment amount */}
              {purchaseForm.payment_status === 'partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant déjà versé (DZD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={purchaseTotal}
                    value={purchaseForm.amount_paid}
                    onChange={e => setPurchaseForm({ ...purchaseForm, amount_paid: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-sm text-orange-600 mt-1">
                    Reste à payer: <strong>{resteAPayer.toLocaleString()} DZD</strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Facture (optionnel)</label>
                <input
                  type="text"
                  value={purchaseForm.invoice_number}
                  onChange={e => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <textarea
                  value={purchaseForm.notes}
                  onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  rows={2}
                />
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-sm text-amber-800">
                  Total: <span className="font-bold">{purchaseTotal.toLocaleString()} DZD</span>
                  {purchaseForm.payment_status === 'partial' && (
                    <span className="ml-3 text-orange-600">Reste: {resteAPayer.toLocaleString()} DZD</span>
                  )}
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
