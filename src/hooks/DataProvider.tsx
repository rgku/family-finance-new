"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  goals: Goal[];
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, g: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  
  budgets: Budget[];
  addBudget: (b: Omit<Budget, "id" | "spent">) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  // Initialize with demo data from localStorage or defaults
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", description: "Salário", amount: 5200, type: "income", category: "Renda", date: "2024-04-01" },
    { id: "2", description: "Supermercado", amount: 150, type: "expense", category: "Alimentação", date: "2024-04-03" },
    { id: "3", description: "Restaurante", amount: 85, type: "expense", category: "Lazer", date: "2024-04-05" },
    { id: "4", description: "Farmácia", amount: 45, type: "expense", category: "Saúde", date: "2024-04-07" },
    { id: "5", description: "Uber", amount: 32, type: "expense", category: "Transporte", date: "2024-04-08" },
  ]);

  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", name: "Novo Carro", target_amount: 80000, current_amount: 45000, icon: "directions_car" },
    { id: "2", name: "Viagem Japão", target_amount: 15000, current_amount: 12000, icon: "flight" },
  ]);

  const [budgets, setBudgets] = useState<Budget[]>([
    { id: "1", category: "Alimentação", limit: 800, spent: 650 },
    { id: "2", category: "Moradia", limit: 1200, spent: 1200 },
    { id: "3", category: "Transporte", limit: 300, spent: 180 },
  ]);

  const addTransaction = (t: Omit<Transaction, "id">) => {
    const newTransaction = { ...t, id: Date.now().toString() };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, t: Partial<Transaction>) => {
    setTransactions(prev => prev.map(trans => trans.id === id ? { ...trans, ...t } : trans));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(trans => trans.id !== id));
  };

  const addGoal = (g: Omit<Goal, "id">) => {
    const newGoal = { ...g, id: Date.now().toString() };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, g: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => goal.id === id ? { ...goal, ...g } : goal));
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const addBudget = (b: Omit<Budget, "id" | "spent">) => {
    const newBudget = { ...b, id: Date.now().toString(), spent: 0 };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (id: string, b: Partial<Budget>) => {
    setBudgets(prev => prev.map(budget => budget.id === id ? { ...budget, ...b } : budget));
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  };

  return (
    <DataContext.Provider value={{
      transactions, addTransaction, updateTransaction, deleteTransaction,
      goals, addGoal, updateGoal, deleteGoal,
      budgets, addBudget, updateBudget, deleteBudget,
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