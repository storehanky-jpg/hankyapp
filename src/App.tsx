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
import LoginPage from './pages/LoginPage';
import { supabase } from './lib/supabase';
import { Shield, ArrowLeft } from 'lucide-react';

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

  useEffect(() => {
    if (!isLoading && !authLoading && currentPage !== 'dashboard' && !canAccess(currentPage)) {
      setCurrentPage('dashboard');
    }
  }, [currentPage, canAccess, isLoading, authLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isSessionExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-2xl mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Session expirée</h1>
          <p className="text-gray-400 mb-8">
            Pour votre sécurité, la session a été automatiquement déconnectée après 30 minutes d'inactivité.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
          >
            <ArrowLeft size={18} />
            Retour à l'écran de connexion
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
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

    if (!canAccess(currentPage)) {
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

  if (session) {
    return (
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    );
  }

  if (session === undefined) {
    return <LoadingScreen />;
  }

  return <LoginPage />;
}
