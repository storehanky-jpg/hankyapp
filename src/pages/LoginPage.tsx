import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, Cookie, Shield, Crown, User, ArrowLeft, Loader2 } from 'lucide-react';

interface UserCard {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
}

export default function LoginPage() {
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserCard | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('public_user_list')
          .select('id, email, display_name, role')
          .order('created_at', { ascending: true });
        if (error) throw error;
        setUsers(data || []);
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setError(null);

    if (!navigator.onLine) {
      setError('Aucune connexion internet.');
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: selectedUser.email,
      password,
    });
    if (signInError) {
      setError('Mot de passe incorrect.');
      setLoading(false);
      return;
    }

    // Verify the account is still active
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', user.id)
        .maybeSingle();
      if (!prof || !prof.is_active) {
        await supabase.auth.signOut();
        setError('Ce compte est désactivé.');
        setLoading(false);
        return;
      }
    }

    // Record admin login history
    if (selectedUser.role === 'admin') {
      try {
        const session = await supabase.auth.getSession();
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-manage-users?action=login_history`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            user_id: selectedUser.id,
            email: selectedUser.email,
            device_info: navigator.userAgent || 'Unknown device',
          }),
        });
      } catch {
        // Non-blocking
      }
    }

    setLoading(false);
  };

  const goBack = () => {
    setSelectedUser(null);
    setPassword('');
    setError(null);
  };

  // ── Password entry screen ──
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Retour à la liste</span>
          </button>

          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl shadow-lg mb-4 ${
              selectedUser.role === 'admin'
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20'
                : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-400/20'
            }`}>
              {selectedUser.role === 'admin'
                ? <Shield className="w-10 h-10 text-white" />
                : <User className="w-10 h-10 text-white" />}
            </div>
            <h1 className="text-2xl font-bold text-amber-900">
              {selectedUser.display_name || selectedUser.email.split('@')[0]}
            </h1>
            <p className="text-amber-600 mt-1 text-sm">Entrez votre mot de passe</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connexion...
                  </>
                ) : 'Se connecter'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── User selection grid ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-4">
            <Cookie className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-amber-900">Hanky Macarons</h1>
          <p className="text-amber-600 mt-1">Gestion Production & Ventes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Choisissez votre profil</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">Sélectionnez votre nom, puis entrez votre mot de passe</p>

          {loadingUsers ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 size={32} className="animate-spin text-amber-500 mb-3" />
              <p className="text-gray-500 text-sm">Chargement des utilisateurs...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 text-sm">Aucun utilisateur trouvé. Contactez l'administrateur.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {users.map(u => {
                const name = u.display_name || u.email.split('@')[0];
                const isAdmin = u.role === 'admin';
                return (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUser(u); setError(null); }}
                    className="group flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-white to-amber-50/50 border-2 border-amber-100 rounded-2xl hover:border-amber-400 hover:shadow-lg transition-all duration-200"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 ${
                      isAdmin
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : 'bg-gradient-to-br from-amber-400 to-orange-500'
                    }`}>
                      {isAdmin ? <Shield size={28} /> : <User size={28} />}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-800 text-sm leading-tight">{name}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 font-medium">
                          <Crown size={10} /> Admin
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Les comptes sont créés uniquement par l'administrateur
        </p>
      </div>
    </div>
  );
}
