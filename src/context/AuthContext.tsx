import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export type PermissionLevel = 'full' | 'read' | 'none';

export interface UserPermissions {
  dashboard: PermissionLevel;
  recipe: PermissionLevel;
  materials: PermissionLevel;
  charges: PermissionLevel;
  production: PermissionLevel;
  customers: PermissionLevel;
  bulksales: PermissionLevel;
  pricing: PermissionLevel;
  reports: PermissionLevel;
  history: PermissionLevel;
  settings: PermissionLevel;
  admin: PermissionLevel;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'user';
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  permissions: UserPermissions | null;
  isAdmin: boolean;
  loading: boolean;
  isSessionExpired: boolean;
  checkPageAccess: (page: string) => PermissionLevel;
  canAccess: (page: string) => boolean;
  canEdit: (page: string) => boolean;
  refreshProfile: () => Promise<void>;
  logAction: (actionType: string, detail: string, page: string) => Promise<void>;
  resetSessionTimer: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVITY_KEY = 'admin_last_activity';

const DEFAULT_PERMISSIONS: UserPermissions = {
  dashboard: 'full', recipe: 'full', materials: 'full',
  charges: 'full', production: 'full', customers: 'full', bulksales: 'full',
  pricing: 'full', reports: 'full', history: 'full', settings: 'full', admin: 'none',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setPermissions(null);
        setLoading(false);
        return;
      }

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !prof) {
        setProfile(null);
        setPermissions(null);
        setLoading(false);
        return;
      }

      setProfile(prof as UserProfile);

      // Load permissions
      const { data: perms } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (perms) {
        setPermissions(perms as unknown as UserPermissions);
      } else if (prof.role === 'admin') {
        setPermissions(DEFAULT_PERMISSIONS);
      } else {
        // Default: dashboard only
        setPermissions({ ...DEFAULT_PERMISSIONS, dashboard: 'full', recipe: 'none', materials: 'none', charges: 'none', production: 'none', customers: 'none', bulksales: 'none', pricing: 'none', reports: 'none', history: 'none', settings: 'none', admin: 'none' });
      }
    } catch {
      setProfile(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session) {
          await loadProfile();
          setIsSessionExpired(false);
        } else {
          setProfile(null);
          setPermissions(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // ── Session timeout (30 min inactivity) ──
  const resetSessionTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    timeoutRef.current = setTimeout(() => {
      setIsSessionExpired(true);
      supabase.auth.signOut();
    }, SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!profile) return;
    resetSessionTimer();

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetSessionTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [profile, resetSessionTimer]);

  // ── Cross-tab logout sync ──
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY) resetSessionTimer();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [resetSessionTimer]);

  const checkPageAccess = useCallback((page: string): PermissionLevel => {
    if (!permissions) return 'none';
    if (profile?.role === 'admin') return 'full';
    return (permissions as unknown as Record<string, PermissionLevel>)[page] || 'none';
  }, [permissions, profile]);

  const canAccess = useCallback((page: string): boolean => {
    const level = checkPageAccess(page);
    return level === 'full' || level === 'read';
  }, [checkPageAccess]);

  const canEdit = useCallback((page: string): boolean => {
    return checkPageAccess(page) === 'full';
  }, [checkPageAccess]);

  const logAction = useCallback(async (actionType: string, detail: string, page: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('admin_action_logs').insert({
        user_id: user.id,
        user_email: profile?.email || user.email,
        action_type: actionType,
        action_detail: detail,
        page,
      });
      if (error) throw error;
    } catch {
      // Silent fail — logging should not block user actions
    }
  }, [profile]);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      profile,
      permissions,
      isAdmin,
      loading,
      isSessionExpired,
      checkPageAccess,
      canAccess,
      canEdit,
      refreshProfile: loadProfile,
      logAction,
      resetSessionTimer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
