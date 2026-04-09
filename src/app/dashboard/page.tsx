"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
}

export default function Dashboard() {
  const { user, signOut, supabase, loading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [balance, setBalance] = useState({ total: 0, income: 0, expenses: 0 });

  useEffect(() => {
    if (user && !loading && supabase) {
      loadDashboardData();
    }
  }, [user, loading, supabase]);

  const loadDashboardData = async () => {
    if (!supabase) return;
    
    // Load transactions
    const { data: transData } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(10);

    if (transData) {
      setTransactions(transData as Transaction[]);
      
      const income = transData
        .filter((t: Transaction) => t.type === "income")
        .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
      const expenses = transData
        .filter((t: Transaction) => t.type === "expense")
        .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
      
      setBalance({
        total: income - expenses,
        income,
        expenses,
      });
    }

    // Load goals
    const { data: goalsData } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    if (goalsData) {
      setGoals(goalsData as Goal[]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant">A carregar...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <p className="text-on-surface-variant">A redirecionar...</p>
      </div>
    );
  }

  return (
    <>
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
          <span className="font-headline font-bold text-lg tracking-tight text-primary">
            {new Date().toLocaleDateString("pt-BR", { month: "long" }).charAt(0).toUpperCase() + new Date().toLocaleDateString("pt-BR", { month: "long" }).slice(1)}
          </span>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors active:scale-90 transition-all text-primary">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8 pb-32">
        {/* Hero Balance Card */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-container rounded-lg p-8 text-on-primary shadow-2xl">
          <div className="relative z-10">
            <p className="font-label text-sm font-medium opacity-80 mb-1">Saldo Atual</p>
            <h2 className="font-headline text-4xl font-extrabold tracking-tight">
              R$ {balance.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h2>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold bg-white/10 backdrop-blur-md w-fit px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              <span>+12% este mês</span>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </section>

        {/* Income & Expense Bento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container rounded-lg p-5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">arrow_downward</span>
            </div>
            <div>
              <p className="font-label text-xs text-on-surface-variant font-medium">Receitas</p>
              <p className="font-headline text-xl font-bold text-primary">
                +R$ {balance.income.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="bg-surface-container rounded-lg p-5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">arrow_upward</span>
            </div>
            <div>
              <p className="font-label text-xs text-on-surface-variant font-medium">Despesas</p>
              <p className="font-headline text-xl font-bold text-tertiary">
                -R$ {balance.expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Goals Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-headline text-xl font-bold text-on-surface">Metas</h3>
            <Link href="/dashboard/goals" className="text-primary text-sm font-semibold">Ver todas</Link>
          </div>
          <div className="space-y-4">
            {goals.length > 0 ? (
              goals.map((goal) => {
                const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                return (
                  <div key={goal.id} className="bg-surface-container-low rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">{goal.icon || "savings"}</span>
                        </div>
                        <div>
                          <p className="font-headline font-semibold">{goal.name}</p>
                          <p className="font-label text-xs text-on-surface-variant">
                            R$ {goal.current_amount.toLocaleString("pt-BR")} de R$ {goal.target_amount.toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <span className="font-headline font-bold text-secondary">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-secondary to-on-secondary-container rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-surface-container-low rounded-lg p-6 text-center">
                <p className="text-on-surface-variant">Nenhuma meta definida</p>
              </div>
            )}
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-headline text-xl font-bold text-on-surface">Transações</h3>
            <Link href="/dashboard/transactions" className="text-primary text-sm font-semibold hover:bg-primary/5 px-2 py-1 rounded-full transition-colors">Ver histórico</Link>
          </div>
          <div className="space-y-1">
            {transactions.length > 0 ? (
              transactions.slice(0, 5).map((trans) => (
                <div key={trans.id} className="flex items-center justify-between p-4 bg-surface-container rounded-lg group hover:bg-surface-container-high transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined">
                        {trans.type === "income" ? "payments" : "shopping_bag"}
                      </span>
                    </div>
                    <div>
                      <p className="font-headline font-semibold">{trans.description}</p>
                      <p className="font-label text-xs text-on-surface-variant">{trans.category}</p>
                    </div>
                  </div>
                  <p className={`font-headline font-bold ${trans.type === "income" ? "text-primary" : "text-tertiary"}`}>
                    {trans.type === "income" ? "+" : "-"}R$ {Number(trans.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-surface-container rounded-lg p-8 text-center">
                <p className="text-on-surface-variant">Nenhuma transação registada</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]">
        <Link href="/dashboard" className="flex flex-col items-center justify-center bg-surface-container text-primary rounded-full p-3 transition-transform active:scale-95">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Home</span>
        </Link>
        <Link href="/dashboard/transaction/new" className="flex flex-col items-center justify-center text-slate-500 p-3 transition-transform active:scale-95 hover:text-primary">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Add</span>
        </Link>
        <Link href="/dashboard/goals" className="flex flex-col items-center justify-center text-slate-500 p-3 transition-transform active:scale-95 hover:text-primary">
          <span className="material-symbols-outlined">track_changes</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Metas</span>
        </Link>
        <button onClick={signOut} className="flex flex-col items-center justify-center text-slate-500 p-3 transition-transform active:scale-95 hover:text-primary">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Sair</span>
        </button>
      </nav>
    </>
  );
}