"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSupabase } from "@/hooks/useSupabase";

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
  
  budgets: Budget[];
  setCurrentBudgetMonth: (month: string) => void;
  addBudget: (b: Omit<Budget, "id" | "spent">) => Promise<void>;
  updateBudget: (id: string, b: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const supabase = useSupabase();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetsRaw, setBudgetsRaw] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setBudgetsRaw([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      const [transResult, goalsResult, budgetsResult] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      
      if (transResult.data) {
        setTransactions(transResult.data.map(t => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          type: t.type,
          category: t.category,
          date: t.date,
        })));
      }

      if (goalsResult.data) {
        setGoals(goalsResult.data.map(g => ({
          id: g.id,
          name: g.name,
          target_amount: Number(g.target_amount),
          current_amount: Number(g.current_amount),
          deadline: g.deadline,
          icon: g.icon || 'savings',
          goal_type: g.goal_type || 'savings',
        })));
      }

      if (budgetsResult.data) {
        setBudgetsRaw(budgetsResult.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const budgets = useMemo(() => {
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

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date,
      })
      .select()
      .single();

    if (error) throw error;
    
    if (data) {
      setTransactions(prev => [{
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        type: data.type,
        category: data.category,
        date: data.date,
      }, ...prev]);
    }
  };

  const updateTransaction = async (id: string, t: Partial<Transaction>) => {
    if (!user) throw new Error("Must be logged in");
    
    const { error } = await supabase
      .from('transactions')
      .update(t)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    setTransactions(prev => prev.map(trans => 
      trans.id === id ? { ...trans, ...t } : trans
    ));
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error("Must be logged in");
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    setTransactions(prev => prev.filter(trans => trans.id !== id));
  };

  const addGoal = async (g: Omit<Goal, "id">) => {
    if (!user) throw new Error("Must be logged in");

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        name: g.name,
        target_amount: g.target_amount,
        current_amount: g.current_amount || 0,
        deadline: g.deadline,
        icon: g.icon,
        goal_type: g.goal_type || 'savings',
      })
      .select()
      .single();

    if (error) throw error;
    
    if (data) {
      setGoals(prev => [...prev, {
        id: data.id,
        name: data.name,
        target_amount: Number(data.target_amount),
        current_amount: Number(data.current_amount),
        deadline: data.deadline,
        icon: data.icon || 'savings',
        goal_type: data.goal_type || 'savings',
      }]);
    }
  };

  const updateGoal = async (id: string, g: Partial<Goal>) => {
    if (!user) throw new Error("Must be logged in");
    
    const { error } = await supabase
      .from('goals')
      .update(g)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...g } : goal
    ));
  };

  const deleteGoal = async (id: string) => {
    if (!user) throw new Error("Must be logged in");
    
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const addBudget = async (b: Omit<Budget, "id" | "spent">) => {
    if (!user) throw new Error("Must be logged in");

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
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
      setBudgetsRaw(prev => [...prev, data]);
    }
  };

  const updateBudget = async (id: string, b: Partial<Budget>) => {
    if (!user) throw new Error("Must be logged in");
    
    const { error } = await supabase
      .from('budgets')
      .update({ limit_amount: b.limit })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    setBudgetsRaw(prev => prev.map(budget => 
      budget.id === id ? { ...budget, limit_amount: b.limit } : budget
    ));
  };

  const deleteBudget = async (id: string) => {
    if (!user) throw new Error("Must be logged in");
    
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    
    setBudgetsRaw(prev => prev.filter(budget => budget.id !== id));
  };

  const setCurrentBudgetMonth = (month: string) => {
    setCurrentMonth(month);
  };

  const contextValue = useMemo(() => ({
    transactions, addTransaction, updateTransaction, deleteTransaction,
    goals, addGoal, updateGoal, deleteGoal,
    budgets, setCurrentBudgetMonth, addBudget, updateBudget, deleteBudget,
    loading,
  }), [transactions, goals, budgetsRaw, currentMonth, loading]);

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