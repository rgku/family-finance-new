"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import * as offlineDB from "@/lib/offline-db";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon: string;
  goal_type: 'savings' | 'expense';
  created_at?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

interface DataContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  goals: Goal[];
  addGoal: (g: Omit<Goal, "id">) => Promise<void>;
  updateGoal: (id: string, g: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number) => Promise<void>;
  
  budgets: Budget[];
  setCurrentBudgetMonth: (month: string) => void;
  addBudget: (b: Omit<Budget, "id" | "spent">) => Promise<void>;
  updateBudget: (id: string, b: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  loading: boolean;
  fetchError: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, supabase: authSupabase } = useAuth();
  const supabase = authSupabase!;
  const { isOnline, pendingCount, saveOffline, fetchAndCache } = useOfflineSync();
  
  const tempIdSeq = useRef(0);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetsRaw, setBudgetsRaw] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const lastFetchUserId = useRef<string | null>(null);
  const lastFetchFamilyId = useRef<string | null>(null);
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;
  const mountedRef = useRef(true);
  const alertsInProgress = useRef(new Set<string>());

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      // Fetch user's family_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('[DataProvider] Error fetching profile:', profileError);
      }
      
      const familyId = profile?.family_id;
      
      // Build filter: user_id = current user OR family_id = current family
      let transactionQuery = supabase
        .from('transactions_decrypted')
        .select('*');
      
      if (familyId) {
        transactionQuery = transactionQuery.or(`user_id.eq.${user.id},family_id.eq.${familyId}`);
      } else {
        transactionQuery = transactionQuery.eq('user_id', user.id);
      }
      
      let goalsQuery = supabase
        .from('goals_decrypted')
        .select('*');
      
      if (familyId) {
        goalsQuery = goalsQuery.or(`user_id.eq.${user.id},family_id.eq.${familyId}`);
      } else {
        goalsQuery = goalsQuery.eq('user_id', user.id);
      }
      
      const [transactionsData, goalsData, budgetsData] = await Promise.all([
        transactionQuery.order('date', { ascending: false }),
        goalsQuery.order('created_at', { ascending: false }),
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user.id)
          .order('month', { ascending: false }),
      ]);
      
      if (transactionsData.error) {
        console.error('[DataProvider] Error fetching transactions:', transactionsData.error);
      }
      
      if (!mountedRef.current) return;
      
      setTransactions(transactionsData.data
          ? transactionsData.data.map(t => {
              const parsedAmount = parseFloat(t.amount) || 0;
              if (parsedAmount === 0 && t.amount !== '0') {
                console.warn('[DataProvider] Transaction with invalid amount:', { id: t.id, rawAmount: t.amount, description: t.description });
              }
              return {
                id: t.id,
                description: t.description || 'Outros',
                amount: parsedAmount,
                type: t.type,
                category: t.category || 'Outros',
                date: t.date,
              };
            })
          : []
        );
      
      setGoals(goalsData.data
        ? goalsData.data.map(g => ({
            id: g.id,
            name: g.name,
            target_amount: parseFloat(g.target_amount),
            current_amount: parseFloat(g.current_amount),
            deadline: g.deadline,
            icon: g.icon,
            goal_type: g.goal_type,
            created_at: g.created_at,
          }))
        : []
      );
      
      setBudgetsRaw(budgetsData.data || []);
      
      // Update last fetch refs
      lastFetchUserId.current = user.id;
      lastFetchFamilyId.current = familyId;
    } catch (error) {
      console.error('[DataProvider] Error fetching data:', error);
      setFetchError(error instanceof Error ? error.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setBudgetsRaw([]);
      setLoading(false);
      lastFetchUserId.current = null;
      lastFetchFamilyId.current = null;
      return;
    }

    fetchData();
  }, [user]);

  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (user && !prevOnlineRef.current && isOnline) {
      fetchData();
    }
    prevOnlineRef.current = isOnline;
  }, [user, isOnline]);

  const lastKnownPending = useRef(0);
  useEffect(() => {
    if (lastKnownPending.current > 0 && pendingCount === 0 && user) {
      fetchData();
    }
    lastKnownPending.current = pendingCount;
  }, [pendingCount]);

  const budgets = useMemo(() => {
    if (!budgetsRaw || budgetsRaw.length === 0) return [];
    
    return budgetsRaw.map(b => {
      const monthTransactions = transactions.filter(t => 
        t.category === b.category && 
        t.type === 'expense' && 
        t.date?.startsWith(currentMonth)
      );
      
      const spent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      return {
        id: b.id,
        category: b.category,
        limit: Number(b.limit_amount),
        spent,
      };
    });
  }, [budgetsRaw, transactions, currentMonth]);

  const addTransaction = async (t: Omit<Transaction, "id">) => {
    if (!user) throw new Error("Must be logged in");

    const tempId = `temp_${Date.now()}_${++tempIdSeq.current}`;
    const newTransaction = {
      id: tempId,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
    };
    setTransactions(prev => [newTransaction, ...prev]);

    if (!isOnline) {
      await saveOffline('transactions', {
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
      }, 'create');
      return;
    }

    try {
      console.debug('[addTransaction] Calling RPC with:', { p_user_id: user.id, p_amount: t.amount, p_description: t.description });
      
      const { error: insertError, data: newId } = await supabase
        .rpc('insert_transaction', {
          p_user_id: user.id,
          p_description: t.description,
          p_amount: t.amount,
          p_type: t.type,
          p_category: t.category,
          p_date: t.date,
        });

      if (insertError) {
        console.error('[addTransaction] RPC error:', insertError);
        throw insertError;
      }
      
      const insertedId = newId && typeof newId === 'object' 
        ? (Array.isArray(newId) ? newId[0] : newId)
        : newId;

      if (insertedId) {
        const { data: insertedData, error: fetchError } = await supabase
          .from('transactions_decrypted')
          .select('*')
          .eq('id', insertedId)
          .single();

        if (fetchError) {
          console.error('[addTransaction] Error fetching inserted tx:', fetchError);
        }

        if (insertedData) {
          setTransactions(prev => {
            const idx = prev.findIndex(t => t.id === tempId);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = {
                id: insertedData.id,
                description: insertedData.description || t.description,
                amount: parseFloat(insertedData.amount) || t.amount,
                type: insertedData.type,
                category: insertedData.category,
                date: insertedData.date,
              };
              return updated;
            }
            return prev;
          });
        } else if (insertedId) {
          setTransactions(prev => {
            const idx = prev.findIndex(t => t.id === tempId);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], id: insertedId as string };
              return updated;
            }
            return prev;
          });
        }

        if (t.type === 'expense') {
          await checkBudgetAlerts(t.category, t.amount);
        }
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      setTransactions(prev => {
        const hasTempId = prev.some(trans => trans.id === tempId);
        return hasTempId ? prev.filter(trans => trans.id !== tempId) : prev;
      });
      throw error;
    }
  };

  // Helper function to send in-app notification
  const sendInAppNotification = async (title: string, body: string, url: string, type: string) => {
    if (!user) return;
    
    try {
      const { error: notifError } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: title,
        p_body: body,
        p_url: url,
        p_type: type,
      });
      
      if (notifError) {
        console.error('[BudgetAlerts] Error creating in-app notification:', notifError);
      } else {
        console.debug('✅ [BudgetAlerts] In-app notification created successfully');
      }
    } catch (rpcError: any) {
      console.error('[BudgetAlerts] RPC error creating notification:', rpcError.message);
    }
  };

  // Helper function to send push notification via OneSignal
  const sendPushNotification = async (title: string, body: string, type: string) => {
    if (!user) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const { error: pushError } = await supabase.functions.invoke('send-push', {
        body: {
          user_id: user.id,
          title: title,
          body: body,
          type: type,
        },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (pushError) {
        console.warn('⚠️ [BudgetAlerts] Push notification skipped:', pushError.message);
      } else {
        console.debug('✅ [BudgetAlerts] Push notification sent successfully');
      }
    } catch (pushError: any) {
      console.warn('⚠️ [BudgetAlerts] Push notification skipped:', pushError.message);
    }
  };

  const processBudgetThreshold = async (
    threshold: { value: number; title: string; type: string },
    percentage: number,
    category: string,
    totalSpent: number,
    budgetLimit: number,
    monthStart: string,
    monthEnd: string
  ) => {
    const alertKey = `${user!.id}-${category}-${threshold.value}`;
    if (alertsInProgress.current.has(alertKey)) return;
    alertsInProgress.current.add(alertKey);

    try {
      if (percentage < threshold.value) {
      const resetThreshold = threshold.value - 10;
      if (percentage < resetThreshold) {
        await supabase.from('budget_alerts')
          .update({ last_sent: null })
          .eq('user_id', user!.id)
          .eq('category', category)
          .eq('threshold_percent', threshold.value);
      }
      return;
    }

    const { data: existingAlerts } = await supabase
      .from('budget_alerts')
      .select('id, last_sent, threshold_percent')
      .eq('user_id', user!.id)
      .eq('category', category)
      .eq('threshold_percent', threshold.value)
      .gte('last_sent', monthStart)
      .lte('last_sent', monthEnd)
      .order('last_sent', { ascending: false })
      .limit(1);

    const existingAlert = existingAlerts?.[0] || null;

    if (!existingAlert) {
      sendInAppNotification(
        threshold.title,
        `Atingiste ${Math.round(percentage)}% do orçamento de ${category} (${totalSpent.toFixed(0)}€/${budgetLimit.toFixed(0)}€)`,
        '/dashboard/budgets',
        threshold.type
      );
      sendPushNotification(
        threshold.title,
        `Atingiste ${Math.round(percentage)}% do orçamento de ${category}`,
        threshold.type
      );
      const { error: upsertError } = await supabase.from('budget_alerts').upsert({
        user_id: user!.id,
        category,
        threshold_percent: threshold.value,
        enabled: true,
        last_sent: new Date().toISOString(),
      });
      if (upsertError) {
        console.error('[BudgetAlerts] Error upserting alert:', upsertError);
      }
      return;
    }

    const reNotifyThreshold = threshold.value + 5;
    if (percentage >= reNotifyThreshold) {
      sendInAppNotification(
        threshold.title + ' (Atualização)',
        `Agora em ${Math.round(percentage)}% do orçamento de ${category} (${totalSpent.toFixed(0)}€/${budgetLimit.toFixed(0)}€)`,
        '/dashboard/budgets',
        threshold.type
      );
      sendPushNotification(
        threshold.title + ' (Atualização)',
        `Agora em ${Math.round(percentage)}% do orçamento de ${category}`,
        threshold.type
      );
      const { error: upsertError } = await supabase.from('budget_alerts').upsert({
        user_id: user!.id,
        category,
        threshold_percent: threshold.value,
        enabled: true,
        last_sent: new Date().toISOString(),
      });
      if (upsertError) {
        console.error('[BudgetAlerts] Error upserting re-notify alert:', upsertError);
      }
    }
    } finally {
      alertsInProgress.current.delete(alertKey);
    }
  };

  const checkBudgetAlerts = async (category: string, amount: number) => {
    if (!supabase || !user) return;
    
    try {
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth() + 1;
      const monthStart = new Date(curYear, curMonth - 1, 1);
      const nextMonth = new Date(curYear, curMonth, 1);
      const startDateStr = monthStart.toISOString().split('T')[0];
      const endDateStr = new Date(curYear, curMonth, 0).toISOString().split('T')[0];
      
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .gte('month', startDateStr)
        .lt('month', nextMonth.toISOString().split('T')[0])
        .maybeSingle();

      if (budgetError) {
        console.error('[BudgetAlerts] Error fetching budget:', budgetError);
        return;
      }

      if (!budget) return;

      const { data: spentTransactions, error: spentError } = await supabase
        .from('transactions_decrypted')
        .select('amount')
        .eq('type', 'expense')
        .eq('category', category)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (spentError) {
        console.error('[BudgetAlerts] Error fetching spent:', spentError);
        return;
      }

      const totalSpent = spentTransactions?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;
      const budgetLimit = parseFloat(budget.limit_amount) || 0;
      
      if (budgetLimit <= 0) return;

      const percentage = (totalSpent / budgetLimit) * 100;

      const thresholds = [
        { value: 100, title: 'Orçamento Esgotado!', type: 'budget_100_percent' },
        { value: 80, title: 'Orçamento 80%', type: 'budget_80_percent' }
      ];

      for (const threshold of thresholds) {
        await processBudgetThreshold(threshold, percentage, category, totalSpent, budgetLimit, startDateStr, endDateStr);
      }
    } catch (error) {
      console.error('[BudgetAlerts] Error checking budget alerts:', error);
    }
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>) => {
    if (!user) throw new Error("Must be logged in");
    
    setTransactions(prev => prev.map(trans => 
      trans.id === id ? { ...trans, ...t } : trans
    ));
    
    if (!isOnline) {
      const updates: any = {};
      if (t.description !== undefined) updates.description = t.description;
      if (t.amount !== undefined) updates.amount = t.amount;
      if (t.type !== undefined) updates.type = t.type;
      if (t.category !== undefined) updates.category = t.category;
      if (t.date !== undefined) updates.date = t.date;
      await saveOffline('transactions', updates, 'update', id);
      return;
    }

    if (typeof id === 'string' && id.startsWith('temp_')) return;
    
    const { error } = await supabase
      .rpc('update_transaction', {
        p_id: id,
        p_user_id: user.id,
        p_description: t.description ?? transactionsRef.current.find(tx => tx.id === id)?.description,
        p_amount: t.amount ?? transactionsRef.current.find(tx => tx.id === id)?.amount,
        p_type: t.type ?? transactionsRef.current.find(tx => tx.id === id)?.type,
        p_category: t.category ?? transactionsRef.current.find(tx => tx.id === id)?.category,
        p_date: t.date ?? transactionsRef.current.find(tx => tx.id === id)?.date,
      });

    if (error) {
      setTransactions(prev => prev.map(trans => 
        trans.id === id ? { ...trans, ...t } : trans
      ));
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error("Must be logged in");
    
    // Optimistic delete
    const deletedTransaction = transactions.find(trans => trans.id === id);
    setTransactions(prev => prev.filter(trans => trans.id !== id));
    
    if (!isOnline) {
      await saveOffline('transactions', {}, 'delete', id);
      return;
    }
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      // Revert on error
      if (deletedTransaction) {
        setTransactions(prev => [deletedTransaction, ...prev]);
      }
      throw error;
    }
  };

  const addGoal = async (g: Omit<Goal, "id">) => {
    if (!user) throw new Error("Must be logged in");

    const tempId = `temp_${Date.now()}_${++tempIdSeq.current}`;
    const newGoal = {
      id: tempId,
      name: g.name,
      target_amount: g.target_amount,
      current_amount: g.current_amount || 0,
      deadline: g.deadline,
      icon: g.icon || 'savings',
      goal_type: g.goal_type || 'savings',
    };
    setGoals(prev => [...prev, newGoal]);

    if (!isOnline) {
      await saveOffline('goals', {
        name: g.name,
        target_amount: g.target_amount,
        current_amount: g.current_amount || 0,
        deadline: g.deadline,
        icon: g.icon,
        goal_type: g.goal_type || 'savings',
      }, 'create');
      return;
    }

    try {
      const { data: newId, error } = await supabase
        .rpc('insert_goal', {
          p_user_id: user.id,
          p_name: g.name,
          p_target_amount: g.target_amount,
          p_current_amount: g.current_amount || 0,
          p_deadline: g.deadline,
          p_icon: g.icon || 'savings',
          p_goal_type: g.goal_type || 'savings',
        });

      if (error) throw error;
      
      const { data: goalData, error: goalFetchError } = await supabase
        .from('goals_decrypted')
        .select('*')
        .eq('id', newId)
        .single();

      if (goalFetchError) {
        console.error('[addGoal] Error fetching inserted goal:', goalFetchError);
      }

      if (goalData) {
        setGoals(prev => prev.map(goal => 
          goal.id === tempId ? {
            id: goalData.id,
            name: goalData.name,
            target_amount: parseFloat(goalData.target_amount) || 0,
            current_amount: parseFloat(goalData.current_amount) || 0,
            deadline: goalData.deadline,
            icon: goalData.icon || 'savings',
            goal_type: goalData.goal_type || 'savings',
          } : goal
        ));
      } else if (newId) {
        setGoals(prev => prev.map(goal =>
          goal.id === tempId ? { ...goal, id: newId as string } : goal
        ));
      }
    } catch (error) {
      setGoals(prev => prev.filter(goal => goal.id !== tempId));
      throw error;
    }
  };

  const updateGoal = async (id: string, g: Partial<Goal>) => {
    if (!user) throw new Error("Must be logged in");
    
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...g } : goal
    ));
    
    if (!isOnline) {
      const updateData: Record<string, unknown> = {};
      if (g.name !== undefined) updateData.name = g.name;
      if (g.deadline !== undefined) updateData.deadline = g.deadline;
      if (g.icon !== undefined) updateData.icon = g.icon;
      if (g.goal_type !== undefined) updateData.goal_type = g.goal_type;
      if (g.target_amount !== undefined) updateData.target_amount = g.target_amount;
      if (g.current_amount !== undefined) updateData.current_amount = g.current_amount;
      await saveOffline('goals', updateData, 'update', id);
      return;
    }
    
    const { error } = await supabase
      .rpc('update_goal', {
        p_id: id,
        p_user_id: user.id,
        p_name: g.name,
        p_target_amount: g.target_amount,
        p_current_amount: g.current_amount,
        p_deadline: g.deadline,
        p_icon: g.icon,
        p_goal_type: g.goal_type,
      });

    if (error) {
      setGoals(prev => prev.map(goal => 
        goal.id === id ? { ...goal, ...g } : goal
      ));
      throw error;
    }
  };

  const addGoalContribution = async (goalId: string, amount: number) => {
    if (!user) throw new Error("Must be logged in");
    if (amount <= 0) throw new Error("Amount must be positive");
    
    const { error } = await supabase.rpc('add_goal_contribution', {
      p_goal_id: goalId,
      p_amount: amount
    });

    if (error) throw error;
    
    // Refresh goals to get updated current_amount
    const { data: updatedGoal } = await supabase
      .from('goals_decrypted')
      .select('*')
      .eq('id', goalId)
      .single();
    
    if (updatedGoal) {
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { 
          ...goal, 
          current_amount: parseFloat(updatedGoal.current_amount) || 0,
          last_contribution_date: new Date().toISOString()
        } : goal
      ));
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) throw new Error("Must be logged in");
    
    // Optimistic delete
    const deletedGoal = goals.find(goal => goal.id === id);
    setGoals(prev => prev.filter(goal => goal.id !== id));
    
    if (!isOnline) {
      await saveOffline('goals', {}, 'delete', id);
      return;
    }
    
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      if (deletedGoal) {
        setGoals(prev => [...prev, deletedGoal]);
      }
      throw error;
    }
  };

  const addBudget = async (b: Omit<Budget, "id" | "spent">) => {
    if (!user) throw new Error("Must be logged in");
    if (!b.category) throw new Error("Categoria é obrigatória");

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    // Optimistic update
    const tempId = `temp_${Date.now()}_${++tempIdSeq.current}`;
    const newBudget = {
      id: tempId,
      user_id: user.id,
      category: b.category,
      limit_amount: b.limit,
      month: currentMonth,
    };
    setBudgetsRaw(prev => [...prev, newBudget]);

    if (!isOnline) {
      await saveOffline('budgets', { ...b, month: currentMonth }, 'create');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          category: b.category,
          limit_amount: b.limit,
          month: currentMonth,
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setBudgetsRaw(prev => prev.map(budget => 
          budget.id === tempId ? data : budget
        ));
      }
    } catch (error) {
      setBudgetsRaw(prev => prev.filter(budget => budget.id !== tempId));
      throw error;
    }
  };

  const updateBudget = async (id: string, b: Partial<Budget>) => {
    if (!user) throw new Error("Must be logged in");
    
    // Optimistic update
    setBudgetsRaw(prev => prev.map(budget => 
      budget.id === id ? { ...budget, limit_amount: b.limit } : budget
    ));
    
    if (!isOnline) {
      await saveOffline('budgets', { limit_amount: b.limit }, 'update', id);
      return;
    }
    
    const { error } = await supabase
      .from('budgets')
      .update({ limit_amount: b.limit })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      setBudgetsRaw(prev => prev.map(budget => 
        budget.id === id ? { ...budget, limit_amount: b.limit } : budget
      ));
      throw error;
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) throw new Error("Must be logged in");
    
    // Optimistic delete
    const deletedBudget = budgetsRaw.find(budget => budget.id === id);
    setBudgetsRaw(prev => prev.filter(budget => budget.id !== id));
    
    if (!isOnline) {
      await saveOffline('budgets', {}, 'delete', id);
      return;
    }
    
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      if (deletedBudget) {
        setBudgetsRaw(prev => [...prev, deletedBudget]);
      }
      throw error;
    }
  };

  const setCurrentBudgetMonth = (month: string) => {
    setCurrentMonth(month);
  };

  const contextValue = useMemo(() => ({
    transactions, addTransaction, updateTransaction, deleteTransaction,
    goals, addGoal, updateGoal, deleteGoal, addGoalContribution,
    budgets: budgets || [], setCurrentBudgetMonth, addBudget, updateBudget, deleteBudget,
    loading, fetchError,
  }), [transactions, goals, budgets, loading, fetchError]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}
