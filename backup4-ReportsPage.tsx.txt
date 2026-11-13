import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3, PieChart as PieChartIcon, X } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../context/AppContext';

const COLORS = ['#f59e0b', '#ea580c', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

export default function ReportsPage() {
  const { sales, bulkSales, materialPurchases, fixedCharges, variableExpenses, utilities, laborCosts } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    switch (selectedPeriod) {
      case 'week':
        return {
          start: subDays(today, 7),
          end: today
        };
      case 'month':
        return {
          start: startOfMonth(today),
          end: endOfMonth(today)
        };
      case 'year':
        return {
          start: new Date(currentYear, 0, 1),
          end: new Date(currentYear, 11, 31)
        };
    }
  }, [selectedPeriod]);

  // Monthly revenue data (last 12 months) — box + bulk
  const monthlyRevenueData = useMemo(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(today, i);
      const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

      const monthBoxSales = sales.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd);
      const monthBulkSales = bulkSales.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd);
      const revenue = monthBoxSales.reduce((sum, s) => sum + s.total_amount, 0)
                    + monthBulkSales.reduce((sum, s) => sum + s.total_amount, 0);

      const monthPurchases = materialPurchases.filter(p => p.purchase_date >= monthStart && p.purchase_date <= monthEnd);
      const expenses = monthPurchases.reduce((sum, p) => sum + p.total_cost, 0);

      data.push({
        month: format(month, 'MMM', { locale: fr }),
        fullMonth: format(month, 'MMMM yyyy', { locale: fr }),
        revenus: revenue,
        depenses: expenses,
        benefice: revenue - expenses
      });
    }
    return data;
  }, [sales, bulkSales, materialPurchases]);

  // Daily sales chart (current month) — box + bulk
  const dailySalesData = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(today),
      end: today
    });

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySales = sales.filter(s => s.sale_date === dayStr);
      const dayBulk = bulkSales.filter(s => s.sale_date === dayStr);
      return {
        date: format(day, 'dd'),
        dayName: format(day, 'EEE', { locale: fr }),
        ventes: daySales.reduce((sum, s) => sum + s.total_amount, 0),
        vrac: dayBulk.reduce((sum, s) => sum + s.total_amount, 0),
        transactions: daySales.length + dayBulk.length
      };
    });
  }, [sales, bulkSales]);

  // Box size distribution
  const boxSizeDistribution = useMemo(() => {
    const sizeMap: Record<number, { count: number; amount: number }> = {};
    const monthSales = sales.filter(s => {
      const date = new Date(s.sale_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    monthSales.forEach(s => {
      if (!sizeMap[s.box_size]) {
        sizeMap[s.box_size] = { count: 0, amount: 0 };
      }
      sizeMap[s.box_size].count += s.quantity;
      sizeMap[s.box_size].amount += s.total_amount;
    });

    return Object.entries(sizeMap).map(([size, data]) => ({
      name: `${size} pcs`,
      value: data.count,
      amount: data.amount
    }));
  }, [sales]);

  // Revenue vs Expenses
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  const monthBoxSales = sales.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd);
  const monthBulkSales = bulkSales.filter(s => s.sale_date >= monthStart && s.sale_date <= monthEnd);
  const boxRevenue = monthBoxSales.reduce((sum, s) => sum + s.total_amount, 0);
  const bulkRevenue = monthBulkSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalRevenue = boxRevenue + bulkRevenue;

  // keep alias for table below
  const monthSales = monthBoxSales;

  const monthPurchases = materialPurchases.filter(p => p.purchase_date >= monthStart && p.purchase_date <= monthEnd);
  const totalPurchasesExpenses = monthPurchases.reduce((sum, p) => sum + p.total_cost, 0);

  const fixedMonthly = fixedCharges.filter(c => c.is_active).reduce((sum, c) => {
    switch (c.frequency) {
      case 'daily': return sum + c.amount * 30;
      case 'weekly': return sum + c.amount * 4;
      case 'monthly': return sum + c.amount;
      case 'yearly': return sum + c.amount / 12;
      default: return sum;
    }
  }, 0);

  const variableMonthly = variableExpenses
    .filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const utilitiesMonthly = utilities
    .filter(u => {
      const start = new Date(u.period_start);
      return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
    })
    .reduce((sum, u) => sum + u.amount, 0);

  const laborMonthly = laborCosts
    .filter(l => l.period_month === currentMonth + 1 && l.period_year === currentYear)
    .reduce((sum, l) => sum + l.total_cost, 0);

  const totalExpenses = totalPurchasesExpenses + fixedMonthly + variableMonthly + utilitiesMonthly + laborMonthly;
  const netProfit = totalRevenue - totalExpenses;

  // Expense breakdown for pie chart
  const expenseBreakdown = [
    { name: 'Matières Premières', value: totalPurchasesExpenses },
    { name: 'Charges Fixes', value: fixedMonthly },
    { name: 'Dép. Variables', value: variableMonthly },
    { name: 'Énergie', value: utilitiesMonthly },
    { name: 'Main d\'œuvre', value: laborMonthly }
  ].filter(e => e.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-gray-500">Analyse des performances</p>
        </div>
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          {(['week', 'month', 'year'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {period === 'week' ? 'Semaine' : period === 'month' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl p-5 shadow-lg ${netProfit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'} text-white`}>
          <div className="flex items-center gap-3 mb-2">
            {netProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            <span className="text-sm text-white/80">Bénéfice Net</span>
          </div>
          <p className="text-3xl font-bold">{Math.abs(netProfit).toLocaleString()} DZD</p>
          <p className="text-sm text-white/70 mt-1">{netProfit >= 0 ? 'Bénéfice' : 'Perte'}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="text-blue-500" />
            <span className="text-sm text-gray-500">Chiffre d'Affaires</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} DZD</p>
          <p className="text-xs text-gray-400 mt-1">Boîtes: {boxRevenue.toLocaleString()} · Vrac: {bulkRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart size={20} className="text-emerald-500" />
            <span className="text-sm text-gray-500">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{monthSales.length + monthBulkSales.length}</p>
          <p className="text-xs text-gray-400">{monthSales.reduce((sum, s) => sum + s.quantity, 0)} boîtes · {monthBulkSales.reduce((s, b) => s + b.quantity_kg, 0).toFixed(1)} kg vrac</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={20} className="text-rose-500" />
            <span className="text-sm text-gray-500">Dépenses Totales</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalExpenses.toLocaleString()} DZD</p>
        </div>
      </div>

      {/* Revenue Evolution Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-amber-500" />
          Évolution sur 12 mois
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenus"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                name="Revenus"
              />
              <Area
                type="monotone"
                dataKey="depenses"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#expenseGradient)"
                name="Dépenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventes Quotidiennes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySalesData.filter(d => d.ventes + d.vrac > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="ventes" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Boîtes (DA)" />
                <Bar dataKey="vrac" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Vrac (DA)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Box Size Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChartIcon size={20} className="text-amber-500" />
            Répartition par Taille
          </h3>
          <div className="h-64">
            {boxSizeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={boxSizeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name }) => name}
                  >
                    {boxSizeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Aucune donnée
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Dépenses</h3>
          <div className="h-64">
            {expenseBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name }) => name}
                  >
                    {expenseBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()} DZD`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Aucune dépense
              </div>
            )}
          </div>
        </div>

        {/* Profit Evolution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution du Bénéfice</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => `${value.toLocaleString()} DZD`}
                />
                <Line
                  type="monotone"
                  dataKey="benefice"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">Récapitulatif Mensuel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Ventes boîtes</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-600">+{boxRevenue.toLocaleString()} DZD</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Ventes en vrac</td>
                <td className="px-4 py-3 text-right font-medium text-emerald-600">+{bulkRevenue.toLocaleString()} DZD</td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="px-4 py-3 font-bold text-emerald-800">Chiffre d'Affaires Global</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700 text-lg">{totalRevenue.toLocaleString()} DZD</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Achats matières premières</td>
                <td className="px-4 py-3 text-right text-gray-900">-{totalPurchasesExpenses.toLocaleString()} DZD</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Charges fixes</td>
                <td className="px-4 py-3 text-right text-gray-900">-{fixedMonthly.toLocaleString()} DZD</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Dépenses variables</td>
                <td className="px-4 py-3 text-right text-gray-900">-{variableMonthly.toLocaleString()} DZD</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Gaz/Électricité</td>
                <td className="px-4 py-3 text-right text-gray-900">-{utilitiesMonthly.toLocaleString()} DZD</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">Main d'œuvre</td>
                <td className="px-4 py-3 text-right text-gray-900">-{laborMonthly.toLocaleString()} DZD</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-3 text-gray-900">Bénéfice Net</td>
                <td className={`px-4 py-3 text-right ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netProfit.toLocaleString()} DZD
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
