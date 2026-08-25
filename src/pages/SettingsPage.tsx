import React, { useState, useEffect } from 'react';
import { Settings, Save, Database, RefreshCw, Trash2, Info, Building2, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import { offlineStorage } from '../lib/storage';
import type { CompanySettings, Packaging, FiscalInfo } from '../types';

export default function SettingsPage() {
  const { settings, setSettings, packaging, setPackaging, refreshAll } = useApp();

  const [localSettings, setLocalSettings] = useState<Partial<CompanySettings>>({
    company_name: 'Hanky Macarons',
    currency: 'DZD',
    profit_margin: 30
  });

  const [showPackagingModal, setShowPackagingModal] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);

  const [packagingForm, setPackagingForm] = useState({
    name: '',
    box_size: 10,
    unit_cost: 0,
    stock_quantity: 0,
    supplier: ''
  });

  const [fiscalInfo, setFiscalInfo] = useState<FiscalInfo | null>(null);
  const [fiscalForm, setFiscalForm] = useState({
    company_name: 'Hanky Macarons', address: '', city: '', phone: '', email: '',
    rc: '', nif: '', ai: '', nis: '', rib: ''
  });
  const [savingFiscal, setSavingFiscal] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        company_name: settings.company_name,
        currency: settings.currency,
        profit_margin: settings.profit_margin
      });
    }
  }, [settings]);

  useEffect(() => {
    api.fiscalInfoService.get().then(data => {
      if (data) {
        setFiscalInfo(data);
        setFiscalForm({
          company_name: data.company_name, address: data.address || '', city: data.city || '',
          phone: data.phone || '', email: data.email || '', rc: data.rc || '',
          nif: data.nif || '', ai: data.ai || '', nis: data.nis || '', rib: data.rib || ''
        });
      }
    }).catch(() => {});
  }, []);

  const handleSaveFiscal = async () => {
    setSavingFiscal(true);
    try {
      const saved = await api.fiscalInfoService.upsert(fiscalForm);
      setFiscalInfo(saved);
    } catch (error) { console.error('Error saving fiscal info:', error); }
    finally { setSavingFiscal(false); }
  };

  const handleSaveSettings = async () => {
    try {
      if (settings) {
        const updated = await api.settingsService.update({
          id: settings.id,
          ...localSettings
        });
        setSettings(updated);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleAddPackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPackaging) {
        const updated = await api.packagingService.update(editingPackaging.id, packagingForm);
        setPackaging(packaging.map(p => p.id === updated.id ? updated : p));
      } else {
        const newPackaging = await api.packagingService.create(packagingForm);
        setPackaging([...packaging, newPackaging]);
      }
      setShowPackagingModal(false);
      setEditingPackaging(null);
      setPackagingForm({ name: '', box_size: 10, unit_cost: 0, stock_quantity: 0, supplier: '' });
    } catch (error) {
      console.error('Error saving packaging:', error);
    }
  };

  const handleDeletePackaging = async (id: string) => {
    if (!confirm('Supprimer cet emballage?')) return;
    try {
      await api.packagingService.delete(id);
      setPackaging(packaging.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting packaging:', error);
    }
  };

  const handleClearCache = () => {
    if (confirm('Vider le cache local? Cela peut prendre quelques secondes pour recharger les données.')) {
      offlineStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500">Configuration de l'application</p>
      </div>

      {/* Company Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Settings size={24} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Paramètres de l'Entreprise</h2>
            <p className="text-sm text-gray-500">Informations générales</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
            <input
              type="text"
              value={localSettings.company_name || ''}
              onChange={e => setLocalSettings({ ...localSettings, company_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select
              value={localSettings.currency || 'DZD'}
              onChange={e => setLocalSettings({ ...localSettings, currency: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="DZD">Dinar Algérien (DZD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar US (USD)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marge bénéficiaire par défaut (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={localSettings.profit_margin || 30}
              onChange={e => setLocalSettings({ ...localSettings, profit_margin: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
          >
            <Save size={18} />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Packaging Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Database size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Emballages</h2>
              <p className="text-sm text-gray-500">Types de boîtes et leurs coûts</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingPackaging(null);
              setPackagingForm({ name: '', box_size: 10, unit_cost: 0, stock_quantity: 0, supplier: '' });
              setShowPackagingModal(true);
            }}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm"
          >
            Ajouter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nom</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Taille</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Coût</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fournisseur</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packaging.map(pkg => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{pkg.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      {pkg.box_size} pcs
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">{pkg.unit_cost.toLocaleString()} DZD</td>
                  <td className="px-4 py-3 text-right text-gray-600">{pkg.stock_quantity}</td>
                  <td className="px-4 py-3 text-gray-400">{pkg.supplier || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingPackaging(pkg);
                          setPackagingForm({
                            name: pkg.name,
                            box_size: pkg.box_size,
                            unit_cost: pkg.unit_cost,
                            stock_quantity: pkg.stock_quantity,
                            supplier: pkg.supplier || ''
                          });
                          setShowPackagingModal(true);
                        }}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePackaging(pkg.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {packaging.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              Aucun emballage configuré
            </div>
          )}
        </div>
      </div>

      {/* Fiscal Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Building2 size={24} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Coordonnées Fiscales</h2>
            <p className="text-sm text-gray-500">Informations imprimées sur les factures et bons de commande</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
            <input type="text" value={fiscalForm.company_name}
              onChange={e => setFiscalForm({ ...fiscalForm, company_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="text" value={fiscalForm.phone}
              onChange={e => setFiscalForm({ ...fiscalForm, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={fiscalForm.address}
              onChange={e => setFiscalForm({ ...fiscalForm, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input type="text" value={fiscalForm.city}
              onChange={e => setFiscalForm({ ...fiscalForm, city: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={fiscalForm.email}
              onChange={e => setFiscalForm({ ...fiscalForm, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="md:col-span-2"><hr className="border-gray-100" /></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RC (Registre de Commerce)</label>
            <input type="text" value={fiscalForm.rc}
              onChange={e => setFiscalForm({ ...fiscalForm, rc: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIF (N° Identification Fiscale)</label>
            <input type="text" value={fiscalForm.nif}
              onChange={e => setFiscalForm({ ...fiscalForm, nif: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">AI (Article d'Imposition)</label>
            <input type="text" value={fiscalForm.ai}
              onChange={e => setFiscalForm({ ...fiscalForm, ai: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIS (N° Identification Statistique)</label>
            <input type="text" value={fiscalForm.nis}
              onChange={e => setFiscalForm({ ...fiscalForm, nis: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">RIB (Relevé d'Identité Bancaire)</label>
            <input type="text" value={fiscalForm.rib}
              onChange={e => setFiscalForm({ ...fiscalForm, rib: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSaveFiscal} disabled={savingFiscal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-60">
            <Save size={18} /> {savingFiscal ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestion des Données</h2>
            <p className="text-sm text-gray-500">Synchronisation et cache</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Actualiser les données</p>
              <p className="text-sm text-gray-500">Récupère les dernières données depuis le serveur</p>
            </div>
            <button
              onClick={refreshAll}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <RefreshCw size={18} />
              Actualiser
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Vider le cache local</p>
              <p className="text-sm text-gray-500">Supprime les données enregistrées localement</p>
            </div>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
            >
              <Trash2 size={18} />
              Vider
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <Info size={24} />
          <h2 className="text-lg font-semibold">À Propos</h2>
        </div>
        <p className="text-white/80 mb-2">
          Hanky Macarons Production Manager v1.0
        </p>
        <p className="text-sm text-white/70">
          Application de gestion de production pour les fabricants de macarons.
          Hors ligne capable avec synchronisation automatique.
        </p>
      </div>

      {/* Packaging Modal */}
      {showPackagingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingPackaging ? 'Modifier' : 'Nouvel'} Emballage
              </h2>
              <button
                onClick={() => setShowPackagingModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <form onSubmit={handleAddPackaging} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={packagingForm.name}
                  onChange={e => setPackagingForm({ ...packagingForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: Boîte 10 macarons"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taille (nb pièces)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={packagingForm.box_size}
                    onChange={e => setPackagingForm({ ...packagingForm, box_size: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût unitaire (DZD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={packagingForm.unit_cost}
                    onChange={e => setPackagingForm({ ...packagingForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock initial</label>
                  <input
                    type="number"
                    min="0"
                    value={packagingForm.stock_quantity}
                    onChange={e => setPackagingForm({ ...packagingForm, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={packagingForm.supplier}
                    onChange={e => setPackagingForm({ ...packagingForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPackagingModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                >
                  {editingPackaging ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
