"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

const defaultIcons = [
  "directions_car", "flight", "home", "school", "shopping_bag", 
  "diamond", "celebration", "savings", "sports_esports"
];

export default function GoalsPage() {
  const { supabase, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("savings");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !targetAmount || !supabase) return;

    setLoading(true);

    // Get user's family_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (!profile?.family_id) {
      alert("Precisa de pertencer a uma família primeiro.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("goals").insert({
      family_id: profile.family_id,
      name,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount) || 0,
      deadline: deadline || null,
      icon,
    });

    if (error) {
      alert("Erro ao criar meta: " + error.message);
    } else {
      setShowForm(false);
      setName("");
      setTargetAmount("");
      setCurrentAmount("0");
      setDeadline("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-headline font-bold text-lg text-on-surface">Metas de Poupança</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-primary">{showForm ? "close" : "add"}</span>
        </button>
      </header>

      <main className="pt-20 px-6 max-w-2xl mx-auto">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container rounded-lg p-6 space-y-4 mb-6">
            <h2 className="font-headline font-bold text-lg mb-4">Nova Meta</h2>
            
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
                placeholder="Ex: Viagem ao Japão"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Meta (R$)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
                  placeholder="5000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Atual (R$)</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Prazo</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-2xl px-5 py-4 text-on-surface [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Ícone</label>
              <div className="grid grid-cols-5 gap-2">
                {defaultIcons.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`p-3 rounded-xl transition-all ${
                      icon === ic ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"
                    }`}
                  >
                    <span className="material-symbols-outlined">{ic}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-on-primary font-bold rounded-full hover:brightness-110 transition-all"
            >
              {loading ? "A guardar..." : "Criar Meta"}
            </button>
          </form>
        )}

        {/* Goals List - Show example data for now */}
        <div className="space-y-4">
          <div className="bg-surface-container-low rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">directions_car</span>
                </div>
                <div>
                  <p className="font-headline font-semibold">Novo Carro</p>
                  <p className="font-label text-xs text-on-surface-variant">R$ 45.000 de R$ 80.000</p>
                </div>
              </div>
              <span className="font-headline font-bold text-secondary">56%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-secondary to-on-secondary-container rounded-full" style={{ width: "56%" }}></div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">flight</span>
                </div>
                <div>
                  <p className="font-headline font-semibold">Viagem Japão</p>
                  <p className="font-label text-xs text-on-surface-variant">R$ 12.000 de R$ 15.000</p>
                </div>
              </div>
              <span className="font-headline font-bold text-secondary">80%</span>
            </div>
            <div className="w-full bg-surface-container-highest h-3 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-secondary to-on-secondary-container rounded-full" style={{ width: "80%" }}></div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-6 pt-2 bg-surface/80 backdrop-blur-xl rounded-t-[2rem]">
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-slate-500 p-3">
          <span className="material-symbols-outlined">home</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Home</span>
        </Link>
        <Link href="/dashboard/transaction/new" className="flex flex-col items-center justify-center text-slate-500 p-3">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Add</span>
        </Link>
        <Link href="/dashboard/goals" className="flex flex-col items-center justify-center bg-surface-container text-primary rounded-full p-3">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>track_changes</span>
          <span className="font-inter font-medium text-[10px] uppercase tracking-widest mt-1">Metas</span>
        </Link>
      </nav>
    </div>
  );
}