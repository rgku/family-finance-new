"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

const defaultCategories = [
  { value: "Moradia", icon: "home" },
  { value: "Alimentação", icon: "restaurant" },
  { value: "Transporte", icon: "directions_car" },
  { value: "Lazer", icon: "movie" },
  { value: "Saúde", icon: "local_hospital" },
  { value: "Educação", icon: "school" },
  { value: "Renda", icon: "work" },
  { value: "Outros", icon: "more_horiz" },
];

export default function NewTransaction() {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleDescriptionChange = async (value: string) => {
    setDescription(value);
    
    if (value.length > 3 && type === "expense") {
      setAnalyzing(true);
      try {
        const res = await fetch("/api/transactions/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: value }),
        });
        const data = await res.json();
        if (data.category) {
          setCategory(data.category);
        }
      } catch (err) {
        console.error("AI categorization failed:", err);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !description || !supabase) return;

    setLoading(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (!profile?.family_id) {
      alert("Precisa de criar ou pertencer a uma família primeiro.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      family_id: profile.family_id,
      user_id: user.id,
      description,
      amount: parseFloat(amount),
      type,
      category: category || "Outros",
      date,
    });

    if (error) {
      alert("Erro ao criar transação: " + error.message);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="font-semibold">Voltar</span>
        </Link>
        <h1 className="font-headline font-bold text-lg text-on-surface">Nova Transação</h1>
        <div className="w-16"></div>
      </header>

      <main className="pt-20 px-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 bg-surface-container rounded-full p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${
                type === "expense"
                  ? "bg-tertiary text-on-tertiary"
                  : "text-on-surface-variant"
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${
                type === "income"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant"
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Descrição
            </label>
            <div className="relative">
              <input
                type="text"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-slate-600 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Ex: Supermercado, Netflix..."
                required
              />
              {analyzing && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary animate-pulse">
                  ✨ A analisar...
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-5 py-4 text-on-surface placeholder:text-slate-600 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Categoria {category && <span className="text-primary">(sugerido pela IA)</span>}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {defaultCategories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    category === cat.value
                      ? "bg-primary/20 text-primary border border-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                  <span className="text-[10px] font-medium">{cat.value}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "A guardar..." : "Salvar Transação"}
          </button>
        </form>
      </main>
    </div>
  );
}