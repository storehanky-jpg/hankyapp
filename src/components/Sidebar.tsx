import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Wrench, Calculator,
  DollarSign, History, Settings, Menu, X, Wifi, WifiOff,
  ChefHat, FileText, Users, Shield, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Page = 'dashboard' | 'materials' | 'charges' | 'production' | 'bulksales' | 'recipe' | 'pricing' | 'history' | 'settings' | 'reports' | 'customers' | 'admin';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOnline: boolean;
}

const allNavItems: { id: Page; label: string; icon: React.ReactNode }[] = [
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
  { id: 'admin', label: 'Administration', icon: <Shield size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate, isOnline }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { canAccess, profile, isAdmin, isSessionExpired } = useAuth();

  // Filter nav items by permissions
  const navItems = allNavItems.filter(item => {
    if (item.id === 'admin') return isAdmin;
    return canAccess(item.id);
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // If session expired, show banner
  useEffect(() => {
    if (isSessionExpired) {
      setIsOpen(false);
    }
  }, [isSessionExpired]);

  return (
    <>
      {/* Session Expired Banner */}
      {isSessionExpired && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-red-500 text-white text-center py-2 text-sm font-medium shadow-lg">
          Session expirée après 30 minutes d'inactivité. Veuillez vous reconnecter.
        </div>
      )}

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

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-200 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 pb-20 overflow-y-auto h-full">
          {/* Logo */}
          <div className="flex flex-col items-center mb-5">
            <img
              src="/IMG-20260608-WA0000.jpg"
              alt="Hanky Macarons"
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-amber-200"
            />
            <h1 className="text-lg font-bold text-amber-900 mt-2">Hanky Macarons</h1>
            <p className="text-xs text-amber-600 font-medium">Gestion Production</p>
          </div>

          {/* User info */}
          {profile && (
            <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-white/60 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                isAdmin ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-blue-600'
              }`}>
                {(profile.display_name || profile.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{profile.display_name || profile.email.split('@')[0]}</p>
                <p className="text-xs text-gray-500">{isAdmin ? 'Administrateur' : 'Vendeur'}</p>
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${
            isOnline
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="text-sm font-medium">
              {isOnline ? 'En ligne' : 'Mode hors ligne'}
            </span>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsOpen(false);
                }}
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

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-200 bg-amber-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}

export type { Page };
