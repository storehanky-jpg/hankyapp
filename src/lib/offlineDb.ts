import { v4 as uuidv4 } from 'uuid';
import { offlineStorage } from './storage';

export function genId(): string {
  return uuidv4();
}

export function offlineCreate<T>(key: string, item: Partial<T>): T {
  const items = offlineStorage.get<T[]>(key) || [];
  const newItem = {
    ...item,
    id: genId(),
    created_at: new Date().toISOString(),
  } as T;
  items.unshift(newItem);
  offlineStorage.set(key, items);
  return newItem;
}

export function offlineUpdate<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T {
  const items = offlineStorage.get<T[]>(key) || [];
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) throw new Error('Élément introuvable');
  items[idx] = { ...items[idx], ...updates };
  offlineStorage.set(key, items);
  return items[idx];
}

export function offlineDelete<T extends { id: string }>(key: string, id: string): void {
  const items = offlineStorage.get<T[]>(key) || [];
  offlineStorage.set(key, items.filter(i => i.id !== id));
}

export function mergeWithLocal<T extends { id: string }>(key: string, remoteItems: T[]): T[] {
  const localItems = offlineStorage.get<T[]>(key) || [];
  const remoteIds = new Set(remoteItems.map(i => i.id));
  const localOnly = localItems.filter(i => !remoteIds.has(i.id));
  return [...remoteItems, ...localOnly];
}
