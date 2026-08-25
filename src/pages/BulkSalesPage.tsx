import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, Edit2, X, Printer, Store, Package, Scale,
  Check, Clock, ArrowLeft, Search, FileText, FileCheck,
  Users, Phone, Mail, Wallet, TrendingUp, ShoppingBag, Tag,
  ChevronRight, Sparkles, Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { BulkSale, Sale, ShopSale, Customer, FiscalInfo } from '../types';

type SaleType = 'vrac' | 'boite20' | 'boite10' | 'boite6' | 'magasin';

const SALE_TYPES: { id: SaleType; label: string; shortLabel: string; icon: React.ReactNode; table: 'bulk' | 'sales' | 'shop'; color: string }[] = [
  { id: 'vrac', label: 'Macaron en Vrac (kg)', shortLabel: 'Vrac', icon: <Scale size={16} />, table: 'bulk', color: 'amber' },
  { id: 'boite20', label: 'Boîte 20 pcs', shortLabel: 'Boîte 20', icon: <Package size={16} />, table: 'sales', color: 'emerald' },
  { id: 'boite10', label: 'Boîte 10 pcs', shortLabel: 'Boîte 10', icon: <Package size={16} />, table: 'sales', color: 'teal' },
  { id: 'boite6', label: 'Boîte 06 pcs', shortLabel: 'Boîte 6', icon: <Package size={16} />, table: 'sales', color: 'cyan' },
  { id: 'magasin', label: 'Coques Magasin', shortLabel: 'Magasin', icon: <Store size={16} />, table: 'shop', color: 'blue' },
];

const DEFAULT_PRICES: Record<SaleType, number> = {
  vrac: 1800, boite20: 1100, boite10: 600, boite6: 400, magasin: 40,
};

const colorMap: Record<string, { bg: string; text: string; border: string; light: string; solid: string }> = {
  amber: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200', light: 'bg-amber-50', solid: 'bg-amber-100 text-amber-700' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', light: 'bg-emerald-50', solid: 'bg-emerald-100 text-emerald-700' },
  teal: { bg: 'bg-teal-500', text: 'text-teal-700', border: 'border-teal-200', light: 'bg-teal-50', solid: 'bg-teal-100 text-teal-700' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-700', border: 'border-cyan-200', light: 'bg-cyan-50', solid: 'bg-cyan-100 text-cyan-700' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', light: 'bg-blue-50', solid: 'bg-blue-100 text-blue-700' },
};

function getCustomerPrice(customer: Customer | null, type: SaleType): number {
  if (!customer?.prices) return DEFAULT_PRICES[type];
  const found = customer.prices.find(p => p.product_type === type);
  if (found) return found.unit_price;
  if (type === 'boite20') { const f = customer.prices.find(p => p.box_size === 20); if (f) return f.unit_price; }
  if (type === 'boite10') { const f = customer.prices.find(p => p.box_size === 10); if (f) return f.unit_price; }
  if (type === 'boite6') { const f = customer.prices.find(p => p.box_size === 6); if (f) return f.unit_price; }
  return DEFAULT_PRICES[type];
}

interface UnifiedSale {
  id: string; type: SaleType; sale_date: string; label: string;
  quantity: number; unit_price: number; total_amount: number;
  amount_paid: number; is_paid: boolean; notes?: string;
  raw: BulkSale | Sale | ShopSale;
}

export default function BulkSalesPage() {
  const { bulkSales, setBulkSales, sales, setSales, shopSales, setShopSales, customers } = useApp();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'ventes' | 'tarifs'>('ventes');
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [factureItems, setFactureItems] = useState<{ label: string; quantity: number; unit_price: number }[]>([]);
  const [factureItemForm, setFactureItemForm] = useState({ label: '', quantity: 1, unit_price: 0 });

  useEffect(() => {
    api.fiscalInfoService.get().then(setFiscalInfo).catch(() => {});
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

  const customerSales = useMemo<UnifiedSale[]>(() => {
    if (!selectedCustomerId) return [];
    const result: UnifiedSale[] = [];
    bulkSales.filter(s => s.customer_id === selectedCustomerId || s.customer_name === selectedCustomer?.name).forEach(s => {
      result.push({
        id: s.id, type: 'vrac', sale_date: s.sale_date,
        label: 'Macaron en Vrac', quantity: s.quantity_kg,
        unit_price: s.price_per_kg, total_amount: s.total_amount,
        amount_paid: s.amount_paid || 0, is_paid: (s.amount_paid || 0) >= s.total_amount,
        notes: s.notes, raw: s,
      });
    });
    sales.filter(s => s.customer_id === selectedCustomerId || s.customer_name === selectedCustomer?.name).forEach(s => {
      const st: SaleType = s.box_size === 20 ? 'boite20' : s.box_size === 10 ? 'boite10' : 'boite6';
      result.push({
        id: s.id, type: st, sale_date: s.sale_date,
        label: `Boîte ${s.box_size} pcs`, quantity: s.quantity,
        unit_price: s.unit_price, total_amount: s.total_amount,
        amount_paid: s.amount_paid || 0, is_paid: s.is_paid,
        notes: s.notes, raw: s,
      });
    });
    shopSales.filter(s => s.customer_id === selectedCustomerId || s.customer_name === selectedCustomer?.name).forEach(s => {
      result.push({
        id: s.id, type: 'magasin', sale_date: s.sale_date,
        label: 'Coques Magasin', quantity: s.quantity,
        unit_price: s.price_per_piece, total_amount: s.total_amount,
        amount_paid: s.amount_paid || 0, is_paid: s.is_paid,
        notes: s.notes, raw: s,
      });
    });
    return result.sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  }, [selectedCustomerId, bulkSales, sales, shopSales, selectedCustomer]);

  const customerStats = useMemo(() => {
    const totalAchats = customerSales.reduce((s, x) => s + x.total_amount, 0);
    const totalPaye = customerSales.reduce((s, x) => s + x.amount_paid, 0);
    const totalReste = totalAchats - totalPaye;
    return { totalAchats, totalPaye, totalReste, count: customerSales.length };
  }, [customerSales]);

  const allCustomerStats = useMemo(() => {
    const map: Record<string, { total: number; paid: number; reste: number; count: number }> = {};
    const addSale = (cid: string | undefined, cname: string | undefined, total: number, paid: number) => {
      const key = cid || cname || '';
      if (!key) return;
      if (!map[key]) map[key] = { total: 0, paid: 0, reste: 0, count: 0 };
      map[key].total += total;
      map[key].paid += paid;
      map[key].reste = map[key].total - map[key].paid;
      map[key].count++;
    };
    bulkSales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));
    sales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));
    shopSales.forEach(s => addSale(s.customer_id, s.customer_name, s.total_amount, s.amount_paid || 0));
    return map;
  }, [bulkSales, sales, shopSales]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(q) || c.phone?.includes(q));
  }, [customers, search]);

  // Sale modal state
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editSale, setEditSale] = useState<UnifiedSale | null>(null);
  const [saleForm, setSaleForm] = useState({
    type: 'boite20' as SaleType,
    sale_date: format(new Date(), 'yyyy-MM-dd'),
    quantity: 1, unit_price: DEFAULT_PRICES.boite20, amount_paid: 0, notes: '',
  });

  function openAddSale() {
    setEditSale(null);
    const initialType: SaleType = 'boite20';
    setSaleForm({
      type: initialType, sale_date: format(new Date(), 'yyyy-MM-dd'),
      quantity: 1, unit_price: getCustomerPrice(selectedCustomer, initialType), amount_paid: 0, notes: '',
    });
    setShowSaleModal(true);
  }

  function openEditSale(s: UnifiedSale) {
    setEditSale(s);
    setSaleForm({
      type: s.type, sale_date: s.sale_date, quantity: s.quantity,
      unit_price: s.unit_price, amount_paid: s.amount_paid, notes: s.notes || '',
    });
    setShowSaleModal(true);
  }

  function handleTypeChange(type: SaleType) {
    setSaleForm(f => ({ ...f, type, unit_price: getCustomerPrice(selectedCustomer, type) }));
  }

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const total = saleForm.quantity * saleForm.unit_price;
    const meta = SALE_TYPES.find(t => t.id === saleForm.type)!;
    const common = { sale_date: saleForm.sale_date, amount_paid: saleForm.amount_paid, notes: saleForm.notes || undefined };

    try {
      if (editSale) {
        if (meta.table === 'bulk') {
          const updated = await api.bulkSalesService.update(editSale.id, {
            ...common, quantity_kg: saleForm.quantity, price_per_kg: saleForm.unit_price, total_amount: total,
          });
          setBulkSales(bulkSales.map(s => s.id === editSale.id ? updated : s));
        } else if (meta.table === 'sales') {
          const boxSize = saleForm.type === 'boite20' ? 20 : saleForm.type === 'boite10' ? 10 : 6;
          const updated = await api.salesService.update(editSale.id, {
            ...common, box_size: boxSize, quantity: saleForm.quantity, unit_price: saleForm.unit_price,
            total_amount: total, is_paid: saleForm.amount_paid >= total,
          });
          setSales(sales.map(s => s.id === editSale.id ? updated : s));
        } else {
          const updated = await api.shopSalesService.update(editSale.id, {
            ...common, quantity: saleForm.quantity, price_per_piece: saleForm.unit_price,
            total_amount: total, is_paid: saleForm.amount_paid >= total,
          });
          setShopSales(shopSales.map(s => s.id === editSale.id ? updated : s));
        }
      } else {
        if (meta.table === 'bulk') {
          const created = await api.bulkSalesService.create({
            ...common, quantity_kg: saleForm.quantity, price_per_kg: saleForm.unit_price,
            total_amount: total, customer_id: selectedCustomer.id, customer_name: selectedCustomer.name,
          });
          setBulkSales([created, ...bulkSales]);
        } else if (meta.table === 'sales') {
          const boxSize = saleForm.type === 'boite20' ? 20 : saleForm.type === 'boite10' ? 10 : 6;
          const created = await api.salesService.create({
            ...common, box_size: boxSize, quantity: saleForm.quantity, unit_price: saleForm.unit_price,
            total_amount: total, is_paid: saleForm.amount_paid >= total,
            customer_id: selectedCustomer.id, customer_name: selectedCustomer.name,
          });
          setSales([created, ...sales]);
        } else {
          const created = await api.shopSalesService.create({
            ...common, quantity: saleForm.quantity, price_per_piece: saleForm.unit_price,
            total_amount: total, is_paid: saleForm.amount_paid >= total,
            customer_id: selectedCustomer.id, customer_name: selectedCustomer.name,
          });
          setShopSales([created, ...shopSales]);
        }
      }
      setShowSaleModal(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteSale = async (s: UnifiedSale) => {
    if (!confirm('Supprimer cette vente ?')) return;
    const meta = SALE_TYPES.find(t => t.id === s.type)!;
    try {
      if (meta.table === 'bulk') { await api.bulkSalesService.delete(s.id); setBulkSales(bulkSales.filter(x => x.id !== s.id)); }
      else if (meta.table === 'sales') { await api.salesService.delete(s.id); setSales(sales.filter(x => x.id !== s.id)); }
      else { await api.shopSalesService.delete(s.id); setShopSales(shopSales.filter(x => x.id !== s.id)); }
    } catch (err) { console.error(err); }
  };

  const handleVersement = async (s: UnifiedSale) => {
    const amountStr = prompt(`Versement pour "${s.label}"\nReste à payer: ${(s.total_amount - s.amount_paid).toLocaleString()} DA\nMontant du versement:`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0) return;
    const newPaid = s.amount_paid + amount;
    const meta = SALE_TYPES.find(t => t.id === s.type)!;
    try {
      if (meta.table === 'bulk') {
        const updated = await api.bulkSalesService.update(s.id, { amount_paid: newPaid });
        setBulkSales(bulkSales.map(x => x.id === s.id ? updated : x));
      } else if (meta.table === 'sales') {
        const updated = await api.salesService.update(s.id, { amount_paid: newPaid, is_paid: newPaid >= s.total_amount });
        setSales(sales.map(x => x.id === s.id ? updated : x));
      } else {
        const updated = await api.shopSalesService.update(s.id, { amount_paid: newPaid, is_paid: newPaid >= s.total_amount });
        setShopSales(shopSales.map(x => x.id === s.id ? updated : x));
      }
    } catch (err) { console.error(err); }
  };

  const buildDocHTML = (docType: 'bon' | 'facture', items: { label: string; quantity: number; unit_price: number; total: number }[], totalGeneral: number, verse: number) => {
    if (!selectedCustomer) return '';
    const docNum = docType === 'bon'
      ? `BC-${format(new Date(), 'yyyyMMdd')}-${Date.now().toString().slice(-4)}`
      : `FAC-${format(new Date(), 'yyyyMMdd')}-${Date.now().toString().slice(-4)}`;
    const title = docType === 'bon' ? 'BON DE COMMANDE' : 'FACTURE';
    const rows = items.map(s => {
      return `<tr><td style="padding:8px;border:1px solid #ddd">${s.label}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${s.quantity}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${s.unit_price.toLocaleString()} DA</td><td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">${s.total.toLocaleString()} DA</td></tr>`;
    }).join('');
    const reste = totalGeneral - verse;
    const fi = fiscalInfo;
    const fiscalBlock = fi ? `
      <div style="margin-bottom:20px;font-size:13px;color:#555">
        ${fi.company_name || ''}<br/>${fi.address || ''} ${fi.city || ''}<br/>
        ${fi.phone ? 'Tel: ' + fi.phone : ''} ${fi.email ? ' | Email: ' + fi.email : ''}<br/>
        ${fi.rc ? 'RC: ' + fi.rc : ''} ${fi.nif ? ' | NIF: ' + fi.nif : ''}<br/>
        ${fi.ai ? 'AI: ' + fi.ai : ''} ${fi.nis ? ' | NIS: ' + fi.nis : ''}<br/>
        ${fi.rib ? 'RIB: ' + fi.rib : ''}
      </div>` : '';
    return `<html><head><title>${title} ${docNum}</title>
      <style>body{font-family:Arial,sans-serif;padding:30px;max-width:800px;margin:0 auto}
      h1{color:#d97706;margin:0}h2{color:#333;margin:5px 0}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      th{background:#fef3c7;padding:8px;border:1px solid #ddd;text-align:left}
      .total-row{font-weight:bold;background:#f0fdf4}
      .header{display:flex;justify-content:space-between;margin-bottom:30px}
      .info-box{background:#f9fafb;padding:15px;border-radius:8px;margin-bottom:20px}
      </style></head><body>
      <div class="header">
        <div><h1>${fi?.company_name || 'Hanky Macarons'}</h1>${fiscalBlock}</div>
        <div style="text-align:right"><h2>${title}</h2><p>N° ${docNum}</p><p>${format(new Date(), 'dd MMMM yyyy', { locale: fr })}</p></div>
      </div>
      <div class="info-box"><strong>Client:</strong> ${selectedCustomer.name}<br/>
      ${selectedCustomer.phone ? 'Tel: ' + selectedCustomer.phone + '<br/>' : ''}
      ${selectedCustomer.address ? 'Adresse: ' + selectedCustomer.address : ''}</div>
      <table><thead><tr><th>Désignation</th><th style="text-align:right">Qté</th><th style="text-align:right">Prix Unit.</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total-row"><td colspan="3" style="padding:10px;border:1px solid #ddd;text-align:right">Total Général</td><td style="padding:10px;border:1px solid #ddd;text-align:right;font-size:18px">${totalGeneral.toLocaleString()} DA</td></tr>
      <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right">Versé</td><td style="padding:8px;border:1px solid #ddd;text-align:right;color:#16a34a">${verse.toLocaleString()} DA</td></tr>
      <tr><td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right">Reste à Payer</td><td style="padding:8px;border:1px solid #ddd;text-align:right;color:#dc2626">${reste.toLocaleString()} DA</td></tr></tfoot></table>
      <p style="margin-top:40px;font-size:12px;color:#999;text-align:center">${docType === 'facture' ? 'Facture émise conformément à la réglementation fiscale en vigueur.' : 'Bon de commande à valider par les deux parties.'}</p>
      </body></html>`;
  };

  const printHTML = (html: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      try { iframe.contentWindow?.print(); } catch (e) { console.error(e); }
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  };

  const printDocument = (docType: 'bon' | 'facture') => {
    if (!selectedCustomer || customerSales.length === 0) return;
    const items = customerSales.map(s => ({ label: s.label, quantity: s.quantity, unit_price: s.unit_price, total: s.total_amount }));
    const html = buildDocHTML(docType, items, customerStats.totalAchats, customerStats.totalPaye);
    printHTML(html);
  };

  const openFactureModal = () => {
    setFactureItems([]);
    setFactureItemForm({ label: '', quantity: 1, unit_price: 0 });
    setShowFactureModal(true);
  };

  const addFactureItem = () => {
    if (!factureItemForm.label.trim() || factureItemForm.quantity <= 0 || factureItemForm.unit_price <= 0) return;
    setFactureItems([...factureItems, { ...factureItemForm }]);
    setFactureItemForm({ label: '', quantity: 1, unit_price: 0 });
  };

  const removeFactureItem = (idx: number) => {
    setFactureItems(factureItems.filter((_, i) => i !== idx));
  };

  const printFactureFromModal = () => {
    if (factureItems.length === 0) return;
    const items = factureItems.map(it => ({ ...it, total: it.quantity * it.unit_price }));
    const total = items.reduce((s, x) => s + x.total, 0);
    const html = buildDocHTML('facture', items, total, 0);
    printHTML(html);
    setShowFactureModal(false);
  };

  // ═══════════════════════════════════════════════
  // CUSTOMER DETAIL VIEW
  // ═══════════════════════════════════════════════
  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedCustomerId(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
          <ArrowLeft size={18} /> Retour aux ventes
        </button>

        {/* Customer header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{selectedCustomer.name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-white/90 text-sm">
                  {selectedCustomer.phone && <span className="flex items-center gap-1"><Phone size={12} /> {selectedCustomer.phone}</span>}
                  {selectedCustomer.email && <span className="flex items-center gap-1"><Mail size={12} /> {selectedCustomer.email}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => printDocument('bon')}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-colors text-sm font-medium">
                <FileText size={16} /> Bon
              </button>
              <button onClick={openFactureModal}
                className="flex items-center gap-2 px-3 py-2 bg-white text-emerald-700 rounded-xl hover:bg-emerald-50 transition-colors text-sm font-medium shadow-sm">
                <FileCheck size={16} /> Facture
              </button>
              <button onClick={openAddSale}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-medium shadow-sm">
                <Plus size={16} /> Vente
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><Receipt size={14} className="text-gray-400" /><p className="text-xs text-gray-500">Transactions</p></div>
            <p className="text-2xl font-bold text-gray-900">{customerStats.count}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-gray-400" /><p className="text-xs text-gray-500">Total Achats</p></div>
            <p className="text-2xl font-bold text-gray-900">{customerStats.totalAchats.toLocaleString()} <span className="text-sm font-normal text-gray-400">DA</span></p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1"><Check size={14} className="text-emerald-500" /><p className="text-xs text-emerald-600 font-medium">Versé</p></div>
            <p className="text-2xl font-bold text-emerald-700">{customerStats.totalPaye.toLocaleString()} <span className="text-sm font-normal text-emerald-400">DA</span></p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-red-500" /><p className="text-xs text-red-600 font-medium">Reste à Payer</p></div>
            <p className="text-2xl font-bold text-red-700">{customerStats.totalReste.toLocaleString()} <span className="text-sm font-normal text-red-400">DA</span></p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 w-fit">
          <button onClick={() => setActiveTab('ventes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'ventes' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <ShoppingBag size={15} /> Ventes
          </button>
          <button onClick={() => setActiveTab('tarifs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tarifs' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Tag size={15} /> Tarifs
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'tarifs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Tag size={18} className="text-emerald-600" /> Tarifs enregistrés
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Modifiables depuis la section Clients</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {SALE_TYPES.map(t => {
                const cp = selectedCustomer.prices?.find(p => p.product_type === t.id);
                const price = cp ? Number(cp.unit_price) : DEFAULT_PRICES[t.id];
                const unitLabel = cp?.unit_label || (t.id === 'vrac' ? 'kg' : t.id === 'magasin' ? 'pcs' : 'boîte');
                const c = colorMap[t.color];
                const isCustom = cp && Number(cp.unit_price) !== DEFAULT_PRICES[t.id];
                return (
                  <div key={t.id} className={`rounded-xl p-4 border ${c.border} ${c.light} relative overflow-hidden`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-10 h-10 rounded-lg ${c.solid} flex items-center justify-center`}>
                        {t.icon}
                      </div>
                      {isCustom && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.solid} flex items-center gap-1`}>
                          <Sparkles size={10} /> Personnalisé
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{t.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{price.toLocaleString()} <span className="text-sm font-normal text-gray-400">DA/{unitLabel}</span></p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'ventes' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Produit</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Qté</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Versé</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Reste</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerSales.map(s => {
                    const reste = s.total_amount - s.amount_paid;
                    const meta = SALE_TYPES.find(t => t.id === s.type)!;
                    const c = colorMap[meta.color];
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 text-sm">{format(new Date(s.sale_date), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-lg ${c.solid} flex items-center justify-center flex-shrink-0`}>{meta.icon}</span>
                            <span className="font-medium text-gray-900">{s.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 text-sm">{s.type === 'vrac' ? `${s.quantity} kg` : s.type === 'magasin' ? `${s.quantity} pcs` : `${s.quantity}`}</td>
                        <td className="px-4 py-3 text-right text-gray-600 text-sm">{s.unit_price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">{s.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 text-sm">{s.amount_paid.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-600 text-sm">{reste.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          {reste <= 0
                            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><Check size={12} /> Payé</span>
                            : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium"><Clock size={12} /> Non payé</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleVersement(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Versement"><Wallet size={15} /></button>
                            <button onClick={() => openEditSale(s)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title="Modifier"><Edit2 size={15} /></button>
                            <button onClick={() => handleDeleteSale(s)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {customerSales.length > 0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 font-bold text-right">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{customerStats.totalAchats.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{customerStats.totalPaye.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{customerStats.totalReste.toLocaleString()}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {customerSales.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                <ShoppingBag size={48} className="mx-auto mb-3 text-gray-300" />
                <p>Aucune vente enregistrée pour ce client</p>
                <button onClick={openAddSale} className="mt-3 text-emerald-600 font-medium hover:underline">Ajouter une vente</button>
              </div>
            )}
          </div>
        )}

        {/* Facture Modal */}
        {showFactureModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold flex items-center gap-2"><FileCheck size={20} className="text-emerald-600" /> Créer une Facture</h2>
                <button onClick={() => setShowFactureModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-gray-500">Client: <strong className="text-gray-900">{selectedCustomer.name}</strong></p>
                
                {/* Add item form */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ajouter un article</p>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input type="text" placeholder="Désignation" value={factureItemForm.label}
                        onChange={e => setFactureItemForm({ ...factureItemForm, label: e.target.value })}
                        className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" step="0.5" placeholder="Qté" value={factureItemForm.quantity}
                        onChange={e => setFactureItemForm({ ...factureItemForm, quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" step="10" placeholder="Prix" value={factureItemForm.unit_price}
                        onChange={e => setFactureItemForm({ ...factureItemForm, unit_price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-1">
                      <button type="button" onClick={addFactureItem}
                        className="w-full h-full flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Quick fill from customer prices */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SALE_TYPES.map(t => {
                      const price = getCustomerPrice(selectedCustomer, t.id);
                      return (
                        <button key={t.id} type="button"
                          onClick={() => setFactureItemForm({ label: t.label, quantity: 1, unit_price: price })}
                          className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                          {t.shortLabel}: {price.toLocaleString()} DA
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Items list */}
                {factureItems.length > 0 ? (
                  <div className="space-y-2">
                    {factureItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                          <p className="text-xs text-gray-500">{item.quantity} × {item.unit_price.toLocaleString()} DA</p>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{(item.quantity * item.unit_price).toLocaleString()} DA</p>
                        <button onClick={() => removeFactureItem(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3 py-2 bg-emerald-50 rounded-lg">
                      <span className="text-sm font-semibold text-emerald-800">Total</span>
                      <span className="text-lg font-bold text-emerald-700">{factureItems.reduce((s, x) => s + x.quantity * x.unit_price, 0).toLocaleString()} DA</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    Aucun article. Ajoutez des articles ou utilisez les boutons de tarifs ci-dessus.
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowFactureModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                  <button onClick={printFactureFromModal} disabled={factureItems.length === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                    <Printer size={16} /> Imprimer la Facture
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sale Modal */}
        {showSaleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg font-semibold">{editSale ? 'Modifier Vente' : 'Nouvelle Vente'}</h2>
                <button onClick={() => setShowSaleModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaleSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de produit</label>
                  <div className="grid grid-cols-1 gap-2">
                    {SALE_TYPES.map(t => {
                      const c = colorMap[t.color];
                      return (
                        <button key={t.id} type="button" onClick={() => handleTypeChange(t.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${saleForm.type === t.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          <span className={`w-8 h-8 rounded-lg ${c.solid} flex items-center justify-center`}>{t.icon}</span>
                          <span className="text-sm font-medium">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={saleForm.sale_date} onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{saleForm.type === 'vrac' ? 'Quantité (kg)' : 'Quantité'}</label>
                    <input type="number" step={saleForm.type === 'vrac' ? '0.1' : '1'} min="0" required value={saleForm.quantity}
                      onChange={e => setSaleForm({ ...saleForm, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (DA)</label>
                    <input type="number" min="0" step="10" required value={saleForm.unit_price}
                      onChange={e => setSaleForm({ ...saleForm, unit_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-amber-700" />
                    {(() => {
                      const saved = getCustomerPrice(selectedCustomer, saleForm.type);
                      const matches = saved === saleForm.unit_price;
                      return matches ? (
                        <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check size={12} /> Prix client enregistré</p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-1">Prix personnalisé (client: {saved.toLocaleString()} DA)</p>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Versement initial (DA)</label>
                  <input type="number" min="0" value={saleForm.amount_paid}
                    onChange={e => setSaleForm({ ...saleForm, amount_paid: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                  <textarea value={saleForm.notes} rows={2} onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl flex justify-between items-center">
                  <span className="text-sm text-emerald-800">Total: {(saleForm.quantity * saleForm.unit_price).toLocaleString()} DA</span>
                  <span className="text-sm text-red-600">Reste: {((saleForm.quantity * saleForm.unit_price) - saleForm.amount_paid).toLocaleString()} DA</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowSaleModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Annuler</button>
                  <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">{editSale ? 'Modifier' : 'Enregistrer'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // CUSTOMER LIST VIEW
  // ═══════════════════════════════════════════════
  const globalTotal = Object.values(allCustomerStats).reduce((s, v) => s + v.total, 0);
  const globalReste = Object.values(allCustomerStats).reduce((s, v) => s + v.reste, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
        <p className="text-gray-500">Sélectionnez un client pour gérer ses ventes</p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-wide">CA Global</p>
              <p className="text-3xl font-bold mt-1">{globalTotal.toLocaleString()} <span className="text-sm font-normal text-white/70">DA</span></p>
            </div>
            <div className="p-3 bg-white/15 rounded-xl"><TrendingUp size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl"><Users size={22} className="text-emerald-600" /></div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-5 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium mb-1">Reste à Encaisser</p>
              <p className="text-2xl font-bold text-red-700">{globalReste.toLocaleString()} <span className="text-sm font-normal text-red-400">DA</span></p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl"><Clock size={22} className="text-red-600" /></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <Search size={16} className="text-gray-400" />
        <input type="text" placeholder="Rechercher un client..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      {/* Customer grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <Users size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucun client trouvé</p>
          <p className="text-sm mt-1">Ajoutez des clients depuis la section Clients</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const stats = allCustomerStats[customer.id] || allCustomerStats[customer.name] || { total: 0, paid: 0, reste: 0, count: 0 };
            return (
              <button key={customer.id} onClick={() => setSelectedCustomerId(customer.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-emerald-300 transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                      {customer.name}
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500" />
                    </p>
                    {customer.phone && <p className="text-xs text-gray-500">{customer.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg py-2">
                    <p className="text-xs text-gray-400">Ventes</p>
                    <p className="text-sm font-bold text-gray-900">{stats.count}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg py-2">
                    <p className="text-xs text-emerald-500">Total</p>
                    <p className="text-sm font-bold text-emerald-700">{stats.total.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg py-2 ${stats.reste > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${stats.reste > 0 ? 'text-red-500' : 'text-gray-400'}`}>Reste</p>
                    <p className={`text-sm font-bold ${stats.reste > 0 ? 'text-red-700' : 'text-gray-400'}`}>{stats.reste.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
