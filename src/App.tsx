import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import Sidebar, { type Page } from './components/Sidebar';
import InstallPrompt from './components/InstallPrompt';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import MaterialsPage from './pages/MaterialsPage';
import ChargesPage from './pages/ChargesPage';
import ProductionPage from './pages/ProductionPage';
import BulkSalesPage from './pages/BulkSalesPage';
import RecipePage from './pages/RecipePage';
import PricingPage from './pages/PricingPage';
import ReportsPage from './pages/ReportsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import CustomersPage from './pages/CustomersPage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import { supabase } from './lib/supabase';
import {
  Shield, ArrowLeft, LayoutDashboard, Package, ShoppingCart, Wrench, Calculator,
  DollarSign, History, Settings, Menu, X, Wifi, WifiOff,
  ChefHat, FileText, Users,
} from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { isLoading, isOnline, error, clearError } = useApp();
  const { canAccess, isAdmin, isSessionExpired, loading: authLoading } = useAuth();

  useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      setCurrentPage(e.detail as Page);
    };
    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate', handleNavigate as EventListener);
  }, []);

  // ── Permission check: if user can't access current page, redirect to dashboard ──
  useEffect(() => {
    if (!isLoading && !authLoading && currentPage !== 'dashboard' && !canAccess(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [currentPage, canAccess, isLoading, authLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // ── Session expired screen ──
  if (isSessionExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-2xl mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Session expirée</h1>
          <p className="text-gray-400 mb-8">
            Pour votre sécurité, la session admin a été automatiquement déconnectée après 30 minutes d'inactivité.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
          >
            <ArrowLeft size={18} />
            Retour à l'application
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    // Permission check for admin page only
    if (currentPage === 'admin' && !isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-500 mb-6">Seuls les administrateurs peuvent accéder à cette section.</p>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </button>
        </div>
      );
    }

    // For non-admin pages, check permissions only if user is logged in
    if (isAdmin && currentPage !== 'dashboard' && !canAccess(currentPage)) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-500 mb-6">Vous n'avez pas la permission d'accéder à cette page.</p>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </button>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'recipe': return <RecipePage />;
      case 'materials': return <MaterialsPage />;
      case 'charges': return <ChargesPage />;
      case 'production': return <ProductionPage />;
      case 'bulksales': return <BulkSalesPage />;
      case 'customers': return <CustomersPage />;
      case 'pricing': return <PricingPage />;
      case 'reports': return <ReportsPage />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
      case 'admin': return <AdminPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} isOnline={isOnline} />

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
          <span>{error}</span>
          <button onClick={clearError} className="ml-2 hover:bg-red-600 rounded-lg p-1">x</button>
        </div>
      )}

      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-40 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 lg:ml-72">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Mode hors ligne
        </div>
      )}

      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>

      <InstallPrompt />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-amber-200"></div>
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-amber-500 border-t-transparent absolute top-0"></div>
        </div>
        <h2 className="mt-6 text-xl font-semibold text-amber-900">Hanky Macarons</h2>
        <p className="text-amber-600 mt-2">Chargement...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setSession(null);
      }
    }, 2000);

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!settled) {
          settled = true;
          setSession(data.session);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          setSession(null);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // ── Admin login overlay ──
  if (showAdminLogin) {
    return (
      <AdminLoginPage
        onBack={() => { setShowAdminLogin(false); setSession(null); }}
        onLoggedIn={() => setShowAdminLogin(false)}
      />
    );
  }

  // ── If admin is logged in, wrap with AuthProvider for permissions ──
  // Data loading starts immediately via AppProvider, in parallel with auth check
  if (session) {
    return (
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    );
  }

  // ── No session yet: show main app with data loading in parallel ──
  // If session arrives later (user was logged in), we switch to auth mode
  if (session === undefined) {
    return (
      <AppProvider>
        <NoAuthApp onAdminClick={() => setShowAdminLogin(true)} />
      </AppProvider>
    );
  }

  // ── No session: show main app directly (no auth required) ──
  return (
    <AppProvider>
      <NoAuthApp onAdminClick={() => setShowAdminLogin(true)} />
    </AppProvider>
  );
}

// ── Wrapper for unauthenticated app usage ──
function NoAuthApp({ onAdminClick }: { onAdminClick: () => void }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const { isLoading, isOnline, error, clearError } = useApp();

  useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      setCurrentPage(e.detail as Page);
    };
    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate', handleNavigate as EventListener);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'recipe': return <RecipePage />;
      case 'materials': return <MaterialsPage />;
      case 'charges': return <ChargesPage />;
      case 'production': return <ProductionPage />;
      case 'bulksales': return <BulkSalesPage />;
      case 'customers': return <CustomersPage />;
      case 'pricing': return <PricingPage />;
      case 'reports': return <ReportsPage />;
      case 'history': return <HistoryPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <NoAuthSidebar currentPage={currentPage} onNavigate={setCurrentPage} isOnline={isOnline} onAdminClick={onAdminClick} />

      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
          <span>{error}</span>
          <button onClick={clearError} className="ml-2 hover:bg-red-600 rounded-lg p-1">x</button>
        </div>
      )}

      {!isOnline && (
        <div className="fixed bottom-4 right-4 z-40 bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 lg:ml-72">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Mode hors ligne
        </div>
      )}

      <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {renderPage()}
        </div>
      </main>

      <InstallPrompt />
    </div>
  );
}

// ── Sidebar for unauthenticated mode (all pages visible, admin button at bottom) ──
function NoAuthSidebar({ currentPage, onNavigate, isOnline, onAdminClick }: {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  isOnline: boolean;
  onAdminClick: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard size={20} /> },
    { id: 'recipe', label: 'Recettes & Chocolat', icon: <ChefHat size={20} /> },
    { id: 'materials', label: 'Achats', icon: <Package size={20} /> },
    { id: 'charges', label: 'Charges & Frais', icon: <Wrench size={20} /> },
    { id: 'production', label: 'Production', icon: <Calculator size={20} /> },
    { id: 'customers', label: 'Clients', icon: <Users size={20} /> },
    { id: 'bulksales', label: 'Ventes', icon: <ShoppingCart size={20} /> },
    { id: 'pricing', label: 'Calculateur Prix', icon: <DollarSign size={20} /> },
    { id: 'reports', label: 'Rapports & Stats', icon: <FileText size={20} /> },
    { id: 'history', label: 'Historique', icon: <History size={20} /> },
    { id: 'settings', label: 'Parametres', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="flex items-center gap-2">
          <img src="/IMG-20260608-WA0000.jpg" alt="Hanky Macarons" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-lg">Hanky Macarons</span>
        </div>
        <div className="flex items-center gap-1">
          {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full z-50 w-72 bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-200 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 pb-20 overflow-y-auto h-full">
          <div className="flex flex-col items-center mb-5">
            <img src="/IMG-20260608-WA0000.jpg" alt="Hanky Macarons" className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-amber-200" />
            <h1 className="text-lg font-bold text-amber-900 mt-2">Hanky Macarons</h1>
            <p className="text-xs text-amber-600 font-medium">Gestion Production</p>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="text-sm font-medium">{isOnline ? 'En ligne' : 'Mode hors ligne'}</span>
          </div>

          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                    : 'text-amber-800 hover:bg-amber-100 hover:shadow-sm'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Admin button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-200 bg-amber-50">
          <button
            onClick={onAdminClick}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-amber-700 hover:bg-amber-100 rounded-xl transition-colors text-sm font-medium"
          >
            <Shield size={18} />
            Administration
          </button>
        </div>
      </aside>
    </>
  );
}
