import { v4 as uuidv4 } from 'uuid';
import { offlineStorage } from './storage';

const PENDING_FLAG = '_pendingSync';

function getTombstone(key: string): Set<string> {
  const raw = offlineStorage.get<string[]>(`deleted_${key}`);
  return raw ? new Set(raw) : new Set();
}

function saveTombstone(key: string, ids: Set<string>): void {
  offlineStorage.set(`deleted_${key}`, [...ids]);
}

export function addToTombstone(key: string, id: string): void {
  const tomb = getTombstone(key);
  tomb.add(id);
  saveTombstone(key, tomb);

  // Also add to pending_deletes for sync engine (if it was a remote-origin item)
  const idMap = offlineStorage.get<Record<string, string>>('sync_id_map') || {};
  const pendingDeletes = offlineStorage.get<Record<string, string[]>>(`pending_deletes`) || {};
  if (!pendingDeletes[key]) pendingDeletes[key] = [];
  const remoteId = idMap[id] || id;
  if (!pendingDeletes[key].includes(remoteId)) {
    pendingDeletes[key].push(remoteId);
  }
  offlineStorage.set('pending_deletes', pendingDeletes);
}

export function genId(): string {
  return uuidv4();
}

export function offlineCreate<T>(key: string, item: Partial<T>): T {
  const items = offlineStorage.get<T[]>(key) || [];
  const newItem = {
    ...item,
    id: genId(),
    created_at: new Date().toISOString(),
    [PENDING_FLAG]: true,
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
  const wasPending = items.find(i => i.id === id)?.[PENDING_FLAG as keyof T];
  offlineStorage.set(key, items.filter(i => i.id !== id));

  // If it was a pending-create (never synced), no need to queue a delete
  if (wasPending) {
    const pendingDeletes = offlineStorage.get<Record<string, string[]>>(`pending_deletes`) || {};
    if (pendingDeletes[key]) {
      pendingDeletes[key] = pendingDeletes[key].filter(x => x !== id);
      offlineStorage.set('pending_deletes', pendingDeletes);
    }
  }
}

export function purgeFromLocal<T extends { id: string }>(key: string, id: string): void {
  const items = offlineStorage.get<T[]>(key) || [];
  offlineStorage.set(key, items.filter(i => i.id !== id));
}

export function mergeWithLocal<T extends { id: string }>(key: string, remoteItems: T[]): T[] {
  const localItems = offlineStorage.get<T[]>(key) || [];
  const tomb = getTombstone(key);
  const remoteIds = new Set(remoteItems.map(i => i.id));
  // Keep local-only items (including pending ones that haven't synced yet)
  const localOnly = localItems.filter(i => !remoteIds.has(i.id) && !tomb.has(i.id));
  // Filter out tombstoned items from remote
  const filteredRemote = remoteItems.filter(i => !tomb.has(i.id));
  return [...filteredRemote, ...localOnly];
}
