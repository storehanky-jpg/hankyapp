import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Plus, Trash2, Edit2, X, Save, Phone, Mail, MapPin,
  CheckCircle, XCircle, Scale, Package, Store, Tag, Search
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { Customer, CustomerProduct } from '../types';

interface Props {
  customer: Customer;
  onBack: () => void;
}

type ProductType = 'vrac' | 'boite' | 'magasin';

const PRODUCT_TYPES: { id: ProductType; label: string; icon: React.ReactNode; defaultUnit: string }[] = [
  { id: 'vrac', label: 'Macaron en Vrac', icon: <Scale size={16} />, defaultUnit: 'kg' },
  { id: 'boite', label: 'Boîte de Macarons', icon: <Package size={16} />, defaultUnit: 'pcs' },
  { id: 'magasin', label: 'Magasin Coques', icon: <Store size={16} />, defaultUnit: 'pcs' },
];

const DEFAULT_LABELS: Record<ProductType, string> = {
  vrac: 'Macaron en vrac',
  boite: 'Boîte 20 pcs',
  magasin: 'Coque individuelle',
};

const DEFAULT_PRICES: Record<ProductType, number> = {
  vrac: 1800,
  boite: 1100,
  magasin: 40,
};

interface FormState {
  product_type: ProductType;
  label: string;
  unit_label: string;
  unit_price: number;
  is_paid: boolean;
  notes: string;
}

function emptyForm(): FormState {
  return {
    product_type: 'boite',
    label: DEFAULT_LABELS.boite,
    unit_label: 'pcs',
    unit_price: DEFAULT_PRICES.boite,
    is_paid: false,
    notes: '',
  };
}

export default function CustomerDetailPage({ customer, onBack }: Props) {
  const { setCustomers, customers } = useApp();
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<CustomerProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.customerProductsService.getByCustomer(customer.id);
        if (mounted) setProducts(data);
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [customer.id]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.label.toLowerCase().includes(q) ||
      p.product_type.toLowerCase().includes(q)
    );
  }, [products, search]);

  const paidTotal = products.filter(p => p.is_paid).reduce((s, p) => s + p.unit_price, 0);
  const unpaidTotal = products.filter(p => !p.is_paid).reduce((s, p) => s + p.unit_price, 0);
  const grandTotal = paidTotal + unpaidTotal;

  function openAdd() {
    setEditProduct(null);
    setForm(emptyForm());
    setShowModal(true);
  }

  function openEdit(p: CustomerProduct) {
    setEditProduct(p);
    setForm({
      product_type: p.product_type,
      label: p.label,
      unit_label: p.unit_label,
      unit_price: p.unit_price,
      is_paid: p.is_paid,
      notes: p.notes || '',
    });
    setShowModal(true);
  }

  function handleTypeChange(type: ProductType) {
    setForm(f => ({
      ...f,
      product_type: type,
      label: DEFAULT_LABELS[type],
      unit_label: PRODUCT_TYPES.find(t => t.id === type)?.defaultUnit || 'pcs',
      unit_price: DEFAULT_PRICES[type],
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        customer_id: customer.id,
        product_type: form.product_type,
        label: form.label,
        unit_label: form.unit_label,
        unit_price: form.unit_price,
        is_paid: form.is_paid,
        notes: form.notes || undefined,
      };
      if (editProduct) {
        const updated = await api.customerProductsService.update(editProduct.id, payload);
        setProducts(products.map(p => p.id === editProduct.id ? updated : p));
      } else {
        const created = await api.customerProductsService.create(payload);
        setProducts([...products, created]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try {
      await api.customerProductsService.delete(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const togglePaid = async (p: CustomerProduct) => {
    try {
      const updated = await api.customerProductsService.update(p.id, { is_paid: !p.is_paid });
      setProducts(products.map(x => x.id === p.id ? updated : x));
    } catch (err) {
      console.error('Error toggling paid status:', err);
    }
  };

  const updatePriceInline = async (p: CustomerProduct, newPrice: number) => {
    if (newPrice === p.unit_price) return;
    try {
      const updated = await api.customerProductsService.update(p.id, { unit_price: newPrice });
      setProducts(products.map(x => x.id === p.id ? updated : x));
    } catch (err) {
      console.error('Error updating price:', err);
    }
  };

  const typeMeta = (type: ProductType) => PRODUCT_TYPES.find(t => t.id === type);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
        <ArrowLeft size={18} /> Retour aux clients
      </button>

      {/* Customer header card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-white/90 text-sm">
              {customer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {customer.phone}</span>}
              {customer.email && <span className="flex items-center gap-1"><Mail size={12} /> {customer.email}</span>}
              {customer.address && <span className="flex items-center gap-1"><MapPin size={12} /> {customer.address}</span>}
            </div>
            {customer.notes && <p className="mt-2 text-white/80 text-sm italic">{customer.notes}</p>}
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors font-medium text-sm shadow-sm flex-shrink-0">
            <Plus size={18} /> Ajouter Produit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Total Produits</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium mb-1">Payé</p>
          <p className="text-2xl font-bold text-emerald-700">{paidTotal.toLocaleString()} DA</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-red-600 font-medium mb-1">Non payé</p>
          <p className="text-2xl font-bold text-red-700">{unpaidTotal.toLocaleString()} DA</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-lg">
          <p className="text-white/80 text-xs mb-1">Total Général</p>
          <p className="text-2xl font-bold">{grandTotal.toLocaleString()} DA</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search size={16} className="text-gray-400" />
        <input type="text" placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      {/* Products list */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-emerald-500 mx-auto mb-3" />
          <p>Chargement des produits...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <Tag size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="font-medium">Aucun produit enregistré</p>
          <p className="text-sm mt-1">Cliquez sur "Ajouter Produit" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => {
            const meta = typeMeta(product.product_type);
            return (
              <div key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
                <div className="flex items-center gap-3 px-4 py-4">
                  {/* Type icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    product.product_type === 'vrac' ? 'bg-blue-100 text-blue-600' :
                    product.product_type === 'boite' ? 'bg-amber-100 text-amber-600' :
                    'bg-violet-100 text-violet-600'
                  }`}>
                    {meta?.icon}
                  </div>

                  {/* Label + type */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{product.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{meta?.label}</p>
                  </div>

                  {/* Price (inline editable) */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      defaultValue={product.unit_price}
                      onBlur={e => updatePriceInline(product, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-right text-sm font-bold text-amber-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <span className="text-xs text-gray-400 whitespace-nowrap">DA/{product.unit_label}</span>
                  </div>

                  {/* Paid status */}
                  <button
                    onClick={() => togglePaid(product)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                      product.is_paid
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                    title="Cliquer pour changer le statut"
                  >
                    {product.is_paid ? <><CheckCircle size={12} /> Payé</> : <><XCircle size={12} /> Non payé</>}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(product)}
                      className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Modifier">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(product.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {product.notes && (
                  <div className="px-4 pb-3 -mt-1">
                    <p className="text-xs text-gray-500 italic">{product.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">
                {editProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Product type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de produit</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRODUCT_TYPES.map(t => (
                    <button key={t.id} type="button"
                      onClick={() => handleTypeChange(t.id)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                        form.product_type === t.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {t.icon}
                      <span className="text-xs font-medium text-center leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Désignation</label>
                <input type="text" required value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="Ex: Boîte de 20 pcs, Macaron en vrac..." />
              </div>

              {/* Price + unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (DA)</label>
                  <input type="number" min="0" step="10" required value={form.unit_price}
                    onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-amber-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <input type="text" required value={form.unit_label}
                    onChange={e => setForm({ ...form, unit_label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="pcs, kg..." />
                </div>
              </div>

              {/* Paid status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({ ...form, is_paid: true })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all border-2 ${
                      form.is_paid ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    <CheckCircle size={18} /> Payé
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, is_paid: false })}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all border-2 ${
                      !form.is_paid ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    <XCircle size={18} /> Non payé
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                <textarea value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" rows={2}
                  placeholder="Remarques..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium text-sm disabled:opacity-60">
                  <Save size={15} />
                  {saving ? 'Enregistrement...' : editProduct ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
