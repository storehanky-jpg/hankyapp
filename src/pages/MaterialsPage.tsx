import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search, Package, ShoppingCart, X, Truck, ChevronRight, ChevronDown, ChevronUp, Wallet, ArrowLeft, BarChart3, TrendingUp, Layers } from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfYear, subWeeks, subMonths, subYears, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
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

interface PurchaseLine {
  material_id: string;
  quantity: number;
  unit_cost: number;
}

const emptyPurchaseLine = (materialId: string): PurchaseLine => ({ material_id: materialId, quantity: 1, unit_cost: 0 });

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
  const [materialSearch, setMaterialSearch] = useState('');
  const [expandedPurchaseRow, setExpandedPurchaseRow] = useState<string | null>(null);

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
    name: '', unit: 'kg', unit_cost: 0, supplier: ''
  });

  // Multi-line purchase form
  const [purchaseForm, setPurchaseForm] = useState<{
    purchase_date: string;
    invoice_number: string;
    notes: string;
    payment_status: PaymentStatus;
    amount_paid: number;
    lines: PurchaseLine[];
  }>({
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    invoice_number: '',
    notes: '',
    payment_status: 'unpaid',
    amount_paid: 0,
    lines: [emptyPurchaseLine(rawMaterials[0]?.id || '')],
  });

  const dropdownMaterials = rawMaterials.filter(m =>
    m.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        const updated = await api.rawMaterialsService.update(editingMaterial.id, {
          name: materialForm.name, unit: materialForm.unit,
          unit_cost: materialForm.unit_cost, supplier: materialForm.supplier || undefined,
          last_purchase_date: format(new Date(), 'yyyy-MM-dd')
        });
        setRawMaterials(rawMaterials.map(m => m.id === updated.id ? updated : m));
      } else {
        const newMaterial = await api.rawMaterialsService.create({
          name: materialForm.name, unit: materialForm.unit,
          unit_cost: materialForm.unit_cost, supplier: materialForm.supplier || undefined
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

  const purchaseFormTotal = purchaseForm.lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0);
  const purchaseResteAPayer = purchaseFormTotal - purchaseForm.amount_paid;

  function addPurchaseLine() {
    setPurchaseForm(f => ({ ...f, lines: [...f.lines, emptyPurchaseLine(rawMaterials[0]?.id || '')] }));
  }
  function removePurchaseLine(idx: number) {
    setPurchaseForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  }
  function updatePurchaseLine(idx: number, field: keyof PurchaseLine, value: string | number) {
    setPurchaseForm(f => ({
      ...f,
      lines: f.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l),
    }));
  }
  function onPurchaseMaterialSelect(idx: number, materialId: string) {
    const mat = rawMaterials.find(m => m.id === materialId);
    setPurchaseForm(f => ({
      ...f,
      lines: f.lines.map((l, i) => i === idx ? {
        ...l, material_id: materialId, unit_cost: mat?.unit_cost ?? l.unit_cost,
      } : l),
    }));
  }

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseForm.lines.length === 0) return;
    try {
      const groupId = `PURGRP-${Date.now()}`;
      const total_cost = purchaseFormTotal;
      const amount_paid = purchaseForm.payment_status === 'paid' ? total_cost
        : purchaseForm.payment_status === 'partial' ? purchaseForm.amount_paid : 0;

      const newPurchases: MaterialPurchase[] = [];
      for (const line of purchaseForm.lines) {
        const lineTotal = line.quantity * line.unit_cost;
        const lineAmountPaid = purchaseForm.payment_status === 'paid' ? lineTotal
          : purchaseForm.payment_status === 'partial' ? (total_cost > 0 ? (amount_paid / total_cost) * lineTotal : 0) : 0;

        const newPurchase = await api.materialPurchasesService.create({
          material_id: line.material_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_cost: lineTotal,
          purchase_date: purchaseForm.purchase_date,
          invoice_number: purchaseForm.invoice_number || undefined,
          notes: purchaseForm.notes || undefined,
          payment_status: purchaseForm.payment_status,
          amount_paid: lineAmountPaid,
          purchase_group_id: groupId,
        });
        const material = rawMaterials.find(m => m.id === line.material_id);
        newPurchases.push({ ...newPurchase, material });

        await api.rawMaterialsService.update(line.material_id, {
          unit_cost: line.unit_cost,
          last_purchase_date: purchaseForm.purchase_date
        });
      }
      setMaterialPurchases([...newPurchases.reverse(), ...materialPurchases]);
      setShowPurchaseModal(false);
      setMaterialSearch('');
      setPurchaseForm({
        purchase_date: format(new Date(), 'yyyy-MM-dd'),
        invoice_number: '', notes: '', payment_status: 'unpaid', amount_paid: 0,
        lines: [emptyPurchaseLine(rawMaterials[0]?.id || '')],
      });
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Erreur lors de l\'enregistrement de l\'achat.');
    }
  };

  const handleUpdateGroupPaymentStatus = async (groupKey: string, status: PaymentStatus, amountPaid?: number) => {
    const groupPurchases = groupedPurchases.find(g => g.key === groupKey)?.purchases || [];
    try {
      for (const p of groupPurchases) {
        const updated = await api.materialPurchasesService.update(p.id, {
          payment_status: status,
          amount_paid: status === 'paid' ? p.total_cost : status === 'partial' ? (amountPaid ?? p.amount_paid ?? 0) : 0,
        });
        setMaterialPurchases(prev => prev.map(x => x.id === p.id ? updated : x));
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
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

  const handleDeletePurchaseGroup = async (groupKey: string) => {
    if (!confirm('Supprimer tous les achats de ce groupe?')) return;
    try {
      const groupPurchases = groupedPurchases.find(g => g.key === groupKey)?.purchases || [];
      for (const p of groupPurchases) {
        await api.materialPurchasesService.delete(p.id);
      }
      setMaterialPurchases(materialPurchases.filter(p => !groupPurchases.some(gp => gp.id === p.id)));
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const openEditMaterial = (material: RawMaterial) => {
    setEditingMaterial(material);
    setMaterialForm({
      name: material.name, unit: material.unit,
      unit_cost: material.unit_cost, supplier: material.supplier || ''
    });
    setShowMaterialModal(true);
  };

  const openNewPurchase = () => {
    setMaterialSearch('');
    setPurchaseForm({
      purchase_date: format(new Date(), 'yyyy-MM-dd'),
      invoice_number: '', notes: '', payment_status: 'unpaid', amount_paid: 0,
      lines: [emptyPurchaseLine(rawMaterials[0]?.id || '')],
    });
    setShowPurchaseModal(true);
  };

  const totalPurchasesValue = materialPurchases
    .filter(p => {
      const date = new Date(p.purchase_date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.total_cost, 0);

  const statsData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    if (statsPeriod === 'week') startDate = startOfWeek(now, { weekStartsOn: 1 });
    else if (statsPeriod === 'month') startDate = startOfMonth(now);
    else startDate = startOfYear(now);

    const periodPurchases = materialPurchases.filter(p => isAfter(new Date(p.purchase_date), startDate));
    const byMaterial: Record<string, { name: string; quantity: number; cost: number; unit: string }> = {};
    for (const p of periodPurchases) {
      const key = p.material_id;
      if (!byMaterial[key]) {
        byMaterial[key] = { name: p.material?.name || 'Inconnu', quantity: 0, cost: 0, unit: p.material?.unit || 'kg' };
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
    const amountStr = prompt(`Règlement pour "${p.item_name}"\nReste à régler: ${reste.toLocaleString()} DA\nMontant du règlement:`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) return;
    try {
      const updated = await api.supplierPurchasesService.update(p.id, { amount_paid: p.amount_paid + amount });
      setSupplierPurchases(supplierPurchases.map(x => x.id === p.id ? updated : x));
    } catch (err) { console.error(err); }
  };

  const filteredMaterials = rawMaterials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPurchases = materialPurchases.filter(p =>
    p.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group purchases by purchase_date (all purchases on same day = one row)
  const groupedPurchases = useMemo(() => {
    const groups: {
      key: string; purchases: MaterialPurchase[]; purchase_date: string;
      total: number; amount_paid: number; reste: number; count: number;
      payment_status: PaymentStatus;
    }[] = [];
    const groupMap: Record<string, number> = {};

    for (const p of filteredPurchases) {
      const key = p.purchase_date;
      if (groupMap[key] === undefined) {
        groupMap[key] = groups.length;
        groups.push({
          key, purchases: [], purchase_date: p.purchase_date,
          total: 0, amount_paid: 0, reste: 0, count: 0, payment_status: 'paid',
        });
      }
      const g = groups[groupMap[key]];
      g.purchases.push(p);
      g.total += p.total_cost;
      g.amount_paid += p.amount_paid || 0;
      g.count++;
    }

    for (const g of groups) {
      g.reste = g.total - g.amount_paid;
      if (g.reste <= 0) g.payment_status = 'paid';
      else if (g.amount_paid > 0) g.payment_status = 'partial';
      else g.payment_status = 'unpaid';
    }

    return groups.sort((a, b) => b.purchase_date.localeCompare(a.purchase_date));
  }, [filteredPurchases]);

  function renderPurchasePaymentBadge(group: typeof groupedPurchases[number]) {
    const status = group.payment_status;
    const colorClass = status === 'paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
      : status === 'partial' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      : 'bg-red-100 text-red-700 hover:bg-red-200';
    return (
      <button
        onClick={() => {
          if (status === 'paid') handleUpdateGroupPaymentStatus(group.key, 'unpaid');
          else if (status === 'unpaid') handleUpdateGroupPaymentStatus(group.key, 'paid');
          else {
            const amt = prompt('Montant versé (DA):', String(group.amount_paid));
            if (amt !== null) handleUpdateGroupPaymentStatus(group.key, 'partial', parseFloat(amt) || 0);
          }
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${colorClass}`}
        title="Cliquer pour changer le statut">
        {status === 'paid' && <><CheckCircle size={12} /> Payé</>}
        {status === 'unpaid' && <><XCircle size={12} /> Non payé</>}
        {status === 'partial' && <><Wallet size={12} /> Versement</>}
      </button>
    );
  }

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
            <Plus size={18} /> Nouvelle Matière
          </button>
          <button
            onClick={openNewPurchase}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <ShoppingCart size={18} /> Nouvel Achat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg"><Package size={20} className="text-amber-600" /></div>
            <div><p className="text-sm text-gray-500">Total Matières</p><p className="text-xl font-bold text-gray-900">{rawMaterials.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><ShoppingCart size={20} className="text-emerald-600" /></div>
            <div><p className="text-sm text-gray-500">Achats ce mois</p><p className="text-xl font-bold text-gray-900">{totalPurchasesValue.toLocaleString()} DZD</p></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Rechercher..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
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
                    <td className="px-4 py-3 text-gray-600">{material.last_purchase_date ? format(new Date(material.last_purchase_date), 'dd/MM/yyyy') : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEditMaterial(material)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Modifier"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteMaterial(material.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMaterials.length === 0 && <div className="p-8 text-center text-gray-400">Aucune matière première trouvée</div>}
        </div>
      )}

      {/* Purchases — grouped by date with expand/collapse */}
      {activeTab === 'purchases' && (
        <div className="space-y-3">
          {groupedPurchases.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
              <ShoppingCart size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium">Aucun achat enregistré</p>
            </div>
          )}
          {groupedPurchases.map(group => {
            const isExpanded = expandedPurchaseRow === group.key;
            const isMulti = group.purchases.length > 1;
            return (
              <div key={group.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Collapsed header */}
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <button onClick={() => setExpandedPurchaseRow(isExpanded ? null : group.key)}
                    className="p-0.5 text-gray-400 hover:text-gray-600" title="Voir détails">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{format(new Date(group.purchase_date), 'dd/MM/yyyy', { locale: fr })}</p>
                      {isMulti && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <Layers size={10} /> {group.count} produits
                        </span>
                      )}
                    </div>
                    {!isMulti && (
                      <p className="text-xs text-gray-400 mt-0.5">{group.purchases[0].material?.name || '-'} — {group.purchases[0].quantity} {group.purchases[0].material?.unit}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">{group.total.toLocaleString()} DZD</p>
                    {group.payment_status === 'partial' && (
                      <p className="text-xs text-orange-600">Reste: {group.reste.toLocaleString()} DZD</p>
                    )}
                  </div>
                  {renderPurchasePaymentBadge(group)}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleDeletePurchaseGroup(group.key)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="bg-amber-50/60 border-t border-gray-100 px-6 py-4">
                    {isMulti && (
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Produits de l'achat</p>
                        {group.purchases.map(p => (
                          <div key={p.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600">
                              <Package size={14} />
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{p.material?.name || 'Inconnu'}</span>
                              <span className="text-xs text-gray-500 ml-2">× {p.quantity} {p.material?.unit}</span>
                            </div>
                            <span className="text-sm text-gray-600">{p.unit_cost.toLocaleString()} DZD/{p.material?.unit}</span>
                            <span className="text-sm font-bold text-gray-900">{p.total_cost.toLocaleString()} DZD</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {group.payment_status === 'partial' && (
                      <div className="flex gap-4 bg-white rounded-lg p-3 border border-orange-100 mb-3">
                        <div><p className="text-xs text-gray-500">Total</p><p className="font-bold text-gray-900">{group.total.toLocaleString()} DZD</p></div>
                        <div><p className="text-xs text-gray-500">Versé</p><p className="font-bold text-emerald-600">{group.amount_paid.toLocaleString()} DZD</p></div>
                        <div><p className="text-xs text-gray-500">Reste à payer</p><p className="font-bold text-orange-600">{group.reste.toLocaleString()} DZD</p></div>
                      </div>
                    )}
                    {(group.purchases[0]?.invoice_number || group.purchases[0]?.notes) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {group.purchases[0]?.invoice_number && (
                          <div><p className="text-xs text-gray-500 font-medium mb-1">N° Facture</p><p className="font-semibold text-gray-800">{group.purchases[0].invoice_number}</p></div>
                        )}
                        {group.purchases[0]?.notes && (
                          <div><p className="text-xs text-gray-500 font-medium mb-1">Notes</p><p className="text-gray-700">{group.purchases[0].notes}</p></div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setStatsPeriod(p)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  statsPeriod === p ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}>
                {p === 'week' ? 'Cette semaine' : p === 'month' ? 'Ce mois' : 'Cette année'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg"><BarChart3 size={20} className="text-amber-600" /></div>
                <div><p className="text-sm text-gray-500">Achats ({statsPeriod === 'week' ? 'semaine' : statsPeriod === 'month' ? 'mois' : 'année'})</p><p className="text-xl font-bold text-gray-900">{statsData.count}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><Package size={20} className="text-blue-600" /></div>
                <div><p className="text-sm text-gray-500">Quantité totale</p><p className="text-xl font-bold text-gray-900">{statsData.totalQuantity.toLocaleString()}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp size={20} className="text-emerald-600" /></div>
                <div><p className="text-sm text-gray-500">Coût total</p><p className="text-xl font-bold text-gray-900">{statsData.totalCost.toLocaleString()} DZD</p></div>
              </div>
            </div>
          </div>
          {statsData.chartData.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Consommation par matière première</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={statsData.chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number, name: string) => { if (name === 'Coût') return `${value.toLocaleString()} DZD`; return value.toLocaleString(); }} />
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
                        <td className="px-4 py-3 text-right text-gray-600">{d.Quantité > 0 ? (d.Coût / d.Quantité).toLocaleString() : 0} DZD</td>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500 mb-1">Achats</p><p className="text-2xl font-bold text-gray-900">{supplierStats.count}</p></div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500 mb-1">Montant Global</p><p className="text-2xl font-bold text-gray-900">{supplierStats.total.toLocaleString()}</p></div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100"><p className="text-xs text-emerald-600 font-medium mb-1">Versé</p><p className="text-2xl font-bold text-emerald-700">{supplierStats.paid.toLocaleString()}</p></div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100"><p className="text-xs text-red-600 font-medium mb-1">Reste à Régler</p><p className="text-2xl font-bold text-red-700">{supplierStats.reste.toLocaleString()}</p></div>
            </div>
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
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" required value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Sammar / Kouba / Blida" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <input type="text" value={supplierForm.category} onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Oeufs, Emballage, Sucre" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input type="text" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={supplierForm.notes} rows={2} onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" /></div>
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
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Article *</label>
                <input type="text" required value={supplierPurchaseForm.item_name} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, item_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Oeufs, Emballage" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Qté</label>
                  <input type="number" step="0.01" min="0" required value={supplierPurchaseForm.quantity} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <input type="text" value={supplierPurchaseForm.unit} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix/U</label>
                  <input type="number" min="0" step="0.01" required value={supplierPurchaseForm.unit_cost} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" required value={supplierPurchaseForm.purchase_date} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Versement (DA)</label>
                <input type="number" min="0" value={supplierPurchaseForm.amount_paid} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, amount_paid: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Facture</label>
                <input type="text" value={supplierPurchaseForm.invoice_number} onChange={e => setSupplierPurchaseForm({ ...supplierPurchaseForm, invoice_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg" /></div>
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
              <button onClick={() => setShowMaterialModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleMaterialSubmit} className="p-4 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" required value={materialForm.name} onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="Ex: Poudre d'amande" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <select value={materialForm.unit} onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="g">Gramme (g)</option>
                    <option value="L">Litre (L)</option>
                    <option value="ml">Millilitre (ml)</option>
                    <option value="unité">Unité</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prix/Unité (DZD)</label>
                  <input type="number" step="0.01" min="0" required value={materialForm.unit_cost} onChange={e => setMaterialForm({ ...materialForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur (optionnel)</label>
                <input type="text" value={materialForm.supplier} onChange={e => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="Nom du fournisseur" /></div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowMaterialModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">{editingMaterial ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-line Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">Nouvel Achat</h2>
              <button onClick={() => setShowPurchaseModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handlePurchaseSubmit} className="p-5 space-y-4">

              {/* Date + invoice */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Date d'achat</label>
                    <input type="date" required value={purchaseForm.purchase_date}
                      onChange={e => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">N° Facture (optionnel)</label>
                    <input type="text" value={purchaseForm.invoice_number}
                      onChange={e => setPurchaseForm({ ...purchaseForm, invoice_number: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500" /></div>
                </div>
              </div>

              {/* Multi-line products */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Produits de l'achat</p>
                  <button type="button" onClick={addPurchaseLine}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">
                    <Plus size={14} /> Ajouter un produit
                  </button>
                </div>

                {/* Searchable material list */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Rechercher une matière..." value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
                </div>

                {/* Material quick-select grid (compact) */}
                <div className="max-h-32 overflow-y-auto border rounded-lg divide-y divide-gray-100 mb-2">
                  {dropdownMaterials.map(m => (
                    <button key={m.id} type="button"
                      onClick={() => {
                        setPurchaseForm(f => ({ ...f, lines: [...f.lines, { material_id: m.id, quantity: 1, unit_cost: m.unit_cost }] }));
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 text-gray-700 transition-colors">
                      {m.name} <span className="text-gray-400">({m.unit}) — {m.unit_cost.toLocaleString()} DZD</span>
                    </button>
                  ))}
                  {dropdownMaterials.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">Aucune matière trouvée</p>}
                </div>

                {/* Active lines */}
                <div className="space-y-2">
                  {purchaseForm.lines.map((line, idx) => {
                    const mat = rawMaterials.find(m => m.id === line.material_id);
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                        <div className="flex-1 min-w-0">
                          {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Matière</label>}
                          <select value={line.material_id}
                            onChange={e => onPurchaseMaterialSelect(idx, e.target.value)}
                            className="w-full px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-amber-500">
                            {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                          </select>
                        </div>
                        <div className="w-20 flex-shrink-0">
                          {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Qté</label>}
                          <input type="number" step="0.01" min="0" required value={line.quantity}
                            onChange={e => updatePurchaseLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border rounded text-sm" />
                        </div>
                        <div className="w-24 flex-shrink-0">
                          {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Prix/U</label>}
                          <input type="number" step="0.01" min="0" required value={line.unit_cost}
                            onChange={e => updatePurchaseLine(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border rounded text-sm" />
                        </div>
                        <div className="text-right w-20 flex-shrink-0">
                          {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Total</label>}
                          <p className="text-sm font-bold text-gray-900 py-1.5">{(line.quantity * line.unit_cost).toLocaleString()}</p>
                        </div>
                        <button type="button" onClick={() => removePurchaseLine(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-emerald-50 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm text-emerald-700 font-medium">Total général:</span>
                  <span className="text-xl font-bold text-emerald-700">{purchaseFormTotal.toLocaleString()} DZD</span>
                </div>
              </div>

              {/* Payment status */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiement</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut de paiement</label>
                  <div className="flex gap-2">
                    {(['paid', 'unpaid', 'partial'] as PaymentStatus[]).map(s => (
                      <button key={s} type="button"
                        onClick={() => setPurchaseForm({
                          ...purchaseForm, payment_status: s,
                          amount_paid: s === 'paid' ? purchaseFormTotal : s === 'unpaid' ? 0 : purchaseForm.amount_paid,
                        })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          purchaseForm.payment_status === s ? STATUS_STYLES[s] : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${STATUS_DOT[s]}`} />
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
                {purchaseForm.payment_status === 'partial' && (
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total: <strong>{purchaseFormTotal.toLocaleString()} DZD</strong></span>
                      <span className="text-orange-600">Reste: <strong>{purchaseResteAPayer.toLocaleString()} DZD</strong></span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Montant déjà versé (DZD)</label>
                      <input type="number" step="0.01" min="0" max={purchaseFormTotal} value={purchaseForm.amount_paid}
                        onChange={e => setPurchaseForm({ ...purchaseForm, amount_paid: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                  <textarea value={purchaseForm.notes} onChange={e => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500" rows={2} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
                <button type="submit"
                  className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium text-sm">
                  Enregistrer l'achat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
