import React from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
  ChefHat, Calendar, ArrowUp, ArrowDown, AlertCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useApp } from '../context/AppContext';

const COLORS = ['#f59e0b', '#ea580c', '#10b981', '#3b82f6', '#8b5cf6'];

export default function Dashboard() {
  const { sales, bulkSales, productionBatches, materialPurchases, fixedCharges, variableExpenses, utilities, laborCosts, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Today's stats
  const salesToday = sales.filter(s => s.sale_date === todayStr);
  const bulkSalesToday = bulkSales.filter(s => s.sale_date === todayStr);
  const boxAmountToday = salesToday.reduce((sum, s) => sum + s.total_amount, 0);
  const bulkAmountToday = bulkSalesToday.reduce((sum, s) => sum + s.total_amount, 0);
  const totalSalesToday = boxAmountToday + bulkAmountToday;
  const boxesSoldToday = salesToday.reduce((sum, s) => sum + s.quantity, 0);

  // Monthly stats
  const salesThisMonth = sales.filter(s => {
    const date = new Date(s.sale_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const bulkSalesThisMonth = bulkSales.filter(s => {
    const date = new Date(s.sale_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const boxAmountMonth = salesThisMonth.reduce((sum, s) => sum + s.total_amount, 0);
  const bulkAmountMonth = bulkSalesThisMonth.reduce((sum, s) => sum + s.total_amount, 0);
  const totalSalesMonth = boxAmountMonth + bulkAmountMonth;

  const purchasesThisMonth = materialPurchases.filter(p => {
    const date = new Date(p.purchase_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const totalPurchasesMonth = purchasesThisMonth.reduce((sum, p) => sum + p.total_cost, 0);

  // Fixed charges monthly equivalent
  const fixedChargesMonthly = fixedCharges
    .filter(c => c.is_active)
    .reduce((sum, c) => {
      switch (c.frequency) {
        case 'daily': return sum + c.amount * 30;
        case 'weekly': return sum + c.amount * 4;
        case 'monthly': return sum + c.amount;
        case 'yearly': return sum + c.amount / 12;
        default: return sum;
      }
    }, 0);

  const variableExpensesMonth = variableExpenses
    .filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const utilitiesMonth = utilities
    .filter(u => {
      const start = new Date(u.period_start);
      return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
    })
    .reduce((sum, u) => sum + u.amount, 0);

  const laborMonth = laborCosts
    .filter(l => l.period_month === currentMonth + 1 && l.period_year === currentYear)
    .reduce((sum, l) => sum + l.total_cost, 0);

  const totalExpensesMonth = fixedChargesMonthly + variableExpensesMonth + utilitiesMonth + laborMonth;
  const profitMonth = totalSalesMonth - (totalExpensesMonth + totalPurchasesMonth);
  const profitToday = totalSalesToday - ((totalExpensesMonth + totalPurchasesMonth) / 30);

  // Production stats
  const productionThisMonth = productionBatches.filter(b => {
    const date = new Date(b.batch_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  const totalProduced = productionThisMonth.reduce((sum, b) => sum + b.produced_quantity, 0);
  const totalLost = productionThisMonth.reduce((sum, b) => sum + b.lost_quantity, 0);

  // Sales chart data - last 7 days (box + bulk)
  const last7Days = eachDayOfInterval({
    start: subDays(today, 6),
    end: today
  });
  const salesChartData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const boxAmt = sales.filter(s => s.sale_date === dayStr).reduce((sum, s) => sum + s.total_amount, 0);
    const bulkAmt = bulkSales.filter(s => s.sale_date === dayStr).reduce((sum, s) => sum + s.total_amount, 0);
    return {
      date: format(day, 'dd/MM', { locale: fr }),
      dayName: format(day, 'EEE', { locale: fr }),
      boites: boxAmt,
      vrac: bulkAmt,
      ventes: boxAmt + bulkAmt
    };
  });

  // Box sizes sold this month
  const boxSizesData: { size: number; count: number }[] = [];
  const sizeMap: Record<number, number> = {};
  salesThisMonth.forEach(s => {
    sizeMap[s.box_size] = (sizeMap[s.box_size] || 0) + s.quantity;
  });
  Object.entries(sizeMap).forEach(([size, count]) => {
    boxSizesData.push({ size: parseInt(size), count });
  });

  // Production vs Sales comparison
  const productionComparisonData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayProduction = productionBatches
      .filter(b => b.batch_date === dayStr)
      .reduce((sum, b) => sum + b.produced_quantity, 0);
    const daySalesCount = sales
      .filter(s => s.sale_date === dayStr)
      .reduce((sum, s) => sum + s.quantity, 0);
    return {
      date: format(day, 'dd/MM'),
      production: dayProduction,
      ventes: daySalesCount
    };
  });

  const statsCards = [
    {
      title: "Chiffre d'Affaires Aujourd'hui",
      value: `${totalSalesToday.toLocaleString()} DZD`,
      subtitle: `${boxesSoldToday} boîtes + ${bulkAmountToday > 0 ? bulkSalesToday.reduce((s, b) => s + b.quantity_kg, 0).toFixed(1) + 'kg vrac' : '0kg vrac'}`,
      icon: <ShoppingCart size={24} />,
      trend: profitToday >= 0,
      trendValue: `${Math.abs(profitToday).toLocaleString()} DZD ${profitToday >= 0 ? 'bénéfice' : 'perte estimée'}`,
      color: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: "Chiffre d'Affaires Mensuel",
      value: `${totalSalesMonth.toLocaleString()} DZD`,
      subtitle: `Boîtes: ${boxAmountMonth.toLocaleString()} · Vrac: ${bulkAmountMonth.toLocaleString()} DZD`,
      icon: <DollarSign size={24} />,
      trend: profitMonth >= 0,
      trendValue: `${Math.abs(profitMonth).toLocaleString()} DZD`,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Production ce Mois',
      value: `${totalProduced.toLocaleString()}`,
      subtitle: `Pertes: ${totalLost} unités`,
      icon: <ChefHat size={24} />,
      trend: totalLost < totalProduced * 0.05,
      trendValue: `${((totalLost / (totalProduced || 1)) * 100).toFixed(1)}% perte`,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Dépenses ce Mois',
      value: `${(totalExpensesMonth + totalPurchasesMonth).toLocaleString()} DZD`,
      subtitle: `Achats: ${totalPurchasesMonth.toLocaleString()} DZD`,
      icon: <Package size={24} />,
      trend: totalPurchasesMonth < totalSalesMonth,
      trendValue: `Charges: ${totalExpensesMonth.toLocaleString()} DZD`,
      color: 'from-rose-500 to-pink-600',
      bgColor: 'bg-rose-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-500 flex items-center gap-2">
            <Calendar size={16} />
            {format(today, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-lg ${profitMonth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          <div className="flex items-center gap-2">
            {profitMonth >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span className="font-medium">
              {profitMonth >= 0 ? 'Bénéfice' : 'Perte'} mensuel: {Math.abs(profitMonth).toLocaleString()} DZD
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <div
            key={i}
            className={`${stat.bgColor} rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm ${stat.trend ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            <p className={`text-xs mt-2 ${stat.trend ? 'text-green-600' : 'text-red-600'}`}>
              {stat.trendValue}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chiffre d'Affaires (7 jours)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="dayName" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} DZD`]}
                />
                <Legend />
                <Bar dataKey="boites" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Boîtes" />
                <Bar dataKey="vrac" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Vrac" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production vs Sales */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Production vs Ventes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="production" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ventes" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Box Sizes and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Box Sizes Sold */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Boîtes Vendues (ce mois)</h3>
          {boxSizesData.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={boxSizesData}
                    dataKey="count"
                    nameKey="size"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ size }) => `${size} pcs`}
                  >
                    {boxSizesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <AlertCircle size={32} className="mx-auto mb-2" />
                <p>Aucune vente ce mois</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Détail</th>
                  <th className="pb-3 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...sales.slice(0, 4).map(s => ({ date: s.sale_date, type: 'boite' as const, detail: `${s.quantity} boîte(s) × ${s.box_size} pcs`, amount: s.total_amount })),
                  ...bulkSales.slice(0, 3).map(s => ({ date: s.sale_date, type: 'vrac' as const, detail: `${s.quantity_kg} kg × ${s.price_per_kg.toLocaleString()} DZD/kg`, amount: s.total_amount }))
                ]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 6)
                  .map((item, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 text-sm text-gray-600">
                        {format(new Date(item.date), 'dd MMM', { locale: fr })}
                      </td>
                      <td className="py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.type === 'boite' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.type === 'boite' ? 'Boîte' : 'Vrac'}
                        </span>
                      </td>
                      <td className="py-3 text-sm text-gray-600">{item.detail}</td>
                      <td className="py-3 text-sm text-gray-900 font-medium text-right">
                        {item.amount.toLocaleString()} DZD
                      </td>
                    </tr>
                  ))}
                {sales.length === 0 && bulkSales.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">
                      Aucune vente enregistrée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Raccourcis</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'bulksales' }))}
            className="bg-white/20 hover:bg-white/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <ShoppingCart size={24} />
            <span className="text-sm font-medium">Nouvelle Vente</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'production' }))}
            className="bg-white/20 hover:bg-white/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <ChefHat size={24} />
            <span className="text-sm font-medium">Production</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'materials' }))}
            className="bg-white/20 hover:bg-white/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <Package size={24} />
            <span className="text-sm font-medium">Matières</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'pricing' }))}
            className="bg-white/20 hover:bg-white/30 rounded-xl p-4 flex flex-col items-center gap-2 transition-colors"
          >
            <DollarSign size={24} />
            <span className="text-sm font-medium">Calcul Prix</span>
          </button>
        </div>
      </div>
    </div>
  );
}
