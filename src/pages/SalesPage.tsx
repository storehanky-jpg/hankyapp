import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, ShoppingCart, Calendar, FileText, X,
  Printer, Edit2, Phone, CheckCircle, XCircle, Truck,
  Receipt, ChevronDown, ChevronUp, Search, Users
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { Sale } from '../types';

const defaultPrices: Record<number, number> = { 6: 400, 10: 600, 12: 720, 20: 1100, 24: 1300 };

const emptyForm = () => ({
  sale_date: format(new Date(), 'yyyy-MM-dd'),
  box_size: 10,
  quantity: 1,
  unit_price: 600,
  customer_name: '',
  customer_phone: '',
  customer_id: '',
  notes: '',
  is_paid: false,
  bon_livraison_number: '',
  facture_number: '',
});

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
    const customerPrice = customer.prices?.find(p => p.box_size === saleForm.box_size);
    setSaleForm(f => ({
      ...f,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone || '',
      unit_price: customerPrice?.unit_price ?? defaultPrices[f.box_size] ?? f.unit_price,
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
    setSaleForm({
      sale_date: sale.sale_date,
      box_size: sale.box_size,
      quantity: sale.quantity,
      unit_price: sale.unit_price,
      customer_name: sale.customer_name || '',
      customer_phone: sale.customer_phone || '',
      customer_id: sale.customer_id || '',
      notes: sale.notes || '',
      is_paid: sale.is_paid ?? false,
      bon_livraison_number: sale.bon_livraison_number || '',
      facture_number: sale.facture_number || '',
    });
    const c = customers.find(c => c.id === sale.customer_id);
    setCustomerSearch(c ? c.name : sale.customer_name || '');
    setShowModal(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total_amount = saleForm.quantity * saleForm.unit_price;
      const payload = { ...saleForm, total_amount };
      if (editSale) {
        const updated = await api.salesService.update(editSale.id, payload);
        setSales(sales.map(s => s.id === editSale.id ? updated : s));
      } else {
        const newSale = await api.salesService.create(payload);
        setSales([newSale, ...sales]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving sale:', error);
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

  const togglePaid = async (sale: Sale) => {
    try {
      const updated = await api.salesService.update(sale.id, { is_paid: !sale.is_paid });
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

  const totalAmount = filteredSales.reduce((s, x) => s + x.total_amount, 0);
  const totalBoxes = filteredSales.reduce((s, x) => s + x.quantity, 0);
  const totalPieces = filteredSales.reduce((s, x) => s + x.quantity * x.box_size, 0);
  const paidAmount = filteredSales.filter(s => s.is_paid).reduce((s, x) => s + x.total_amount, 0);
  const unpaidAmount = totalAmount - paidAmount;

  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Ventes - Hanky Macarons</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
            h1 { color: #d97706; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background: #fef3c7; font-weight: bold; }
            .paid { color: #059669; font-weight: bold; }
            .unpaid { color: #dc2626; font-weight: bold; }
            .total { font-weight: bold; margin-top: 16px; font-size: 15px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Hanky Macarons — Rapport des Ventes</h1>
          <p>Edite le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Tel</th>
                <th>Date</th>
                <th>Boite</th>
                <th>Qte</th>
                <th>Prix U.</th>
                <th>Total</th>
                <th>Statut</th>
                <th>BL</th>
                <th>Facture</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(s => `
                <tr>
                  <td>${s.customer_name || '-'}</td>
                  <td>${s.customer_phone || '-'}</td>
                  <td>${format(new Date(s.sale_date), 'dd/MM/yyyy')}</td>
                  <td>${s.box_size} pcs</td>
                  <td>${s.quantity}</td>
                  <td>${s.unit_price.toLocaleString()} DA</td>
                  <td>${s.total_amount.toLocaleString()} DA</td>
                  <td class="${s.is_paid ? 'paid' : 'unpaid'}">${s.is_paid ? 'PAYE' : 'NON PAYE'}</td>
                  <td>${s.bon_livraison_number || '-'}</td>
                  <td>${s.facture_number || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            Total: ${totalAmount.toLocaleString()} DA &nbsp;|&nbsp;
            Paye: ${paidAmount.toLocaleString()} DA &nbsp;|&nbsp;
            Impaye: ${unpaidAmount.toLocaleString()} DA
          </div>
        </body>
      </html>
    `;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

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
          { id: 'date', label: 'Date specifique' },
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
          <p className="text-xs text-gray-500">Boites vendues</p>
          <p className="text-xl font-bold text-gray-900">{totalBoxes}</p>
          <p className="text-xs text-gray-400">{totalPieces} pcs</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium">Paye</p>
          <p className="text-xl font-bold text-emerald-700">{paidAmount.toLocaleString()} DA</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs text-red-600 font-medium">Non paye</p>
          <p className="text-xl font-bold text-red-700">{unpaidAmount.toLocaleString()} DA</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Transactions</p>
          <p className="text-xl font-bold text-gray-900">{filteredSales.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Prix Vente</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Qte</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiement</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">BL</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Facture</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map(sale => (
                <React.Fragment key={sale.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    {/* Client */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedRow(expandedRow === sale.id ? null : sale.id)}
                          className="p-0.5 text-gray-400 hover:text-gray-600"
                          title="Voir details">
                          {expandedRow === sale.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {sale.customer_name || <span className="text-gray-400 italic">Sans nom</span>}
                          </p>
                          {sale.customer_phone && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone size={10} /> {sale.customer_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Date */}
                    <td className="px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr })}
                    </td>
                    {/* Prix vente */}
                    <td className="px-3 py-3 text-right text-sm">
                      <div className="text-gray-900 font-medium">{sale.unit_price.toLocaleString()} DA</div>
                      <div className="text-xs text-gray-400">boite {sale.box_size} pcs</div>
                    </td>
                    {/* Qte */}
                    <td className="px-3 py-3 text-right">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                        {sale.quantity}
                      </span>
                    </td>
                    {/* Total */}
                    <td className="px-3 py-3 text-right font-bold text-gray-900">
                      {sale.total_amount.toLocaleString()} DA
                    </td>
                    {/* Paiement */}
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => togglePaid(sale)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                          sale.is_paid
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                        title="Cliquer pour changer le statut">
                        {sale.is_paid
                          ? <><CheckCircle size={12} /> Paye</>
                          : <><XCircle size={12} /> Non paye</>
                        }
                      </button>
                    </td>
                    {/* BL */}
                    <td className="px-3 py-3 text-center">
                      {sale.bon_livraison_number ? (
                        <button
                          onClick={() => printBL(sale)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                          title="Imprimer le bon de livraison">
                          <Truck size={11} /> {sale.bon_livraison_number}
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    {/* Facture */}
                    <td className="px-3 py-3 text-center">
                      {sale.facture_number ? (
                        <button
                          onClick={() => printFacture(sale)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors"
                          title="Imprimer la facture">
                          <Receipt size={11} /> {sale.facture_number}
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(sale)}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg" title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(sale.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Ligne de detail expandable */}
                  {expandedRow === sale.id && (
                    <tr className="bg-amber-50/60">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Client</p>
                            <p className="font-semibold text-gray-800">{sale.customer_name || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Phone size={10} /> Telephone</p>
                            <p className="font-semibold text-gray-800">{sale.customer_phone || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Truck size={10} /> Bon de Livraison</p>
                            <p className="font-semibold text-blue-700">{sale.bon_livraison_number || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Receipt size={10} /> N° Facture</p>
                            <p className="font-semibold text-violet-700">{sale.facture_number || '—'}</p>
                          </div>
                          {sale.notes && (
                            <div className="col-span-2 sm:col-span-4">
                              <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                              <p className="text-gray-700">{sale.notes}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSales.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            <ShoppingCart size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">Aucune vente enregistree</p>
          </div>
        )}
      </div>

      {/* Modal ajout / modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
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

                {/* Selecteur client depuis la liste */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Users size={13} /> Selecter un client existant
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
                              {c.prices?.find(p => p.box_size === saleForm.box_size) && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                  {c.prices.find(p => p.box_size === saleForm.box_size)?.unit_price.toLocaleString()} DA
                                </span>
                              )}
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
                      <CheckCircle size={11} /> Client selectionne — prix personnalise applique
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom (manuel)</label>
                    <input type="text" value={saleForm.customer_name}
                      onChange={e => setSaleForm({ ...saleForm, customer_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="Nom du client" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Phone size={13} /> Telephone
                    </label>
                    <input type="tel" value={saleForm.customer_phone}
                      onChange={e => setSaleForm({ ...saleForm, customer_phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="06XX XX XX XX" />
                  </div>
                </div>
              </div>

              {/* Section commande */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Commande</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" required value={saleForm.sale_date}
                    onChange={e => setSaleForm({ ...saleForm, sale_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Boite</label>
                    <select value={saleForm.box_size}
                      onChange={e => {
                        const size = parseInt(e.target.value);
                        const customer = customers.find(c => c.id === saleForm.customer_id);
                        const customerPrice = customer?.prices?.find(p => p.box_size === size);
                        setSaleForm(f => ({
                          ...f,
                          box_size: size,
                          unit_price: customerPrice?.unit_price ?? defaultPrices[size] ?? f.unit_price,
                        }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-sm">
                      {[6, 10, 12, 20, 24].map(s => <option key={s} value={s}>{s} pcs</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantite</label>
                    <input type="number" min="1" required value={saleForm.quantity}
                      onChange={e => setSaleForm({ ...saleForm, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix/boite (DA)</label>
                    <input type="number" min="0" required value={saleForm.unit_price}
                      onChange={e => setSaleForm({ ...saleForm, unit_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm text-emerald-700 font-medium">Total:</span>
                  <span className="text-xl font-bold text-emerald-700">
                    {(saleForm.quantity * saleForm.unit_price).toLocaleString()} DA
                  </span>
                </div>
              </div>

              {/* Section paiement */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Paiement & Documents</p>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setSaleForm({ ...saleForm, is_paid: !saleForm.is_paid })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                      saleForm.is_paid
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                    {saleForm.is_paid ? <><CheckCircle size={16} /> Paye</> : <><XCircle size={16} /> Non paye</>}
                  </button>
                  <span className="text-xs text-gray-400">Cliquer pour changer</span>
                </div>
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
                  {editSale ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function printBL(sale: Sale) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`
    <html>
      <head>
        <title>Bon de Livraison ${sale.bon_livraison_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; max-width: 700px; margin: 0 auto; }
          h1 { color: #d97706; font-size: 22px; margin-bottom: 4px; }
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; }
          .bl-num { font-size: 18px; font-weight: bold; color: #1d4ed8; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #fef3c7; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 16px; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; color: #666; }
          .sig-box { border-top: 1px solid #aaa; width: 180px; text-align: center; padding-top: 6px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Hanky Macarons</h1>
            <p style="color:#666;font-size:13px;">Bon de Livraison</p>
          </div>
          <div class="bl-num">BL N° ${sale.bon_livraison_number}</div>
        </div>
        <p><strong>Client:</strong> ${sale.customer_name || '—'}</p>
        <p><strong>Tel:</strong> ${sale.customer_phone || '—'}</p>
        <p><strong>Date:</strong> ${format(new Date(sale.sale_date), 'dd/MM/yyyy')}</p>
        <table>
          <thead>
            <tr><th>Designation</th><th>Quantite</th><th>Prix U.</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Boite Macarons ${sale.box_size} pcs</td>
              <td>${sale.quantity}</td>
              <td>${sale.unit_price.toLocaleString()} DA</td>
              <td>${sale.total_amount.toLocaleString()} DA</td>
            </tr>
          </tbody>
        </table>
        <div class="total">TOTAL: ${sale.total_amount.toLocaleString()} DA</div>
        <div class="footer">
          <div class="sig-box">Signature Client</div>
          <div class="sig-box">Signature Livreur</div>
        </div>
      </body>
    </html>
  `);
  w.document.close();
  w.print();
}

function printFacture(sale: Sale) {
  const w = window.open('', '_blank');
  if (!w) return;
  const now = new Date();
  w.document.write(`
    <html>
      <head>
        <title>Facture ${sale.facture_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; max-width: 700px; margin: 0 auto; }
          h1 { color: #d97706; font-size: 22px; margin-bottom: 4px; }
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; }
          .fac-num { font-size: 18px; font-weight: bold; color: #7c3aed; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #ede9fe; }
          .total-row { font-weight: bold; background: #f5f3ff; }
          .paid-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 13px; }
          .unpaid-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 13px; }
          .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>Hanky Macarons</h1>
            <p style="color:#666;font-size:13px;">Artisanat Patissier</p>
          </div>
          <div>
            <div class="fac-num">FACTURE N° ${sale.facture_number}</div>
            <p style="text-align:right;font-size:13px;color:#666;">Date: ${format(now, 'dd/MM/yyyy')}</p>
          </div>
        </div>
        <p><strong>Client:</strong> ${sale.customer_name || '—'}</p>
        <p><strong>Tel:</strong> ${sale.customer_phone || '—'}</p>
        <p><strong>Date de vente:</strong> ${format(new Date(sale.sale_date), 'dd/MM/yyyy')}</p>
        ${sale.bon_livraison_number ? `<p><strong>Ref. BL:</strong> ${sale.bon_livraison_number}</p>` : ''}
        <table>
          <thead>
            <tr><th>Designation</th><th>Qte</th><th>Prix Unitaire</th><th>Montant HT</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Boite Macarons ${sale.box_size} pieces</td>
              <td>${sale.quantity}</td>
              <td>${sale.unit_price.toLocaleString()} DA</td>
              <td>${sale.total_amount.toLocaleString()} DA</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align:right;">TOTAL A PAYER</td>
              <td>${sale.total_amount.toLocaleString()} DA</td>
            </tr>
          </tbody>
        </table>
        <p>Statut: <span class="${sale.is_paid ? 'paid-badge' : 'unpaid-badge'}">${sale.is_paid ? 'PAYE' : 'NON PAYE'}</span></p>
        <div class="footer">Hanky Macarons — Merci de votre confiance</div>
      </body>
    </html>
  `);
  w.document.close();
  w.print();
}
