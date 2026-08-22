import React, { useState, useMemo } from 'react';
import { History, ShoppingCart, Package, Filter, Printer, Calendar, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../context/AppContext';

export default function HistoryPage() {
  const { sales, materialPurchases, variableExpenses, productionBatches } = useApp();

  const [activeTab, setActiveTab] = useState<'sales' | 'purchases' | 'expenses' | 'production'>('sales');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('month');
  const [customDateStart, setCustomDateStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customDateEnd, setCustomDateEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Filter function
  const filterByDate = <T extends { date?: string; sale_date?: string; purchase_date?: string; batch_date?: string }>(items: T[]): T[] => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    let startDate: string, endDate: string;

    switch (dateFilter) {
      case 'today':
        startDate = endDate = todayStr;
        break;
      case 'week':
        startDate = format(subMonths(today, 0), 'yyyy-MM-dd');
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = format(weekAgo, 'yyyy-MM-dd');
        endDate = todayStr;
        break;
      case 'month':
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
        break;
      case 'year':
        startDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
        endDate = format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd');
        break;
      default:
        startDate = customDateStart;
        endDate = customDateEnd;
    }

    return items.filter(item => {
      const dateStr = item.date || item.sale_date || item.purchase_date || item.batch_date;
      if (!dateStr) return false;
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const filteredSales = useMemo(() => filterByDate(sales), [sales, dateFilter, customDateStart, customDateEnd]);
  const filteredPurchases = useMemo(() => filterByDate(materialPurchases), [materialPurchases, dateFilter, customDateStart, customDateEnd]);
  const filteredExpenses = useMemo(() => filterByDate(variableExpenses), [variableExpenses, dateFilter, customDateStart, customDateEnd]);
  const filteredProduction = useMemo(() => filterByDate(productionBatches), [productionBatches, dateFilter, customDateStart, customDateEnd]);

  const totals = {
    sales: filteredSales.reduce((sum, s) => sum + s.total_amount, 0),
    purchases: filteredPurchases.reduce((sum, p) => sum + p.total_cost, 0),
    expenses: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    production: filteredProduction.reduce((sum, b) => sum + b.produced_quantity, 0)
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: 'sales' as const, label: 'Ventes', icon: <ShoppingCart size={18} />, count: filteredSales.length, total: totals.sales },
    { id: 'purchases' as const, label: 'Achats', icon: <Package size={18} />, count: filteredPurchases.length, total: totals.purchases },
    { id: 'expenses' as const, label: 'Dépenses', icon: <DollarSign size={18} />, count: filteredExpenses.length, total: totals.expenses },
    { id: 'production' as const, label: 'Production', icon: <Calendar size={18} />, count: filteredProduction.length, total: totals.production }
  ];

  return (
    <div className="space-y-6" id="history-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique</h1>
          <p className="text-gray-500">Historique des ventes, achats et dépenses</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors print:hidden"
        >
          <Printer size={18} />
          Imprimer
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 print:shadow-none print:border-none">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Période:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['today', 'week', 'month', 'year', 'all'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === filter
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter === 'today' ? 'Aujourd\'hui' :
                 filter === 'week' ? 'Semaine' :
                 filter === 'month' ? 'Mois' :
                 filter === 'year' ? 'Année' : 'Personnalisé'}
              </button>
            ))}
          </div>
          {dateFilter === 'all' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateStart}
                onChange={e => setCustomDateStart(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={customDateEnd}
                onChange={e => setCustomDateEnd(e.target.value)}
                className="px-3 py-1.5 border rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 print:overflow-visible">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 print:grid-cols-4">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`rounded-xl p-4 transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-50 border-2 border-amber-200'
                : 'bg-white shadow-sm border border-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {tab.icon}
              <span className="text-sm text-gray-500">{tab.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {tab.id === 'production'
                ? tab.total.toLocaleString()
                : `${tab.total.toLocaleString()} DZD`}
            </p>
          </div>
        ))}
      </div>

      {/* Content Tables */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">

        {/* Sales History */}
        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 print:bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Client</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Boîte</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Qté</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix Unit.</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 print:break-inside-avoid">
                    <td className="px-4 py-3 text-gray-600">{format(new Date(sale.sale_date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{sale.customer_name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">{sale.box_size} pcs</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{sale.quantity}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{sale.unit_price.toLocaleString()} DZD</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{sale.total_amount.toLocaleString()} DZD</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 print:bg-gray-100">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-900">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{totals.sales.toLocaleString()} DZD</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Purchases History */}
        {activeTab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Matière</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Quantité</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Prix Unit.</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map(purchase => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{format(new Date(purchase.purchase_date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{purchase.material?.name || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{purchase.quantity} {purchase.material?.unit}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{purchase.unit_cost.toLocaleString()} DZD</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{purchase.total_cost.toLocaleString()} DZD</td>
                    <td className="px-4 py-3 text-gray-400">{purchase.invoice_number || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-gray-900">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-rose-600">{totals.purchases.toLocaleString()} DZD</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Expenses History */}
        {activeTab === 'expenses' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Catégorie</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{expense.name}</td>
                    <td className="px-4 py-3 text-gray-400">{expense.category || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{expense.amount.toLocaleString()} DZD</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">Total:</td>
                  <td className="px-4 py-3 text-right font-bold text-rose-600">{totals.expenses.toLocaleString()} DZD</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Production History */}
        {activeTab === 'production' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Planifié</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Produit</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Pertes</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Efficacité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProduction.map(batch => {
                  const efficiency = batch.planned_quantity > 0
                    ? (batch.produced_quantity / batch.planned_quantity * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{format(new Date(batch.batch_date), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{batch.planned_quantity}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{batch.produced_quantity}</td>
                      <td className="px-4 py-3 text-right text-red-600">{batch.lost_quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          parseFloat(efficiency) >= 95 ? 'bg-green-100 text-green-700' :
                          parseFloat(efficiency) >= 80 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {efficiency}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {filteredProduction.reduce((sum, b) => sum + b.planned_quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">{totals.production}</td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {filteredProduction.reduce((sum, b) => sum + b.lost_quantity, 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'sales' && filteredSales.length === 0) ||
          (activeTab === 'purchases' && filteredPurchases.length === 0) ||
          (activeTab === 'expenses' && filteredExpenses.length === 0) ||
          (activeTab === 'production' && filteredProduction.length === 0)) && (
          <div className="p-12 text-center text-gray-400">
            <History size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Aucune donnée pour cette période</p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #history-page, #history-page * { visibility: visible; }
          #history-page { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
