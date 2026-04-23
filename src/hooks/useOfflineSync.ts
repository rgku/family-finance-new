import { useEffect, useState, useCallback, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/components/AuthProvider';
import * as offlineDB from '@/lib/offline-db';

export function useOfflineSync() {
  const supabase = useSupabase();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const syncInProgressRef = useRef(false);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count
  useEffect(() => {
    let mounted = true;
    
    const updateCount = async () => {
      const count = await offlineDB.getUnsyncedCount();
      if (mounted) {
        setPendingCount(count);
      }
    };
    
    updateCount();
    
    // Check count when coming back online
    if (isOnline) {
      updateCount();
    }
    
    return () => {
      mounted = false;
    };
  }, [isOnline, user]);

  // Sync pending items with mutex to prevent race conditions
  const syncPending = useCallback(async () => {
    if (!isOnline || !user) return;
    
    // Use ref to track sync status for immediate check
    if (syncInProgressRef.current) return;
    
    // Check if there are pending items first
    const pending = await offlineDB.getPendingSync();
    if (pending.length === 0) return;

    syncInProgressRef.current = true;
    setIsSyncing(true);

    try {
      for (const item of pending) {
        try {
          let response;

          switch (item.type) {
            case 'create':
              response = await supabase
                .from(item.table)
                .insert(item.data)
                .select()
                .single();
              break;

            case 'update':
              response = await supabase
                .from(item.table)
                .update(item.data)
                .eq('id', item.id_to_update);
              break;

            case 'delete':
              response = await supabase
                .from(item.table)
                .delete()
                .eq('id', item.id_to_update);
              break;
          }

          if (response && !response.error) {
            await offlineDB.removePendingSync(item.id!);
            
            if (item.type === 'create' && response.data) {
              const syncedData = { ...response.data, synced: true };
              
              if (item.table === 'transactions') {
                await offlineDB.saveTransaction(syncedData);
              } else if (item.table === 'goals') {
                await offlineDB.saveGoal(syncedData);
              } else if (item.table === 'budgets') {
                await offlineDB.saveBudget(syncedData);
              }
            }
          } else {
            await offlineDB.updatePendingSyncRetry(item.id!);
            
            if (item.retry_count >= 3) {
              await offlineDB.removePendingSync(item.id!);
            }
          }
        } catch (error) {
          await offlineDB.updatePendingSyncRetry(item.id!);
        }
      }

      await offlineDB.setLastSyncTime(Date.now());
      
      const remaining = await offlineDB.getUnsyncedCount();
      setPendingCount(remaining);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, user, supabase]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline && user) {
      syncPending();
    }
  }, [isOnline, user]);

  // Save to offline DB and queue for sync
  const saveOffline = useCallback(async (
    table: 'transactions' | 'goals' | 'budgets',
    data: any,
    operation: 'create' | 'update' | 'delete',
    id_to_update?: string
  ) => {
    if (!user) return;

    // Save to offline DB immediately
    if (operation === 'create') {
      const offlineData = { ...data, user_id: user.id, synced: false };
      
      if (table === 'transactions') {
        await offlineDB.saveTransaction(offlineData);
      } else if (table === 'goals') {
        await offlineDB.saveGoal(offlineData);
      } else if (table === 'budgets') {
        await offlineDB.saveBudget(offlineData);
      }
    } else if (operation === 'delete') {
      if (table === 'transactions') {
        await offlineDB.deleteTransaction(id_to_update!);
      } else if (table === 'goals') {
        await offlineDB.deleteGoal(id_to_update!);
      } else if (table === 'budgets') {
        await offlineDB.deleteBudget(id_to_update!);
      }
    }

    // Queue for sync
    if (!isOnline) {
      await offlineDB.addToPendingSync({
        type: operation,
        table,
        data: operation === 'create' ? { ...data, user_id: user.id } : data,
        id_to_update,
      });
    }
  }, [user, isOnline]);

  // Fetch from server and cache locally
  const fetchAndCache = useCallback(async () => {
    if (!user || !isOnline) return;

    try {
      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions_decrypted')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (transactions) {
        for (const tx of transactions) {
          await offlineDB.saveTransaction({ ...tx, synced: true });
        }
      }

      // Fetch goals
      const { data: goals } = await supabase
        .from('goals_decrypted')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goals) {
        for (const goal of goals) {
          await offlineDB.saveGoal({ ...goal, synced: true });
        }
      }

      // Fetch budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (budgets) {
        for (const budget of budgets) {
          await offlineDB.saveBudget({ ...budget, synced: true });
        }
      }

      await offlineDB.setLastSyncTime(Date.now());
    } catch (error) {
    }
  }, [user, isOnline, supabase]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncPending,
    saveOffline,
    fetchAndCache,
  };
}
