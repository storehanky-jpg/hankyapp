import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit2, X, Phone, Mail, MapPin,
  Users, ShoppingBag, Tag, Save, Search, ChevronRight,
  Scale, Package, Store, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { Customer } from '../types';
import CustomerDetailPage from './CustomerDetailPage';

const PRODUCT_TYPES = [
  { type: 'vrac', label: 'Vrac', fullLabel: 'Macaron en Vrac', defaultPrice: 1800, unitLabel: 'kg', icon: <Scale size={16} />, color: 'amber' },
  { type: 'boite20', label: 'Boîte 20', fullLabel: 'Boîte 20 pcs', defaultPrice: 1100, unitLabel: 'boîte', icon: <Package size={16} />, color: 'emerald' },
  { type: 'boite10', label: 'Boîte 10', fullLabel: 'Boîte 10 pcs', defaultPrice: 600, unitLabel: 'boîte', icon: <Package size={16} />, color: 'teal' },
  { type: 'boite6', label: 'Boîte 6', fullLabel: 'Boîte 06 pcs', defaultPrice: 400, unitLabel: 'boîte', icon: <Package size={16} />, color: 'cyan' },
  { type: 'magasin', label: 'Magasin', fullLabel: 'Coques Magasin', defaultPrice: 40, unitLabel: 'pcs', icon: <Store size={16} />, color: 'blue' },
] as const;

interface ProductPriceEntry { product_type: string; label: string; unit_price: number; unit_label: string; id?: string }

function emptyForm() {
  return {
    name: '', phone: '', email: '', address: '', notes: '',
    productPrices: PRODUCT_TYPES.map(pt => ({
      product_type: pt.type, label: pt.fullLabel, unit_price: pt.defaultPrice, unit_label: pt.unitLabel,
    })) as ProductPriceEntry[],
  };
}

const colorMap: Record<string, { bg: string; text: string; border: string; light: string }> = {
  amber: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-50' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-50' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200', light: 'bg-teal-50' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-700', border: 'border-cyan-200', light: 'bg-cyan-50' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', light: 'bg-blue-50' },
};

export default function CustomersPage() {
  const { customers, setCustomers, sales } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const salesByCustomer = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    sales.forEach(s => {
      if (s.customer_id) {
        if (!map[s.customer_id]) map[s.customer_id] = { count: 0, total: 0 };
        map[s.customer_id].count++;
        map[s.customer_id].total += s.total_amount;
      }
    });
    return map;
  }, [sales]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  function openAdd() {
    setEditCustomer(null);
    setForm(emptyForm());
    setShowModal(true);
  }

  function openEdit(c: Customer) {
    setEditCustomer(c);
    const existingProductPrices = PRODUCT_TYPES.map(pt => {
      const found = c.prices?.find(p => p.product_type === pt.type);
      return {
        product_type: pt.type, label: pt.fullLabel,
        unit_price: found?.unit_price ?? pt.defaultPrice,
        unit_label: pt.unitLabel, id: found?.id,
      };
    });
    setForm({
      name: c.name, phone: c.phone || '', email: c.email || '',
      address: c.address || '', notes: c.notes || '',
      productPrices: existingProductPrices,
    });
    setShowModal(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
      };
      let customerId: string;
      if (editCustomer) {
        await api.customersService.update(editCustomer.id, payload);
        customerId = editCustomer.id;
      } else {
        const created = await api.customersService.create(payload);
        customerId = created.id;
      }
      await Promise.all(
        form.productPrices.map(pp =>
          api.customerPricesService.upsertByType(customerId, pp.product_type, pp.unit_price, pp.unit_label)
        )
      );
      const updated = await api.customersService.getAll();
      setCustomers(updated);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving customer:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client et tous ses prix ?')) return;
    try {
      await api.customersService.delete(id);
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  function updateProductPrice(productType: string, value: number) {
    setForm(f => ({
      ...f,
      productPrices: f.productPrices.map(p => p.product_type === productType ? { ...p, unit_price: value } : p)
    }));
  }

  if (selectedCustomer) {
    const current = customers.find(c => c.id === selectedCustomer.id) || selectedCustomer;
    return <CustomerDetailPage customer={current} onBack={() => setSelectedCustomer(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm">Gérez vos clients et leurs tarifs personnalisés</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md font-medium text-sm">
          <Plus size={18} /> Nouveau Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Total Clients</p>
              <p className="text-3xl font-bold mt-1">{customers.length}</p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl"><Users size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Clients avec ventes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{Object.keys(salesByCustomer).length}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl"><ShoppingBag size={22} className="text-amber-600" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">CA clients identifiés</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{Object.values(salesByCustomer).reduce((s, v) => s + v.total, 0).toLocaleString()} <span className="text-sm font-normal text-gray-400">DA</span></p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl"><Tag size={22} className="text-blue-600" /></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <Search size={16} className="text-gray-400" />
        <input type="text" placeholder="Rechercher par nom, téléphone, email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
            <Users size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Aucun client enregistré</p>
            <p className="text-sm mt-1">Cliquez sur "Nouveau Client" pour commencer</p>
          </div>
        )}

        {filtered.map(customer => {
          const stats = salesByCustomer[customer.id];
          return (
            <div key={customer.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-emerald-200 transition-all group">
              {/* Card header */}
              <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => setSelectedCustomer(customer)} className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                    {customer.name}
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500" />
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {customer.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} /> {customer.phone}</span>}
                    {customer.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {customer.email}</span>}
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(customer)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Modifier">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Price chips */}
              <div className="px-5 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {PRODUCT_TYPES.map(pt => {
                    const cp = customer.prices?.find(p => p.product_type === pt.type);
                    const price = cp ? Number(cp.unit_price) : pt.defaultPrice;
                    const c = colorMap[pt.color];
                    return (
                      <span key={pt.type} className={`inline-flex items-center gap-1 px-2.5 py-1 ${c.light} ${c.text} border ${c.border} rounded-lg text-xs font-medium`}>
                        {pt.icon}
                        {pt.label}: <strong className="ml-0.5">{price.toLocaleString()}</strong>
                        <span className="text-gray-400 font-normal">/{pt.unitLabel}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Footer stats */}
              {stats && (
                <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-gray-400" />
                    {stats.count} vente{stats.count > 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-emerald-700">{stats.total.toLocaleString()} DA</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editCustomer ? 'Modifier le Client' : 'Nouveau Client'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Infos client */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles size={12} /> Informations
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="Nom du client" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Phone size={12} /> Téléphone</label>
                    <input type="tel" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="06XX XX XX XX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Mail size={12} /> Email</label>
                    <input type="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="email@exemple.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin size={12} /> Adresse</label>
                  <input type="text" value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Adresse du client" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" rows={2}
                    placeholder="Informations supplémentaires..." />
                </div>
              </div>

              {/* Prix par produit */}
              <div className="bg-emerald-50 rounded-xl p-4 space-y-3 border border-emerald-100">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                    <Tag size={12} /> Tarifs personnalisés
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">Ces prix s'appliquent automatiquement lors d'une vente à ce client.</p>
                </div>
                <div className="space-y-2">
                  {form.productPrices.map((p, idx) => {
                    const pt = PRODUCT_TYPES[idx];
                    const c = colorMap[pt.color];
                    return (
                      <div key={p.product_type} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-emerald-100">
                        <div className={`w-9 h-9 rounded-lg ${c.light} ${c.text} flex items-center justify-center flex-shrink-0`}>
                          {pt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-700">{pt.fullLabel}</span>
                          <p className="text-xs text-gray-400">Défaut: {pt.defaultPrice} DA/{pt.unitLabel}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input type="number" min="0" step="10" value={p.unit_price}
                            onChange={e => updateProductPrice(p.product_type, parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 border rounded-lg text-sm text-right font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500" />
                          <span className="text-sm text-gray-400 w-12">DA/{p.unit_label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium text-sm disabled:opacity-60 transition-colors">
                  <Save size={15} />
                  {saving ? 'Enregistrement...' : editCustomer ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
