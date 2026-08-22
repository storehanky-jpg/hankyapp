import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Zap, Flame, Users, Receipt, X } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { FixedCharge, VariableExpense, Utility, LaborCost } from '../types';

type Tab = 'fixed' | 'variable' | 'utilities' | 'labor';

export default function ChargesPage() {
  const {
    fixedCharges, setFixedCharges,
    variableExpenses, setVariableExpenses,
    utilities, setUtilities,
    laborCosts, setLaborCosts
  } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>('fixed');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FixedCharge | VariableExpense | Utility | LaborCost | null>(null);

  // Fixed charges form
  const [fixedForm, setFixedForm] = useState({
    name: '',
    amount: 0,
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    category: '',
    is_active: true
  });

  // Variable expenses form
  const [variableForm, setVariableForm] = useState({
    name: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    notes: ''
  });

  // Utilities form
  const [utilityForm, setUtilityForm] = useState({
    type: 'electricity' as 'gas' | 'electricity',
    amount: 0,
    period_start: format(new Date(), 'yyyy-MM-dd'),
    period_end: format(new Date(), 'yyyy-MM-dd'),
    consumption: 0,
    unit: 'kWh'
  });

  // Labor form
  const [laborForm, setLaborForm] = useState({
    employee_name: '',
    daily_wage: 0,
    worked_days: 0,
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      switch (activeTab) {
        case 'fixed': {
          if (editingItem) {
            const updated = await api.fixedChargesService.update(editingItem.id, fixedForm);
            setFixedCharges(fixedCharges.map(c => c.id === updated.id ? updated : c));
          } else {
            const newCharge = await api.fixedChargesService.create(fixedForm);
            setFixedCharges([...fixedCharges, newCharge]);
          }
          break;
        }
        case 'variable': {
          const newExpense = await api.variableExpensesService.create(variableForm);
          setVariableExpenses([newExpense, ...variableExpenses]);
          break;
        }
        case 'utilities': {
          const newUtility = await api.utilitiesService.create(utilityForm);
          setUtilities([newUtility, ...utilities]);
          break;
        }
        case 'labor': {
          const total_cost = laborForm.daily_wage * laborForm.worked_days;
          const newLabor = await api.laborCostsService.create({ ...laborForm, total_cost });
          setLaborCosts([newLabor, ...laborCosts]);
          break;
        }
      }
      closeModal();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet élément?')) return;
    try {
      switch (activeTab) {
        case 'fixed':
          await api.fixedChargesService.delete(id);
          setFixedCharges(fixedCharges.filter(c => c.id !== id));
          break;
        case 'variable':
          await api.variableExpensesService.delete(id);
          setVariableExpenses(variableExpenses.filter(e => e.id !== id));
          break;
        case 'utilities':
          await api.utilitiesService.delete(id);
          setUtilities(utilities.filter(u => u.id !== id));
          break;
        case 'labor':
          await api.laborCostsService.delete(id);
          setLaborCosts(laborCosts.filter(l => l.id !== id));
          break;
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const openModal = (item?: FixedCharge | VariableExpense | Utility | LaborCost) => {
    if (item) {
      setEditingItem(item);
      if (activeTab === 'fixed') {
        const fc = item as FixedCharge;
        setFixedForm({
          name: fc.name,
          amount: fc.amount,
          frequency: fc.frequency,
          category: fc.category || '',
          is_active: fc.is_active
        });
      }
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    resetForms();
  };

  const resetForms = () => {
    setFixedForm({ name: '', amount: 0, frequency: 'monthly', category: '', is_active: true });
    setVariableForm({ name: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd'), category: '', notes: '' });
    setUtilityForm({ type: 'electricity', amount: 0, period_start: format(new Date(), 'yyyy-MM-dd'), period_end: format(new Date(), 'yyyy-MM-dd'), consumption: 0, unit: 'kWh' });
    setLaborForm({ employee_name: '', daily_wage: 0, worked_days: 0, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() });
  };

  // Calculate monthly totals
  const fixedMonthly = fixedCharges
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

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

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

  const totalChargesMonthly = fixedMonthly + variableMonthly + utilitiesMonthly + laborMonthly;

  const tabs = [
    { id: 'fixed' as Tab, label: 'Charges Fixes', icon: <Receipt size={18} />, count: fixedCharges.length },
    { id: 'variable' as Tab, label: 'Dépenses Variables', icon: <Zap size={18} />, count: variableExpenses.length },
    { id: 'utilities' as Tab, label: 'Gaz/Électricité', icon: <Flame size={18} />, count: utilities.length },
    { id: 'labor' as Tab, label: 'Main d\'œuvre', icon: <Users size={18} />, count: laborCosts.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Charges et Frais</h1>
          <p className="text-gray-500">Gestion des coûts d'exploitation</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Ajouter
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Charges Fixes</p>
              <p className="text-lg font-bold text-gray-900">{fixedMonthly.toLocaleString()} DZD</p>
              <p className="text-xs text-gray-400">/mois</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dép. Variables</p>
              <p className="text-lg font-bold text-gray-900">{variableMonthly.toLocaleString()} DZD</p>
              <p className="text-xs text-gray-400">ce mois</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Énergie</p>
              <p className="text-lg font-bold text-gray-900">{utilitiesMonthly.toLocaleString()} DZD</p>
              <p className="text-xs text-gray-400">ce mois</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Main d'œuvre</p>
              <p className="text-lg font-bold text-gray-900">{laborMonthly.toLocaleString()} DZD</p>
              <p className="text-xs text-gray-400">ce mois</p>
            </div>
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80">Total Charges Mensuelles</p>
            <p className="text-2xl font-bold">{totalChargesMonthly.toLocaleString()} DZD</p>
          </div>
          <Receipt size={40} className="text-white/30" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
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

      {/* Content Tables */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Fixed Charges */}
        {activeTab === 'fixed' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nom</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Montant</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fréquence</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Mensuel</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fixedCharges.map(charge => {
                  let monthly = charge.amount;
                  switch (charge.frequency) {
                    case 'daily': monthly = charge.amount * 30; break;
                    case 'weekly': monthly = charge.amount * 4; break;
                    case 'yearly': monthly = charge.amount / 12; break;
                  }
                  return (
                    <tr key={charge.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{charge.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{charge.amount.toLocaleString()} DZD</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                          {charge.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{monthly.toLocaleString()} DZD</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${charge.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {charge.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openModal(charge)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(charge.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
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
        )}

        {/* Variable Expenses */}
        {activeTab === 'variable' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Catégorie</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Montant</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variableExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{expense.name}</td>
                    <td className="px-4 py-3 text-gray-600">{expense.category || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{expense.amount.toLocaleString()} DZD</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Utilities */}
        {activeTab === 'utilities' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Période</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Consommation</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Montant</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {utilities.map(utility => (
                  <tr key={utility.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {utility.type === 'electricity' ? (
                          <Zap size={16} className="text-amber-500" />
                        ) : (
                          <Flame size={16} className="text-orange-500" />
                        )}
                        <span className="font-medium text-gray-900 capitalize">
                          {utility.type === 'electricity' ? 'Électricité' : 'Gaz'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(utility.period_start), 'dd/MM')} - {format(new Date(utility.period_end), 'dd/MM/yy')}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {utility.consumption ? `${utility.consumption} ${utility.unit}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{utility.amount.toLocaleString()} DZD</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button onClick={() => handleDelete(utility.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Labor Costs */}
        {activeTab === 'labor' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employé</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Salaire/Jour</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Jours</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Période</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {laborCosts.map(labor => (
                  <tr key={labor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{labor.employee_name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{labor.daily_wage.toLocaleString()} DZD</td>
                    <td className="px-4 py-3 text-right text-gray-600">{labor.worked_days}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {labor.period_month}/{labor.period_year}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{labor.total_cost.toLocaleString()} DZD</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button onClick={() => handleDelete(labor.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'fixed' && fixedCharges.length === 0) ||
          (activeTab === 'variable' && variableExpenses.length === 0) ||
          (activeTab === 'utilities' && utilities.length === 0) ||
          (activeTab === 'labor' && laborCosts.length === 0)) && (
          <div className="p-8 text-center text-gray-400">
            Aucune donnée
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Ajouter - {tabs.find(t => t.id === activeTab)?.label}</h2>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {activeTab === 'fixed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      required
                      value={fixedForm.name}
                      onChange={e => setFixedForm({ ...fixedForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Ex: Loyer, Assurance..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DZD)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={fixedForm.amount}
                        onChange={e => setFixedForm({ ...fixedForm, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                      <select
                        value={fixedForm.frequency}
                        onChange={e => setFixedForm({ ...fixedForm, frequency: e.target.value as typeof fixedForm.frequency })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="daily">Journalier</option>
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuel</option>
                        <option value="yearly">Annuel</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie (optionnel)</label>
                    <input
                      type="text"
                      value={fixedForm.category}
                      onChange={e => setFixedForm({ ...fixedForm, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Local, Transport..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={fixedForm.is_active}
                      onChange={e => setFixedForm({ ...fixedForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                  </div>
                </>
              )}

              {activeTab === 'variable' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      required
                      value={variableForm.name}
                      onChange={e => setVariableForm({ ...variableForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DZD)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={variableForm.amount}
                        onChange={e => setVariableForm({ ...variableForm, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={variableForm.date}
                        onChange={e => setVariableForm({ ...variableForm, date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <input
                      type="text"
                      value={variableForm.category}
                      onChange={e => setVariableForm({ ...variableForm, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ex: Réparation, Transport..."
                    />
                  </div>
                </>
              )}

              {activeTab === 'utilities' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="utility_type"
                          value="electricity"
                          checked={utilityForm.type === 'electricity'}
                          onChange={() => setUtilityForm({ ...utilityForm, type: 'electricity', unit: 'kWh' })}
                          className="w-4 h-4 text-amber-500"
                        />
                        <Zap size={18} className="text-amber-500" />
                        <span>Électricité</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="utility_type"
                          value="gas"
                          checked={utilityForm.type === 'gas'}
                          onChange={() => setUtilityForm({ ...utilityForm, type: 'gas', unit: 'm³' })}
                          className="w-4 h-4 text-amber-500"
                        />
                        <Flame size={18} className="text-orange-500" />
                        <span>Gaz</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Début période</label>
                      <input
                        type="date"
                        required
                        value={utilityForm.period_start}
                        onChange={e => setUtilityForm({ ...utilityForm, period_start: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fin période</label>
                      <input
                        type="date"
                        required
                        value={utilityForm.period_end}
                        onChange={e => setUtilityForm({ ...utilityForm, period_end: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consommation</label>
                      <input
                        type="number"
                        min="0"
                        value={utilityForm.consumption}
                        onChange={e => setUtilityForm({ ...utilityForm, consumption: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                      <input
                        type="text"
                        value={utilityForm.unit}
                        onChange={e => setUtilityForm({ ...utilityForm, unit: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DZD)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={utilityForm.amount}
                      onChange={e => setUtilityForm({ ...utilityForm, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {activeTab === 'labor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'employé</label>
                    <input
                      type="text"
                      required
                      value={laborForm.employee_name}
                      onChange={e => setLaborForm({ ...laborForm, employee_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salaire/jour (DZD)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={laborForm.daily_wage}
                        onChange={e => setLaborForm({ ...laborForm, daily_wage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Jours travaillés</label>
                      <input
                        type="number"
                        min="0"
                        max="31"
                        required
                        value={laborForm.worked_days}
                        onChange={e => setLaborForm({ ...laborForm, worked_days: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                      <select
                        value={laborForm.period_month}
                        onChange={e => setLaborForm({ ...laborForm, period_month: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i + 1}>
                            {new Date(0, i).toLocaleDateString('fr', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
                      <input
                        type="number"
                        min="2020"
                        max="2030"
                        required
                        value={laborForm.period_year}
                        onChange={e => setLaborForm({ ...laborForm, period_year: parseInt(e.target.value) || currentYear })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <p className="text-sm text-amber-800">
                      Total: <span className="font-bold">{(laborForm.daily_wage * laborForm.worked_days).toLocaleString()} DZD</span>
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  {editingItem ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
