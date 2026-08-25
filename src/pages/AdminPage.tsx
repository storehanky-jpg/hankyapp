import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, UserPlus, KeyRound, Trash2, Power, Mail, Lock, Eye, EyeOff,
  Check, X, Search, Crown, User, AlertCircle, RefreshCw, Edit3, Clock,
  Activity, ScrollText, Monitor, Smartphone, LogOut, Home,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, type UserPermissions, type PermissionLevel } from '../context/AuthContext';

interface ManagedUser {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  permissions: UserPermissions | null;
}

interface LoginHistoryEntry {
  id: string;
  user_id: string;
  email: string;
  login_time: string;
  device_info: string | null;
}

interface ActionLogEntry {
  id: string;
  user_id: string;
  user_email: string;
  action_type: string;
  action_detail: string | null;
  page: string | null;
  created_at: string;
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-users`;

const PAGE_LABELS: { key: keyof UserPermissions; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Tableau de Bord', icon: '🏪' },
  { key: 'bulksales', label: 'Ventes', icon: '🛒' },
  { key: 'materials', label: 'Achats', icon: '📦' },
  { key: 'charges', label: 'Charges & Frais', icon: '🔧' },
  { key: 'production', label: 'Production', icon: '⚙️' },
  { key: 'customers', label: 'Clients', icon: '👥' },
  { key: 'pricing', label: 'Prix / Produits', icon: '💰' },
  { key: 'reports', label: 'Statistiques', icon: '📊' },
  { key: 'history', label: 'Historique', icon: '🗂️' },
  { key: 'recipe', label: 'Recettes & Chocolat', icon: '👨‍🍳' },
  { key: 'settings', label: 'Parametres', icon: '⚙️' },
  { key: 'admin', label: 'Administration', icon: '🛡️' },
];

const VENDOR_PROFILE: UserPermissions = {
  dashboard: 'full', recipe: 'none', chocolat: 'none', materials: 'read',
  charges: 'none', production: 'none', customers: 'none', bulksales: 'full',
  pricing: 'none', reports: 'none', history: 'read', settings: 'none', admin: 'none',
};

const MANAGER_PROFILE: UserPermissions = {
  dashboard: 'full', recipe: 'none', chocolat: 'none', materials: 'full',
  charges: 'read', production: 'full', customers: 'full', bulksales: 'full',
  pricing: 'none', reports: 'read', history: 'full', settings: 'none', admin: 'none',
};

const FULL_ACCESS: UserPermissions = {
  dashboard: 'full', recipe: 'full', chocolat: 'full', materials: 'full',
  charges: 'full', production: 'full', customers: 'full', bulksales: 'full',
  pricing: 'full', reports: 'full', history: 'full', settings: 'full', admin: 'full',
};

const EMPTY_PERMISSIONS: UserPermissions = {
  dashboard: 'none', recipe: 'none', chocolat: 'none', materials: 'none',
  charges: 'none', production: 'none', customers: 'none', bulksales: 'none',
  pricing: 'none', reports: 'none', history: 'none', settings: 'none', admin: 'none',
};

function getDeviceIcon(deviceInfo: string | null): React.ReactNode {
  if (!deviceInfo) return <Monitor size={14} />;
  const lower = deviceInfo.toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) return <Smartphone size={14} />;
  return <Monitor size={14} />;
}

export default function AdminPage() {
  const { isAdmin, profile, logAction, resetSessionTimer } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'history' | 'logs'>('dashboard');
  const [search, setSearch] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '', display_name: '', role: 'user' as string,
  });
  const [formPerms, setFormPerms] = useState<UserPermissions>({ ...EMPTY_PERMISSIONS });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();

      const [usersRes, histRes, logsRes] = await Promise.all([
        fetch(EDGE_URL, { headers }),
        fetch(`${EDGE_URL}?action=login_history`, { headers }),
        fetch(`${EDGE_URL}?action=action_logs`, { headers }),
      ]);

      const usersData = await usersRes.json().catch(() => ({}));
      if (!usersRes.ok) throw new Error(usersData.error || `Erreur ${usersRes.status}: ${usersRes.statusText}`);
      setUsers(usersData.users || []);

      if (histRes.ok) {
        const histData = await histRes.json();
        setLoginHistory(histData.history || []);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setActionLogs(logsData.logs || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (profile) setCurrentUserId(profile.id);
    if (isAdmin) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [isAdmin, profile, fetchAll]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ── Create user ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6 || formData.password !== formData.confirmPassword) {
      setError('Le mot de passe doit contenir au moins 6 caractères et les deux champs doivent correspondre.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create',
          email: formData.email,
          password: formData.password,
          display_name: formData.display_name || undefined,
          role: formData.role,
          permissions: formPerms,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}: ${res.statusText}`);
      showSuccess(`Utilisateur ${formData.email} créé avec succès`);
      setShowCreate(false);
      setFormData({ email: '', password: '', confirmPassword: '', display_name: '', role: 'user' });
      setFormPerms({ ...EMPTY_PERMISSIONS });
      await new Promise(r => setTimeout(r, 500));
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit user ──
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          user_id: editUser.id,
          display_name: formData.display_name,
          role: formData.role,
          permissions: formPerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      showSuccess('Utilisateur modifié avec succès');
      setEditUser(null);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset password ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || newPassword.length < 6) return;
    setResetting(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'reset_password', email: resetUser.email, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      showSuccess('Mot de passe modifié avec succès');
      setResetUser(null);
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setResetting(false);
    }
  };

  // ── Toggle active ──
  const handleToggleActive = async (user: ManagedUser) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ user_id: user.id, is_active: !user.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      showSuccess(user.is_active ? 'Utilisateur désactivé' : 'Utilisateur activé');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  // ── Delete user ──
  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(EDGE_URL, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ user_id: deleteUser.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      showSuccess('Utilisateur supprimé');
      setDeleteUser(null);
      fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // ── Open edit modal with pre-filled data ──
  const openEdit = (user: ManagedUser) => {
    setEditUser(user);
    setFormData({
      email: user.email,
      password: '',
      confirmPassword: '',
      display_name: user.display_name || '',
      role: user.role,
    });
    setFormPerms(user.permissions ? { ...user.permissions } : { ...EMPTY_PERMISSIONS });
  };

  // ── Apply quick profile ──
  const applyProfile = (profile: UserPermissions, label: string) => {
    setFormPerms({ ...profile });
    showSuccess(`Profil appliqué: ${label}`);
  };

  // ── Set single page permission ──
  const setPagePerm = (key: keyof UserPermissions, level: PermissionLevel) => {
    setFormPerms(prev => ({ ...prev, [key]: level }));
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500">Gestion des utilisateurs</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-500">Seuls les administrateurs peuvent accéder à cette section.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  // ── Admin Dashboard stats ──
  const activeUsers = users.filter(u => u.is_active).length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const todayLogins = loginHistory.filter(l => {
    const d = new Date(l.login_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className="space-y-6" onClick={resetSessionTimer}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-amber-600" size={28} />
            Administration
          </h1>
          <p className="text-gray-500">Gérer les utilisateurs, permissions et sécurité</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          <button
            onClick={() => {
              setShowCreate(true);
              setFormData({ email: '', password: '', confirmPassword: '', display_name: '', role: 'user' });
              setFormPerms({ ...EMPTY_PERMISSIONS });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm shadow-sm"
          >
            <UserPlus size={18} />
            Ajouter utilisateur
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={18} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-start gap-3">
          <Check size={20} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {[
          { id: 'dashboard' as const, label: 'Tableau de bord', icon: <Home size={16} /> },
          { id: 'users' as const, label: 'Utilisateurs', icon: <User size={16} /> },
          { id: 'history' as const, label: 'Connexions', icon: <Clock size={16} /> },
          { id: 'logs' as const, label: 'Journal', icon: <ScrollText size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              adminTab === tab.id
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════ DASHBOARD TAB ════════ */}
      {adminTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl"><User size={20} className="text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  <p className="text-sm text-gray-500">Utilisateurs</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-xl"><Check size={20} className="text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
                  <p className="text-sm text-gray-500">Actifs</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl"><Crown size={20} className="text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
                  <p className="text-sm text-gray-500">Admins</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl"><LogOut size={20} className="text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{todayLogins}</p>
                  <p className="text-sm text-gray-500">Connexions aujourd'hui</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent logins + Recent actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent logins */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Clock size={18} className="text-amber-600" />
                <h3 className="font-semibold text-gray-900">Dernières connexions admin</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {loginHistory.slice(0, 8).map(h => (
                  <div key={h.id} className="p-3 flex items-center gap-3 hover:bg-gray-50">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500">{getDeviceIcon(h.device_info)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{h.email}</p>
                      <p className="text-xs text-gray-400">{new Date(h.login_time).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                ))}
                {loginHistory.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">Aucune connexion</div>}
              </div>
            </div>

            {/* Recent actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Activity size={18} className="text-amber-600" />
                <h3 className="font-semibold text-gray-900">Activité récente</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {actionLogs.slice(0, 8).map(l => (
                  <div key={l.id} className="p-3 flex items-start gap-3 hover:bg-gray-50">
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      l.action_type === 'delete' ? 'bg-red-100 text-red-600' :
                      l.action_type === 'create' ? 'bg-green-100 text-green-600' :
                      l.action_type === 'update' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Activity size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{l.action_detail || l.action_type}</p>
                      <p className="text-xs text-gray-400">{l.user_email} - {new Date(l.created_at).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                ))}
                {actionLogs.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">Aucune activité</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ USERS TAB ════════ */}
      {adminTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-200 border-t-amber-500 mb-3" />
              <p className="text-gray-500 text-sm">Chargement...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nom</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Identifiant</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rôle</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Statut</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Créé le</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                            u.role === 'admin' ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                          }`}>
                            {(u.display_name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-gray-900">{u.display_name || u.email.split('@')[0]}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <Crown size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            <User size={12} /> Vendeur
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <Check size={12} /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            <X size={12} /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(u)} title="Modifier" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => { setResetUser(u); setNewPassword(''); }} title="Modifier le mot de passe" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <KeyRound size={16} />
                          </button>
                          <button onClick={() => handleToggleActive(u)} title={u.is_active ? 'Désactiver' : 'Activer'}
                            className={`p-2 rounded-lg transition-colors ${u.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}>
                            <Power size={16} />
                          </button>
                          {u.id !== currentUserId && (
                            <button onClick={() => setDeleteUser(u)} title="Supprimer" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-400">Aucun utilisateur trouvé</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════ LOGIN HISTORY TAB ════════ */}
      {adminTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <h3 className="font-semibold text-gray-900">Historique des connexions admin</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date & Heure</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Appareil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loginHistory.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{h.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(h.login_time).toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                      {getDeviceIcon(h.device_info)}
                      <span className="truncate max-w-xs">{h.device_info || 'Inconnu'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loginHistory.length === 0 && <div className="p-8 text-center text-gray-400">Aucune connexion enregistrée</div>}
          </div>
        </div>
      )}

      {/* ════════ ACTION LOGS TAB ════════ */}
      {adminTab === 'logs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <ScrollText size={18} className="text-amber-600" />
            <h3 className="font-semibold text-gray-900">Journal des actions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Détail</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Page</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actionLogs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{l.user_email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        l.action_type === 'delete' ? 'bg-red-100 text-red-700' :
                        l.action_type === 'create' ? 'bg-green-100 text-green-700' :
                        l.action_type === 'update' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {l.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{l.action_detail || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{l.page || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(l.created_at).toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {actionLogs.length === 0 && <div className="p-8 text-center text-gray-400">Aucune action enregistrée</div>}
          </div>
        </div>
      )}

      {/* ════════ CREATE / EDIT MODAL ════════ */}
      {(showCreate || editUser) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => { setShowCreate(false); setEditUser(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center gap-3 z-10">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                {showCreate ? <UserPlus className="text-amber-600" size={24} /> : <Edit3 className="text-blue-600" size={24} />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{showCreate ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}</h2>
                <p className="text-sm text-gray-500">{showCreate ? 'Créer un compte avec permissions' : editUser?.email}</p>
              </div>
            </div>

            <form onSubmit={showCreate ? handleCreate : handleEdit} className="p-6 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Ex: Vendeur 1"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                  >
                    <option value="user">Vendeur</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {showCreate && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (identifiant de connexion)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="utilisateur@email.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe privé</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          required
                          minLength={6}
                          placeholder="Minimum 6 caractères"
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                        />
                        <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Confirmer le mot de passe"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Ce mot de passe sera communiqué uniquement à l'utilisateur concerné.</p>
                </>
              )}

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Permissions par page</label>
                </div>

                {/* Quick profiles */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button type="button" onClick={() => applyProfile(VENDOR_PROFILE, 'Vendeur Standard')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                    Profil Vendeur Standard
                  </button>
                  <button type="button" onClick={() => applyProfile(MANAGER_PROFILE, 'Responsable')}
                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
                    Profil Responsable
                  </button>
                  <button type="button" onClick={() => applyProfile(FULL_ACCESS, 'Accès Total')}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors">
                    Accès Total
                  </button>
                  <button type="button" onClick={() => applyProfile(EMPTY_PERMISSIONS, 'Aucun accès')}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
                    Tout retirer
                  </button>
                </div>

                {/* Permission matrix */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Page</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Accès complet</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Lecture seule</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Aucun accès</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {PAGE_LABELS.map(({ key, label, icon }) => {
                        const current = formPerms[key];
                        return (
                          <tr key={key} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{icon} {label}</td>
                            {(['full', 'read', 'none'] as PermissionLevel[]).map(level => (
                              <td key={level} className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setPagePerm(key, level)}
                                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                                    current === level
                                      ? level === 'full' ? 'bg-green-500 border-green-500' :
                                        level === 'read' ? 'bg-blue-400 border-blue-400' :
                                        'bg-red-400 border-red-400'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                >
                                  {current === level && <Check size={14} className="text-white mx-auto" />}
                                </button>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setEditUser(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {saving ? 'Enregistrement...' : showCreate ? 'Enregistrer' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ PASSWORD MODAL ════════ */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setResetUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-100 rounded-xl"><KeyRound className="text-amber-600" size={24} /></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Modifier le mot de passe</h2>
                <p className="text-sm text-gray-500">{resetUser.email}</p>
              </div>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Nouveau mot de passe privé"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setResetUser(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium">Annuler</button>
                <button type="submit" disabled={resetting} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-medium disabled:opacity-60">{resetting ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ DELETE CONFIRM MODAL ════════ */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Supprimer l'utilisateur</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Voulez-vous vraiment supprimer <span className="font-semibold">{deleteUser.email}</span> ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-60">
                {saving ? 'Suppression...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
