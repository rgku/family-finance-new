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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, supabase: authSupabase } = useAuth();
  const supabase = authSupabase!;
  const { isOnline, saveOffline, fetchAndCache } = useOfflineSync();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetsRaw, setBudgetsRaw] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const lastFetchUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setBudgetsRaw([]);
      setLoading(false);
      lastFetchUserId.current = null;
      return;
    }

    if (lastFetchUserId.current === user.id) {
      return;
    }
    lastFetchUserId.current = user.id;

    const fetchData = async () => {
      setLoading(true);
      
      // Try to load from IndexedDB first (for offline support)
      const [cachedTransactions, cachedGoals, cachedBudgets] = await Promise.all([
        offlineDB.getTransactions(user.id),
        offlineDB.getGoals(user.id),
        offlineDB.getBudgets(user.id),
      ]);
      
      // Use cached data immediately
      if (cachedTransactions.length > 0) {
        setTransactions(cachedTransactions.map(t => ({
          id: t.id,
          description: t.description || '',
          amount: parseFloat(t.amount) || 0,
          type: t.type,
          category: t.category,
          date: t.date,
        })));
      }
      
      if (cachedGoals.length > 0) {
        setGoals(cachedGoals.map(g => ({
          id: g.id,
          name: g.name,
          target_amount: parseFloat(g.target_amount) || 0,
          current_amount: parseFloat(g.current_amount) || 0,
          deadline: g.deadline,
          icon: g.icon || 'savings',
          goal_type: g.goal_type || 'savings',
          created_at: g.created_at,
        })));
      }
      
      if (cachedBudgets.length > 0) {
        setBudgetsRaw(cachedBudgets);
      }
      
      // If online, fetch fresh data from server
      if (isOnline) {
        const [transResult, goalsResult, budgetsResult] = await Promise.all([
          supabase.from('transactions_decrypted').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          supabase.from('goals_decrypted').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('budgets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);
        
        if (transResult.data) {
          const validTransactions = transResult.data.filter(t => 
            t.description && t.description.trim() !== '' && 
            t.amount && parseFloat(t.amount) > 0
          );
          setTransactions(validTransactions.map(t => ({
            id: t.id,
            description: t.description || '',
            amount: parseFloat(t.amount) || 0,
            type: t.type,
            category: t.category,
            date: t.date,
          })));
        }

        if (goalsResult.data) {
          setGoals(goalsResult.data.map(g => ({
            id: g.id,
            name: g.name,
            target_amount: parseFloat(g.target_amount) || 0,
            current_amount: parseFloat(g.current_amount) || 0,
            deadline: g.deadline,
            icon: g.icon || 'savings',
            goal_type: g.goal_type || 'savings',
            created_at: g.created_at,
          })));
        }

        if (budgetsResult.data) {
          setBudgetsRaw(budgetsResult.data);
        }
        
        // Cache the fresh data
        await fetchAndCache();
      }

      setLoading(false);
    };

    fetchData();
  }, [user, isOnline]);

  const budgets = useMemo(() => {
    if (!budgetsRaw || budgetsRaw.length === 0) return [];
    
    return budgetsRaw.map(b => {
      const monthTransactions = transactions.filter(t => 
        t.category === b.category && 
        t.type === 'expense' && 
        t.date.startsWith(currentMonth)
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

    const tempId = `temp_${Date.now()}`;
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
      const { error: insertError, data: newId } = await supabase
        .rpc('insert_transaction', {
          p_user_id: user.id,
          p_description: t.description,
          p_amount: t.amount,
          p_type: t.type,
          p_category: t.category,
          p_date: t.date,
        });

      if (insertError) throw insertError;
      
      // Small delay to ensure DB is updated
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch recently inserted transactions and find ours
      const { data: recentTransactions, error: fetchError } = await supabase
        .from('transactions_decrypted')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (fetchError) {
        console.error('Failed to fetch transactions:', fetchError);
        // Keep optimistic update
      } else if (recentTransactions && recentTransactions.length > 0) {
        const insertedData = recentTransactions.find(trans => 
          trans.id === newId ||
          (trans.type === t.type &&
          trans.category === t.category &&
          trans.date === t.date &&
          Math.abs((parseFloat(trans.amount) || 0) - t.amount) < 0.01)
        ) || recentTransactions[0];
        
        setTransactions(prev => {
          return prev.map(trans => 
            trans.id === tempId ? {
              id: insertedData.id,
              description: insertedData.description || t.description,
              amount: parseFloat(insertedData.amount) || t.amount,
              type: insertedData.type,
              category: insertedData.category,
              date: insertedData.date,
            } : trans
          );
        });
        
        // Check budget alerts for expense transactions
        if (t.type === 'expense') {
          await checkBudgetAlerts(t.category, t.amount);
        }
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      setTransactions(prev => prev.filter(trans => trans.id !== tempId));
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
        console.log('✅ [BudgetAlerts] In-app notification created successfully');
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
        console.log('⚠️ [BudgetAlerts] Push notification skipped:', pushError.message);
      } else {
        console.log('✅ [BudgetAlerts] Push notification sent successfully');
      }
    } catch (pushError: any) {
      console.log('⚠️ [BudgetAlerts] Push notification skipped:', pushError.message);
    }
  };

  // Check if budget threshold is reached and send notification
  const checkBudgetAlerts = async (category: string, amount: number) => {
    if (!supabase || !user) return;
    
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const monthStart = new Date(year, month - 1, 1);
      const nextMonth = new Date(year, month, 1);
      
      // Get budget for this category
      console.log('[BudgetAlerts] Fetching budget for category:', category, 'month:', monthStart.toISOString().split('T')[0]);
      
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', category)
        .gte('month', monthStart.toISOString().split('T')[0])
        .lt('month', nextMonth.toISOString().split('T')[0])
        .maybeSingle();

      if (budgetError) {
        console.error('[BudgetAlerts] Error fetching budget:', budgetError);
        console.error('[BudgetAlerts] Error details:', JSON.stringify(budgetError, null, 2));
        console.error('[BudgetAlerts] Error status:', (budgetError as any).status);
        console.error('[BudgetAlerts] Error code:', (budgetError as any).code);
        console.error('[BudgetAlerts] Error message:', (budgetError as any).message);
        console.error('[BudgetAlerts] Error hint:', (budgetError as any).hint);
        console.error('[BudgetAlerts] Error details:', (budgetError as any).details);
        
        // If 404, table might not exist or RLS policy blocking
        if ((budgetError as any).status === 404) {
          console.error('[BudgetAlerts] Budgets table not found or RLS blocking access');
          console.error('[BudgetAlerts] Check if table exists and RLS policies are correct');
        }
        return;
      }

      if (!budget) {
        console.log('[BudgetAlerts] No budget found for category:', category);
        return;
      }

      // Calculate total spent in this category - use proper date range
      const now = new Date();
      const curYear = now.getFullYear();
      const curMonth = now.getMonth() + 1;
      const mStart = new Date(curYear, curMonth - 1, 1);
      const mEnd = new Date(curYear, curMonth, 0);
      const startDateStr = mStart.toISOString().split('T')[0];
      const endDateStr = mEnd.toISOString().split('T')[0];
      
      const { data: spentTransactions, error: spentError } = await supabase
        .from('transactions_decrypted')
        .select('amount')
        .eq('user_id', user.id)
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
      
      if (budgetLimit <= 0) {
        console.log('[BudgetAlerts] Budget limit is 0, skipping');
        return;
      }

      const percentage = (totalSpent / budgetLimit) * 100;
      console.log('[BudgetAlerts] Category:', category, '| Spent:', totalSpent, '| Limit:', budgetLimit, '| Percentage:', percentage.toFixed(1) + '%');

      // Check thresholds: 80% and 100%
      const thresholds = [
        { value: 100, title: 'Orçamento Esgotado!', type: 'budget_100_percent' },
        { value: 80, title: 'Orçamento 80%', type: 'budget_80_percent' }
      ];

      for (const threshold of thresholds) {
        // Check if we crossed this threshold
        if (percentage >= threshold.value) {
          console.log('[BudgetAlerts] Threshold reached:', threshold.value + '%');
          
          // Check if alert already sent for this threshold this month
          const { data: existingAlerts, error: alertError } = await supabase
            .from('budget_alerts')
            .select('id, last_sent, threshold_percent')
            .eq('user_id', user.id)
            .eq('category', category)
            .eq('threshold_percent', threshold.value)
            .gte('last_sent', startDateStr)
            .lte('last_sent', endDateStr)
            .order('last_sent', { ascending: false })
            .limit(1);

          if (alertError) {
            console.error('[BudgetAlerts] Error checking existing alert:', alertError);
          }

          const existingAlert = existingAlerts && existingAlerts.length > 0 ? existingAlerts[0] : null;

          if (!existingAlert) {
            // No alert sent yet - send notification
            console.log('[BudgetAlerts] Sending notification for', threshold.value + '% threshold');
            
            // Send in-app notification
            sendInAppNotification(
              threshold.title,
              `Atingiste ${Math.round(percentage)}% do orçamento de ${category} (${totalSpent.toFixed(0)}€/${budgetLimit.toFixed(0)}€)`,
              '/dashboard/budgets',
              threshold.type
            );
            
            // Send push notification via OneSignal
            sendPushNotification(
              threshold.title,
              `Atingiste ${Math.round(percentage)}% do orçamento de ${category}`,
              threshold.type
            );

            // Mark alert as sent
            await supabase.from('budget_alerts').upsert({
              user_id: user.id,
              category,
              threshold_percent: threshold.value,
              enabled: true,
              last_sent: new Date().toISOString(),
            });
            
            console.log('[BudgetAlerts] Alert marked as sent');
          } else {
            // Alert was already sent - check if we need to re-send
            console.log('[BudgetAlerts] Alert already sent at:', existingAlert.last_sent);
            
            // Re-notify if percentage increased significantly (+5% from threshold)
            // Example: 80% threshold -> notify at 85%, 90%, 95%...
            const reNotifyThreshold = threshold.value + 5;
            const shouldReNotify = percentage >= reNotifyThreshold;
            
            if (shouldReNotify) {
              console.log('[BudgetAlerts] Percentage increased to', percentage.toFixed(1) + '%, re-sending notification');
              
              // Send in-app notification
              sendInAppNotification(
                threshold.title + ' (Atualização)',
                `Agora em ${Math.round(percentage)}% do orçamento de ${category} (${totalSpent.toFixed(0)}€/${budgetLimit.toFixed(0)}€)`,
                '/dashboard/budgets',
                threshold.type
              );
              
              // Send push notification via OneSignal
              sendPushNotification(
                threshold.title + ' (Atualização)',
                `Agora em ${Math.round(percentage)}% do orçamento de ${category}`,
                threshold.type
              );
              
              // Update alert timestamp
              await supabase.from('budget_alerts').upsert({
                user_id: user.id,
                category,
                threshold_percent: threshold.value,
                enabled: true,
                last_sent: new Date().toISOString(),
              });
            } else {
              console.log('[BudgetAlerts] No re-notification (need', reNotifyThreshold + '%, currently at', percentage.toFixed(1) + '%)');
            }
          }
        } else {
          // Below threshold - check if we should reset the alert
          // If percentage dropped significantly below threshold, allow re-notification next time
          const resetThreshold = threshold.value - 10; // Reset if drops 10% below
          
          if (percentage < resetThreshold) {
            console.log('[BudgetAlerts] Percentage dropped below', resetThreshold + '%, resetting alert');
            
            // Reset the alert so it can be re-sent when threshold is crossed again
            await supabase.from('budget_alerts')
              .update({ last_sent: null })
              .eq('user_id', user.id)
              .eq('category', category)
              .eq('threshold_percent', threshold.value);
            
            console.log('[BudgetAlerts] Alert reset - will notify again when threshold crossed');
          }
        }
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
    
    const { error } = await supabase
      .from('transactions')
      .update({ 
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
      })
      .eq('id', id)
      .eq('user_id', user.id);

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

    const tempId = `temp_${Date.now()}`;
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
      
      const { data: goalData } = await supabase
        .from('goals_decrypted')
        .select('*')
        .eq('id', newId)
        .single();

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
    
    console.log('[addGoalContribution] Adding contribution:', { goalId, amount, userId: user.id });
    
    const contributionDate = new Date().toISOString().split('T')[0];
    const month = contributionDate.slice(0, 7) + '-01';
    
    // Insert contribution
    const { error: insertError } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        amount,
        contribution_date: contributionDate,
        month,
      });

    if (insertError) {
      console.error('[addGoalContribution] Insert error:', insertError);
      throw insertError;
    }
    
    // Get current goal to calculate new current_amount
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .select('current_amount')
      .eq('id', goalId)
      .single();
    
    if (goalError) {
      console.error('[addGoalContribution] Goal fetch error:', goalError);
    }
    
    const currentVal = goal?.current_amount ? parseFloat(goal.current_amount) : 0;
    const newCurrentAmount = currentVal + amount;
    console.log('[addGoalContribution] Current DB:', currentVal, 'adding:', amount, 'new:', newCurrentAmount);
    
    // Update goal's current_amount - use just id
    const { error: updateError } = await supabase
      .from('goals')
      .update({ 
        current_amount: newCurrentAmount.toFixed(2),
        last_contribution_date: new Date().toISOString()
      })
      .eq('id', goalId);

    if (updateError) {
      console.error('[addGoalContribution] Update error:', updateError);
      throw updateError;
    }
    
    // Verify update
    const { data: verify } = await supabase
      .from('goals')
      .select('current_amount')
      .eq('id', goalId)
      .single();
    console.log('[addGoalContribution] Verify after update:', verify?.current_amount);
    
    // Update local state
    setGoals(prev => prev.map(goal => 
      goal.id === goalId ? { 
        ...goal, 
        current_amount: newCurrentAmount,
        last_contribution_date: new Date().toISOString()
      } : goal
    ));
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

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
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
    loading,
  }), [transactions, goals, budgets, loading]);

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