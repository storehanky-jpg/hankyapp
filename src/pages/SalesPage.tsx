import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, ShoppingCart, Calendar, X,
  Printer, Edit2, Phone, CheckCircle, XCircle, Truck,
  Receipt, ChevronDown, ChevronUp, Search, Users, Layers, Scale, Package, Wallet
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { Sale } from '../types';

const defaultPrices: Record<number, number> = { 6: 400, 10: 600, 12: 720, 20: 1100, 24: 1300 };
const vracDefaultPrice = 1800;

type ProductKind = 'vrac' | 'boite';

interface SaleLine {
  product_kind: ProductKind;
  box_size: number;
  quantity: number;
  unit_price: number;
  unit_label: string;
}

const emptyLine = (): SaleLine => ({ product_kind: 'boite', box_size: 10, quantity: 1, unit_price: 600, unit_label: 'boîte' });

type PaymentStatus = 'paid' | 'unpaid' | 'partial';

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: 'Payé', unpaid: 'Non payé', partial: 'Versement',
};
const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-500 text-white shadow-sm',
  unpaid: 'bg-red-100 text-red-700 border border-red-200',
  partial: 'bg-orange-100 text-orange-700 border border-orange-200',
};

const emptyForm = () => ({
  sale_date: format(new Date(), 'yyyy-MM-dd'),
  customer_name: '',
  customer_phone: '',
  customer_id: '',
  notes: '',
  payment_status: 'unpaid' as PaymentStatus,
  amount_paid: 0,
  bon_livraison_number: '',
  facture_number: '',
  lines: [emptyLine()],
});

function describeProduct(s: Sale): string {
  if (s.product_type === 'vrac') return `Macaron en vrac (${s.quantity} kg)`;
  return `Boîte ${s.box_size} pcs × ${s.quantity}`;
}

export default function SalesPage() {
  const { sales, setSales, customers } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [activeView, setActiveView] = useState<'today' | 'month' | 'date'>('today');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [saleForm, setSaleForm] = useState(emptyForm());

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)
    );
  }, [customers, customerSearch]);

  function selectCustomer(customerId: string) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    setSaleForm(f => ({
      ...f,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone || '',
      lines: f.lines.map(line => {
        if (line.product_kind === 'vrac') {
          const cp = customer.prices?.find(p => p.product_type === 'vrac');
          return { ...line, unit_price: cp?.unit_price ?? vracDefaultPrice };
        }
        const customerPrice = customer.prices?.find(p => p.box_size === line.box_size);
        return { ...line, unit_price: customerPrice?.unit_price ?? defaultPrices[line.box_size] ?? line.unit_price };
      }),
    }));
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  }

  function clearCustomer() {
    setSaleForm(f => ({ ...f, customer_id: '', customer_name: '', customer_phone: '' }));
    setCustomerSearch('');
  }

  function openAdd() {
    setEditSale(null);
    setSaleForm(emptyForm());
    setCustomerSearch('');
    setShowModal(true);
  }

  function openEdit(sale: Sale) {
    setEditSale(sale);
    const isVrac = sale.product_type === 'vrac';
    setSaleForm({
      sale_date: sale.sale_date,
      customer_name: sale.customer_name || '',
      customer_phone: sale.customer_phone || '',
      customer_id: sale.customer_id || '',
      notes: sale.notes || '',
      payment_status: (sale.payment_status as PaymentStatus) || (sale.is_paid ? 'paid' : 'unpaid'),
      amount_paid: sale.amount_paid || 0,
      bon_livraison_number: sale.bon_livraison_number || '',
      facture_number: sale.facture_number || '',
      lines: [{
        product_kind: isVrac ? 'vrac' : 'boite',
        box_size: sale.box_size,
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        unit_label: isVrac ? 'kg' : 'boîte',
      }],
    });
    const c = customers.find(c => c.id === sale.customer_id);
    setCustomerSearch(c ? c.name : sale.customer_name || '');
    setShowModal(true);
  }

  function updateLine(index: number, field: keyof SaleLine, value: string | number) {
    setSaleForm(f => ({
      ...f,
      lines: f.lines.map((l, i) => i === index ? { ...l, [field]: value } : l),
    }));
  }

  function addLine() {
    setSaleForm(f => ({ ...f, lines: [...f.lines, emptyLine()] }));
  }

  function removeLine(index: number) {
    setSaleForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== index) }));
  }

  function onProductKindChange(index: number, kind: ProductKind) {
    const customer = customers.find(c => c.id === saleForm.customer_id);
    if (kind === 'vrac') {
      const cp = customer?.prices?.find(p => p.product_type === 'vrac');
      updateLine(index, 'product_kind', kind);
      updateLine(index, 'unit_label', 'kg');
      updateLine(index, 'unit_price', cp?.unit_price ?? vracDefaultPrice);
      updateLine(index, 'box_size', 0);
    } else {
      const size = 10;
      const cp = customer?.prices?.find(p => p.box_size === size);
      updateLine(index, 'product_kind', kind);
      updateLine(index, 'unit_label', 'boîte');
      updateLine(index, 'box_size', size);
      updateLine(index, 'unit_price', cp?.unit_price ?? defaultPrices[size]);
    }
  }

  function onBoxSizeChange(index: number, size: number) {
    const customer = customers.find(c => c.id === saleForm.customer_id);
    const customerPrice = customer?.prices?.find(p => p.box_size === size);
    setSaleForm(f => ({
      ...f,
      lines: f.lines.map((l, i) => i === index ? {
        ...l, box_size: size, unit_price: customerPrice?.unit_price ?? defaultPrices[size] ?? l.unit_price,
      } : l),
    }));
  }

  const formTotal = saleForm.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const resteAPayer = formTotal - saleForm.amount_paid;

  function onPaymentStatusChange(status: PaymentStatus) {
    setSaleForm(f => ({
      ...f,
      payment_status: status,
      amount_paid: status === 'paid' ? formTotal : status === 'unpaid' ? 0 : f.amount_paid,
      is_paid: status === 'paid',
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleForm.lines.length === 0) return;
    try {
      if (editSale) {
        const line = saleForm.lines[0];
        const total_amount = line.quantity * line.unit_price;
        const payload = {
          sale_date: saleForm.sale_date,
          customer_name: saleForm.customer_name,
          customer_phone: saleForm.customer_phone,
          customer_id: saleForm.customer_id || undefined,
          notes: saleForm.notes || undefined,
          is_paid: saleForm.payment_status === 'paid',
          payment_status: saleForm.payment_status,
          amount_paid: saleForm.payment_status === 'paid' ? total_amount : saleForm.payment_status === 'partial' ? saleForm.amount_paid : 0,
          bon_livraison_number: saleForm.bon_livraison_number || undefined,
          facture_number: saleForm.facture_number || undefined,
          box_size: line.box_size,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_amount,
          product_type: line.product_kind === 'vrac' ? 'vrac' : 'boite',
        };
        const updated = await api.salesService.update(editSale.id, payload);
        setSales(sales.map(s => s.id === editSale.id ? updated : s));
      } else {
        const groupId = `GRP-${Date.now()}`;
        const newSales: Sale[] = [];
        for (const line of saleForm.lines) {
          const total_amount = line.quantity * line.unit_price;
          const payload = {
            sale_date: saleForm.sale_date,
            customer_name: saleForm.customer_name,
            customer_phone: saleForm.customer_phone,
            customer_id: saleForm.customer_id || undefined,
            notes: saleForm.notes || undefined,
            is_paid: saleForm.payment_status === 'paid',
            payment_status: saleForm.payment_status,
            amount_paid: saleForm.payment_status === 'paid' ? total_amount : saleForm.payment_status === 'partial' ? (saleForm.amount_paid / formTotal) * total_amount : 0,
            bon_livraison_number: saleForm.bon_livraison_number || undefined,
            facture_number: saleForm.facture_number || undefined,
            box_size: line.box_size,
            quantity: line.quantity,
            unit_price: line.unit_price,
            total_amount,
            sale_group_id: groupId,
            product_type: line.product_kind === 'vrac' ? 'vrac' : 'boite',
          };
          const newSale = await api.salesService.create(payload);
          newSales.push(newSale);
        }
        setSales([...newSales.reverse(), ...sales]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Erreur lors de l\'enregistrement de la vente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette vente?')) return;
    try {
      await api.salesService.delete(id);
      setSales(sales.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const handleDeleteGroup = async (groupKey: string) => {
    if (!confirm('Supprimer toutes les ventes de ce groupe?')) return;
    try {
      const groupSales = groupedSales.find(g => g.key === groupKey)?.sales || [];
      for (const s of groupSales) {
        await api.salesService.delete(s.id);
      }
      setSales(sales.filter(s => !groupSales.some(gs => gs.id === s.id)));
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const setGroupPaymentStatus = async (groupKey: string, status: PaymentStatus, amountPaid?: number) => {
    const groupSales = groupedSales.find(g => g.key === groupKey)?.sales || [];
    try {
      for (const s of groupSales) {
        const updated = await api.salesService.update(s.id, {
          is_paid: status === 'paid',
          payment_status: status,
          amount_paid: status === 'paid' ? s.total_amount : status === 'partial' ? (amountPaid || 0) : 0,
        });
        setSales(prev => prev.map(x => x.id === s.id ? updated : x));
      }
    } catch (error) {
      console.error('Error updating group payment:', error);
    }
  };

  const setSalePaymentStatus = async (sale: Sale, status: PaymentStatus, amountPaid?: number) => {
    try {
      const updated = await api.salesService.update(sale.id, {
        is_paid: status === 'paid',
        payment_status: status,
        amount_paid: status === 'paid' ? sale.total_amount : status === 'partial' ? (amountPaid ?? sale.amount_paid ?? 0) : 0,
      });
      setSales(sales.map(s => s.id === sale.id ? updated : s));
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  // Filter
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  let filteredSales = sales;
  if (activeView === 'today') {
    filteredSales = sales.filter(s => s.sale_date === todayStr);
  } else if (activeView === 'month') {
    filteredSales = sales.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd);
  } else {
    filteredSales = sales.filter(s => s.sale_date === selectedDate);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filteredSales = filteredSales.filter(s =>
      (s.customer_name || '').toLowerCase().includes(q) ||
      (s.customer_phone || '').includes(q) ||
      (s.bon_livraison_number || '').toLowerCase().includes(q) ||
      (s.facture_number || '').toLowerCase().includes(q)
    );
  }

  // Group by customer_id (or customer_name) + sale_date
  const groupedSales = useMemo(() => {
    const groups: {
      key: string; sales: Sale[]; customer_name: string; customer_phone: string;
      customer_id?: string; sale_date: string; total: number; count: number;
      payment_status: PaymentStatus; amount_paid: number; reste: number;
    }[] = [];
    const groupMap: Record<string, number> = {};

    for (const s of filteredSales) {
      const custKey = s.customer_id || s.customer_name || 'unknown';
      const key = `${custKey}__${s.sale_date}`;
      if (groupMap[key] === undefined) {
        groupMap[key] = groups.length;
        groups.push({
          key, sales: [], customer_name: s.customer_name || 'Sans nom',
          customer_phone: s.customer_phone || '', customer_id: s.customer_id,
          sale_date: s.sale_date, total: 0, count: 0,
          payment_status: 'paid', amount_paid: 0, reste: 0,
        });
      }
      const g = groups[groupMap[key]];
      g.sales.push(s);
      g.total += s.total_amount;
      g.count++;
      g.amount_paid += s.amount_paid || (s.is_paid ? s.total_amount : 0);
    }

    // Determine group payment status
    for (const g of groups) {
      g.reste = g.total - g.amount_paid;
      if (g.reste <= 0) g.payment_status = 'paid';
      else if (g.amount_paid > 0) g.payment_status = 'partial';
      else g.payment_status = 'unpaid';
    }

    return groups.sort((a, b) => {
      if (b.sale_date !== a.sale_date) return b.sale_date.localeCompare(a.sale_date);
      return a.customer_name.localeCompare(b.customer_name);
    });
  }, [filteredSales]);

  const totalAmount = filteredSales.reduce((s, x) => s + x.total_amount, 0);
  const totalBoxes = filteredSales.filter(s => s.product_type !== 'vrac').reduce((s, x) => s + x.quantity, 0);
  const totalKg = filteredSales.filter(s => s.product_type === 'vrac').reduce((s, x) => s + x.quantity, 0);
  const paidAmount = filteredSales.reduce((s, x) => s + (x.amount_paid || (x.is_paid ? x.total_amount : 0)), 0);
  const unpaidAmount = totalAmount - paidAmount;

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Ventes - Hanky Macarons</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;font-size:12px}
        h1{color:#d97706;margin-bottom:4px}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
        th{background:#fef3c7;font-weight:bold}
        .total{font-weight:bold;margin-top:16px;font-size:15px}
        @media print{body{margin:0}}
      </style></head><body>
      <h1>Hanky Macarons — Rapport des Ventes</h1>
      <p>Édité le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
      <table><thead><tr><th>Client</th><th>Date</th><th>Produit</th><th>Total</th><th>Statut</th></tr></thead>
      <tbody>
      ${groupedSales.map(g => `<tr><td>${g.customer_name}</td><td>${format(new Date(g.sale_date), 'dd/MM/yyyy')}</td><td>${g.count} produit(s)</td><td>${g.total.toLocaleString()} DA</td><td>${PAYMENT_LABELS[g.payment_status]}</td></tr>`).join('')}
      </tbody></table>
      <div class="total">Total: ${totalAmount.toLocaleString()} DA | Payé: ${paidAmount.toLocaleString()} DA | Impayé: ${unpaidAmount.toLocaleString()} DA</div>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

  function renderGroupPaymentBadge(group: typeof groupedSales[number]) {
    const status = group.payment_status;
    const colorClass = status === 'paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
      : status === 'partial' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      : 'bg-red-100 text-red-700 hover:bg-red-200';
    return (
      <button
        onClick={() => {
          if (status === 'paid') setGroupPaymentStatus(group.key, 'unpaid');
          else if (status === 'unpaid') setGroupPaymentStatus(group.key, 'paid');
          else {
            const amt = prompt('Montant versé (DA):', String(group.amount_paid));
            if (amt !== null) setGroupPaymentStatus(group.key, 'partial', parseFloat(amt) || 0);
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
          <h1 className="text-2xl font-bold text-gray-900">Ventes</h1>
          <p className="text-gray-500">Suivi des ventes, paiements et documents</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
            <Printer size={18} /> Imprimer
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-sm">
            <Plus size={18} /> Nouvelle Vente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 items-center">
        {[
          { id: 'today', label: "Aujourd'hui" },
          { id: 'month', label: 'Ce mois' },
          { id: 'date', label: 'Date spécifique' },
        ].map(v => (
          <button key={v.id}
            onClick={() => setActiveView(v.id as typeof activeView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeView === v.id ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <Calendar size={15} /> {v.label}
          </button>
        ))}
        {activeView === 'date' && (
          <input type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500" />
        )}
        <div className="ml-auto flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-gray-50">
          <Search size={15} className="text-gray-400" />
          <input type="text" placeholder="Rechercher client, tel, BL..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm w-44" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white shadow-lg">
          <p className="text-white/80 text-xs">Total Ventes</p>
          <p className="text-xl font-bold">{totalAmount.toLocaleString()} DA</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Boîtes vendues</p>
          <p className="text-xl font-bold text-gray-900">{totalBoxes}</p>
          {totalKg > 0 && <p className="text-xs text-gray-400">{totalKg} kg vrac</p>}
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium">Payé</p>
          <p className="text-xl font-bold text-emerald-700">{paidAmount.toLocaleString()} DA</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-red-600 font-medium">Non payé</p>
          <p className="text-xl font-bold text-red-700">{unpaidAmount.toLocaleString()} DA</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Transactions</p>
          <p className="text-xl font-bold text-gray-900">{groupedSales.length}</p>
        </div>
      </div>

      {/* Grouped sales list */}
      <div className="space-y-3">
        {groupedSales.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm border border-gray-100">
            <ShoppingCart size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">Aucune vente enregistrée</p>
          </div>
        )}

        {groupedSales.map(group => {
          const isExpanded = expandedRow === group.key;
          const isMulti = group.sales.length > 1;
          return (
            <div key={group.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Collapsed header */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                <button onClick={() => setExpandedRow(isExpanded ? null : group.key)}
                  className="p-0.5 text-gray-400 hover:text-gray-600" title="Voir détails">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{group.customer_name}</p>
                    {isMulti && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        <Layers size={10} /> {group.count} produits
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {group.customer_phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} /> {group.customer_phone}</span>}
                    <span className="text-xs text-gray-400">{format(new Date(group.sale_date), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">{group.total.toLocaleString()} DA</p>
                  {group.payment_status === 'partial' && (
                    <p className="text-xs text-orange-600">Reste: {group.reste.toLocaleString()} DA</p>
                  )}
                </div>
                {renderGroupPaymentBadge(group)}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!isMulti && (
                    <button onClick={() => openEdit(group.sales[0])}
                      className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title="Modifier">
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteGroup(group.key)}
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
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Produits de la vente</p>
                      {group.sales.map(s => {
                        const isVrac = s.product_type === 'vrac';
                        return (
                          <div key={s.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600">
                              {isVrac ? <Scale size={14} /> : <Package size={14} />}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">
                                {isVrac ? 'Macaron en vrac' : `Boîte ${s.box_size} pcs`}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">× {s.quantity} {isVrac ? 'kg' : 'boîtes'}</span>
                            </div>
                            <span className="text-sm text-gray-600">{s.unit_price.toLocaleString()} DA/{isVrac ? 'kg' : 'boîte'}</span>
                            <span className="text-sm font-bold text-gray-900">{s.total_amount.toLocaleString()} DA</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Client</p>
                      <p className="font-semibold text-gray-800">{group.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Phone size={10} /> Téléphone</p>
                      <p className="font-semibold text-gray-800">{group.customer_phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Truck size={10} /> Bon de Livraison</p>
                      <p className="font-semibold text-blue-700">{group.sales[0]?.bon_livraison_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Receipt size={10} /> N° Facture</p>
                      <p className="font-semibold text-violet-700">{group.sales[0]?.facture_number || '—'}</p>
                    </div>
                    {group.payment_status === 'partial' && (
                      <div className="col-span-2 sm:col-span-4 flex gap-4 bg-white rounded-lg p-3 border border-orange-100">
                        <div><p className="text-xs text-gray-500">Total</p><p className="font-bold text-gray-900">{group.total.toLocaleString()} DA</p></div>
                        <div><p className="text-xs text-gray-500">Versé</p><p className="font-bold text-emerald-600">{group.amount_paid.toLocaleString()} DA</p></div>
                        <div><p className="text-xs text-gray-500">Reste à payer</p><p className="font-bold text-orange-600">{group.reste.toLocaleString()} DA</p></div>
                      </div>
                    )}
                    {group.sales[0]?.notes && (
                      <div className="col-span-2 sm:col-span-4">
                        <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                        <p className="text-gray-700">{group.sales[0].notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal ajout / modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">{editSale ? 'Modifier la Vente' : 'Nouvelle Vente'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {/* Section client */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Informations Client</p>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Users size={13} /> Sélectionner un client existant
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type="text"
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="Rechercher un client..." />
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                          {filteredCustomers.map(c => (
                            <button key={c.id} type="button"
                              onMouseDown={() => selectCustomer(c.id)}
                              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-emerald-50 text-left border-b border-gray-50 last:border-0">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                                {c.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={9} />{c.phone}</p>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {saleForm.customer_id && (
                      <button type="button" onClick={clearCustomer}
                        className="px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg text-xs border">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {saleForm.customer_id && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={11} /> Client sélectionné — prix personnalisé appliqué
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom (manuel)</label>
                    <input type="text" value={saleForm.customer_name}
                      onChange={e => setSaleForm({ ...saleForm, customer_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="Nom du client" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Phone size={13} /> Téléphone
                    </label>
                    <input type="tel" value={saleForm.customer_phone}
                      onChange={e => setSaleForm({ ...saleForm, customer_phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="06XX XX XX XX" />
                  </div>
                </div>
              </div>

              {/* Section commande — multi-product */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Commande</p>
                  {!editSale && (
                    <button type="button" onClick={addLine}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">
                      <Plus size={14} /> Ajouter un produit
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={saleForm.sale_date}
                    onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>

                {/* Product lines */}
                <div className="space-y-2">
                  {saleForm.lines.map((line, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-2 border border-gray-200">
                      <div className="flex items-center gap-2">
                        {/* Product kind selector */}
                        <div className="flex-shrink-0">
                          {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Type</label>}
                          <select value={line.product_kind}
                            onChange={e => onProductKindChange(idx, e.target.value as ProductKind)}
                            className="px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-amber-500">
                            <option value="boite">Boîte</option>
                            <option value="vrac">Vrac</option>
                          </select>
                        </div>
                        {/* Box size (only if boite) */}
                        {line.product_kind === 'boite' && (
                          <div className="flex-shrink-0">
                            {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Taille</label>}
                            <select value={line.box_size}
                              onChange={e => onBoxSizeChange(idx, parseInt(e.target.value))}
                              className="px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-amber-500">
                              {[6, 10, 12, 20, 24].map(s => <option key={s} value={s}>{s} pcs</option>)}
                            </select>
                          </div>
                        )}
                        {/* Quantity */}
                        <div className="flex-1 min-w-0">
                          {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Qté</label>}
                          <input type="number" min="1" step={line.product_kind === 'vrac' ? '0.5' : '1'} required value={line.quantity}
                            onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 border rounded text-sm" />
                        </div>
                        {/* Price */}
                        <div className="flex-1 min-w-0">
                          {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Prix/{line.unit_label}</label>}
                          <input type="number" min="0" required value={line.unit_price}
                            onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border rounded text-sm" />
                        </div>
                        {/* Line total */}
                        <div className="text-right w-20 flex-shrink-0">
                          {idx === 0 && <label className="block text-xs text-gray-500 mb-0.5">Total</label>}
                          <p className="text-sm font-bold text-gray-900 py-1.5">{(line.quantity * line.unit_price).toLocaleString()} DA</p>
                        </div>
                        {/* Delete */}
                        {saleForm.lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-50 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm text-emerald-700 font-medium">Total général:</span>
                  <span className="text-xl font-bold text-emerald-700">{formTotal.toLocaleString()} DA</span>
                </div>
              </div>

              {/* Section paiement */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiement & Documents</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut de paiement</label>
                  <div className="flex gap-2">
                    {(['paid', 'unpaid', 'partial'] as PaymentStatus[]).map(s => (
                      <button key={s} type="button"
                        onClick={() => onPaymentStatusChange(s)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          saleForm.payment_status === s ? PAYMENT_STYLES[s] : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}>
                        {PAYMENT_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
                {saleForm.payment_status === 'partial' && (
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total: <strong>{formTotal.toLocaleString()} DA</strong></span>
                      <span className="text-orange-600">Reste: <strong>{resteAPayer.toLocaleString()} DA</strong></span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Montant déjà versé (DA)</label>
                      <input type="number" min="0" max={formTotal} value={saleForm.amount_paid}
                        onChange={e => setSaleForm({ ...saleForm, amount_paid: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Truck size={13} /> N° Bon de Livraison
                    </label>
                    <input type="text" value={saleForm.bon_livraison_number}
                      onChange={e => setSaleForm({ ...saleForm, bon_livraison_number: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="BL-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Receipt size={13} /> N° Facture
                    </label>
                    <input type="text" value={saleForm.facture_number}
                      onChange={e => setSaleForm({ ...saleForm, facture_number: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                      placeholder="FAC-001" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={saleForm.notes}
                    onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" rows={2}
                    placeholder="Remarques, instructions de livraison..." />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm">Annuler</button>
                <button type="submit"
                  className="px-5 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium text-sm">
                  {editSale ? 'Modifier' : 'Enregistrer la vente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
