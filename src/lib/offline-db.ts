import { openDB } from 'idb';

export interface OfflineTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  date: string;
  created_at: string;
  synced: boolean;
}

export interface OfflineGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: string;
  current_amount: string;
  deadline?: string;
  icon: string;
  goal_type: 'savings' | 'expense';
  created_at: string;
  synced: boolean;
}

export interface OfflineBudget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  month: string;
  created_at: string;
  synced: boolean;
}

export interface PendingSync {
  id?: number;
  type: 'create' | 'update' | 'delete';
  table: 'transactions' | 'goals' | 'budgets';
  data: any;
  id_to_update?: string;
  created_at: number;
  retry_count: number;
}

const DB_NAME = 'famflow-offline';
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id' });
        store.createIndex('by-user', 'user_id');
        store.createIndex('by-date', 'date');
        store.createIndex('by-synced', 'synced');
      }

      if (!db.objectStoreNames.contains('goals')) {
        const store = db.createObjectStore('goals', { keyPath: 'id' });
        store.createIndex('by-user', 'user_id');
        store.createIndex('by-synced', 'synced');
      }

      if (!db.objectStoreNames.contains('budgets')) {
        const store = db.createObjectStore('budgets', { keyPath: 'id' });
        store.createIndex('by-user', 'user_id');
        store.createIndex('by-synced', 'synced');
      }

      if (!db.objectStoreNames.contains('pendingSync')) {
        const store = db.createObjectStore('pendingSync', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-type', 'type');
        store.createIndex('by-created', 'created_at');
      }

      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta');
      }
    },
  });
}

export async function saveTransaction(tx: OfflineTransaction) {
  const db = await initDB();
  await db.put('transactions', tx);
}

export async function getTransactions(userId: string): Promise<OfflineTransaction[]> {
  const db = await initDB();
  const tx = db.transaction('transactions', 'readonly');
  const index = tx.store.index('by-user');
  return index.getAll(userId);
}

export async function deleteTransaction(id: string) {
  const db = await initDB();
  await db.delete('transactions', id);
}

export async function saveGoal(goal: OfflineGoal) {
  const db = await initDB();
  await db.put('goals', goal);
}

export async function getGoals(userId: string): Promise<OfflineGoal[]> {
  const db = await initDB();
  const tx = db.transaction('goals', 'readonly');
  const index = tx.store.index('by-user');
  return index.getAll(userId);
}

export async function deleteGoal(id: string) {
  const db = await initDB();
  await db.delete('goals', id);
}

export async function saveBudget(budget: OfflineBudget) {
  const db = await initDB();
  await db.put('budgets', budget);
}

export async function getBudgets(userId: string): Promise<OfflineBudget[]> {
  const db = await initDB();
  const tx = db.transaction('budgets', 'readonly');
  const index = tx.store.index('by-user');
  return index.getAll(userId);
}

export async function deleteBudget(id: string) {
  const db = await initDB();
  await db.delete('budgets', id);
}

export async function addToPendingSync(item: Omit<PendingSync, 'id' | 'created_at' | 'retry_count'>) {
  const db = await initDB();
  await db.add('pendingSync', {
    ...item,
    created_at: Date.now(),
    retry_count: 0,
  });
}

export async function getPendingSync(): Promise<PendingSync[]> {
  const db = await initDB();
  return db.getAll('pendingSync');
}

export async function removePendingSync(id: number) {
  const db = await initDB();
  await db.delete('pendingSync', id);
}

export async function updatePendingSyncRetry(id: number) {
  const db = await initDB();
  const item = await db.get('pendingSync', id);
  if (item) {
    item.retry_count++;
    await db.put('pendingSync', item);
  }
}

export async function setLastSyncTime(time: number) {
  const db = await initDB();
  await db.put('meta', time, 'lastSyncTime');
}

export async function getLastSyncTime(): Promise<number | undefined> {
  const db = await initDB();
  return db.get('meta', 'lastSyncTime');
}

export async function clearOfflineData() {
  const db = await initDB();
  await db.clear('transactions');
  await db.clear('goals');
  await db.clear('budgets');
  await db.clear('pendingSync');
  await db.delete('meta', 'lastSyncTime');
}

export async function getUnsyncedCount(): Promise<number> {
  const db = await initDB();
  const pending = await db.getAll('pendingSync');
  return pending.length;
}
