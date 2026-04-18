"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useData } from "@/hooks/DataProvider";
import { CURRENCY } from "@/lib/currency";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
  .map(c => c.value)
  .filter((v, i, a) => a.indexOf(v) === i)
  .sort((a, b) => {
    if (a === "Outros") return 1;
    if (b === "Outros") return -1;
    return a.localeCompare(b);
  });

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export default function NewTransaction() {
  const { user } = useAuth();
  const { addTransaction } = useData();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const categorizeDescription = useCallback(async (value: string) => {
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
  }, [type]);

  const debouncedCategorize = useRef(debounce(categorizeDescription, 500)).current;

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (value.length > 3 && type === "expense") {
      debouncedCategorize(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError("O valor deve ser maior que zero");
      return;
    }
    if (!description) {
      setError("A descrição é obrigatória");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addTransaction({
        description,
        amount: amountNum,
        type,
        category: category || "Outros",
        date,
      });
      
      router.push("/dashboard");
    } catch (err) {
      setError("Erro ao criar transação");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface">Nova Transação</h1>
        <p className="text-on-surface-variant">Adicione um novo gasto ou receita</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2 bg-surface-container rounded-full p-1">
          <button
            type="button"
            onClick={() => { setType("expense"); setCategory(""); setDescription(""); }}
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
            onClick={() => { setType("income"); setCategory(""); setDescription(""); }}
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
          <label htmlFor="description" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Descrição
          </label>
          <div className="relative">
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Ex: Supermercado, Netflix..."
              required
              aria-describedby={analyzing ? "analyzing-hint" : undefined}
            />
            {analyzing && (
              <span id="analyzing-hint" className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary animate-pulse">
                A analisar...
              </span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="amount" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Valor ({CURRENCY.symbol})
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">
              {CURRENCY.symbol}
            </span>
            <input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl pl-12 pr-5 py-4 text-on-surface placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="0,00"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="date" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Data
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface focus:ring-2 focus:ring-primary/20 transition-all [color-scheme:dark]"
            required
          />
        </div>

        <div>
          <span id="category-label" className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            Categoria {category && <span className="text-primary">(sugerido)</span>}
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const catInfo = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(c => c.value === cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    category === cat
                      ? "bg-primary/20 text-primary border border-primary"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{catInfo?.icon || "folder"}</span>
                  <span className="text-[10px] font-medium">{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-error text-sm text-center" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? "A guardar..." : "Salvar Transação"}
        </button>
      </form>
    </div>
  );
}