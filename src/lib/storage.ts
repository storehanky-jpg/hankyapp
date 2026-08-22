const STORAGE_PREFIX = 'hanky_macarons_';

export const offlineStorage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.error('Failed to remove from localStorage:', e);
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  },

  getAllKeys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  }
};

export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const savePendingSync = (action: string, data: unknown): void => {
  const pending = offlineStorage.get<{ action: string; data: unknown; timestamp: number }[]>('pending_sync') || [];
  pending.push({
    action,
    data,
    timestamp: Date.now()
  });
  offlineStorage.set('pending_sync', pending);
};

export const getPendingSync = (): { action: string; data: unknown; timestamp: number }[] => {
  return offlineStorage.get('pending_sync') || [];
};

export const clearPendingSync = (): void => {
  offlineStorage.remove('pending_sync');
};
