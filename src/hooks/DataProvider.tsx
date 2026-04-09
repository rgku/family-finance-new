"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/components/AuthProvider";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

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
  addBudget: (b: Omit<Budget, "id" | "spent">) => Promise<void>;
  updateBudget: (id: string, b: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const supabase = createBrowserClient(supabaseUrl, supabaseKey);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setBudgets([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch transactions - filtered by user_id
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (transData) {
        setTransactions(transData.map(t => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          type: t.type,
          category: t.category,
          date: t.date,
        })));
      }

      // Fetch goals - filtered by user_id
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (goalsData) {
        setGoals(goalsData.map(g => ({
          id: g.id,
          name: g.name,
          target_amount: Number(g.target_amount),
          current_amount: Number(g.current_amount),
          deadline: g.deadline,
          icon: g.icon || 'savings',
        })));
      }

      // Fetch budgets - filtered by user_id
      const { data: budgetsData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (budgetsData) {
        setBudgets(budgetsData.map(b => ({
          id: b.id,
          category: b.category,
          limit: Number(b.limit_amount),
          spent: Number(b.limit_amount) * 0.5,
        })));
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

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
      setBudgets(prev => [...prev, {
        id: data.id,
        category: data.category,
        limit: Number(data.limit_amount),
        spent: 0,
      }]);
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
    
    setBudgets(prev => prev.map(budget => 
      budget.id === id ? { ...budget, ...b } : budget
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
    
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  return (
    <DataContext.Provider value={{
      transactions, addTransaction, updateTransaction, deleteTransaction,
      goals, addGoal, updateGoal, deleteGoal,
      budgets, addBudget, updateBudget, deleteBudget,
      loading,
    }}>
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