import { supabase } from './supabase';
import { offlineStorage } from './storage';

const PENDING_FLAG = '_pendingSync';
const ID_MAP_KEY = 'sync_id_map';

type IdMap = Record<string, string>;

function getIdMap(): IdMap {
  return offlineStorage.get<IdMap>(ID_MAP_KEY) || {};
}

function saveIdMap(map: IdMap): void {
  offlineStorage.set(ID_MAP_KEY, map);
}

function remapIds(obj: Record<string, unknown>, map: IdMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && map[v]) {
      out[k] = map[v];
    } else if (Array.isArray(v)) {
      out[k] = v.map(item => typeof item === 'string' && map[item] ? map[item] : item);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const SYNCABLE_TABLES: { table: string; storageKey: string; select?: string }[] = [
  { table: 'raw_materials', storageKey: 'raw_materials' },
  { table: 'material_purchases', storageKey: 'material_purchases' },
  { table: 'fixed_charges', storageKey: 'fixed_charges' },
  { table: 'variable_expenses', storageKey: 'variable_expenses' },
  { table: 'utilities', storageKey: 'utilities' },
  { table: 'labor_costs', storageKey: 'labor_costs' },
  { table: 'packaging', storageKey: 'packaging' },
  { table: 'production_batches', storageKey: 'production_batches' },
  { table: 'sales', storageKey: 'sales' },
  { table: 'unsold_products', storageKey: 'unsold_products' },
  { table: 'bulk_sales', storageKey: 'bulk_sales' },
  { table: 'shop_sales', storageKey: 'shop_sales' },
  { table: 'customers', storageKey: 'customers' },
  { table: 'orders', storageKey: 'orders' },
  { table: 'suppliers', storageKey: 'suppliers' },
  { table: 'supplier_purchases', storageKey: 'supplier_purchases' },
  { table: 'customer_prices', storageKey: 'customer_prices' },
  { table: 'customer_products', storageKey: 'customer_products' },
  { table: 'recipe_items', storageKey: 'recipe_items' },
];

export interface SyncResult {
  pushed: number;
  failed: number;
  total: number;
}

export function countPendingOperations(): number {
  let count = 0;
  for (const { storageKey } of SYNCABLE_TABLES) {
    const items = offlineStorage.get<Record<string, unknown>[]>(storageKey) || [];
    count += items.filter(i => i[PENDING_FLAG] === true).length;
  }
  const tombstones = offlineStorage.get<Record<string, string[]>>('pending_deletes') || {};
  for (const ids of Object.values(tombstones)) {
    count += ids.length;
  }
  return count;
}

export async function syncPendingOperations(): Promise<SyncResult> {
  if (!navigator.onLine) return { pushed: 0, failed: 0, total: 0 };

  const idMap = getIdMap();
  let pushed = 0;
  let failed = 0;
  let total = 0;

  // Sync creates/updates first (in table order — parents before children)
  for (const { table, storageKey } of SYNCABLE_TABLES) {
    const items = offlineStorage.get<Record<string, unknown>[]>(storageKey) || [];
    const pending = items.filter(i => i[PENDING_FLAG] === true);
    total += pending.length;

    for (const item of pending) {
      const localId = String(item.id);
      const { [PENDING_FLAG]: _, id: _id, created_at: _ca, ...payload } = item;
      const remapped = remapIds(payload as Record<string, unknown>, idMap);

      try {
        const { data, error } = await supabase.from(table).insert(remapped).select().single();
        if (error) {
          console.error(`Sync insert ${table} (${localId}):`, error.message);
          failed++;
          continue;
        }
        if (data && data.id && data.id !== localId) {
          idMap[localId] = data.id;
        }
        pushed++;
      } catch (err) {
        console.error(`Sync insert ${table} (${localId}):`, err);
        failed++;
      }
    }

    // Remove synced items from local, apply ID remapping
    if (pending.length > 0) {
      const syncedLocalIds = new Set(pending.filter(i => idMap[String(i.id)]).map(i => String(i.id)));
      const updated = items.map(i => {
        const lid = String(i.id);
        if (syncedLocalIds.has(lid)) {
          return { ...i, id: idMap[lid], [PENDING_FLAG]: false };
        }
        return i;
      });
      offlineStorage.set(storageKey, updated);
    }
  }

  saveIdMap(idMap);

  // Sync pending deletes
  const pendingDeletes = offlineStorage.get<Record<string, string[]>>(`pending_deletes`) || {};
  for (const [table, ids] of Object.entries(pendingDeletes)) {
    if (!ids || ids.length === 0) continue;
    const remainingIds: string[] = [];

    for (const id of ids) {
      const remoteId = idMap[id] || id;
      total++;
      try {
        const { error } = await supabase.from(table).delete().eq('id', remoteId);
        if (error) {
          console.error(`Sync delete ${table} (${remoteId}):`, error.message);
          remainingIds.push(id);
          failed++;
        } else {
          pushed++;
        }
      } catch (err) {
        console.error(`Sync delete ${table} (${remoteId}):`, err);
        remainingIds.push(id);
        failed++;
      }
    }

    if (remainingIds.length === 0) {
      delete pendingDeletes[table];
    } else {
      pendingDeletes[table] = remainingIds;
    }
  }
  offlineStorage.set('pending_deletes', pendingDeletes);

  return { pushed, failed, total };
}

export async function runSyncAndRefresh(): Promise<SyncResult> {
  const result = await syncPendingOperations();
  if (result.pushed > 0) {
    console.log(`Sync complete: ${result.pushed} pushed, ${result.failed} failed`);
  }
  return result;
}
